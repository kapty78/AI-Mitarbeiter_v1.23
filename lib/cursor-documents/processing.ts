import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { Document, DocumentChunk } from '@/types/cursor-documents'
import { chunkTextForKnowledgeBase } from '@/lib/knowledge-base/chunking'
import { extractTextFromFile } from '@/lib/knowledge-base/extraction'
import { generateEmbeddings } from '@/lib/knowledge-base/embedding'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Initialize Supabase client (server-side only)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'KEY_NOT_FOUND'
console.log('!!! DEBUG - Service Key Check:', serviceRoleKey ? 
  'Key exists (length: ' + serviceRoleKey.length + ', starts with: ' + 
  serviceRoleKey.substring(0, 3) + '..., ends with: ...' + 
  serviceRoleKey.substring(serviceRoleKey.length - 3) + ')' : 
  'Key is missing or empty')

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey
)

/**
 * Uploads a file to Supabase Storage
 * @param file The file to upload
 * @param userId The user ID
 * @param workspaceId Optional workspace ID
 * @returns The storage URL
 */
export const uploadFileToStorage = async (
  file: File,
  userId: string,
  workspaceId?: string
): Promise<string> => {
  try {
    const fileBuffer = await file.arrayBuffer()
    const fileId = uuidv4()
    const fileExtension = file.name.split('.').pop()
    
    // *** TEMPORARY TEST: Use a simplified path ***
    // OLD: const filePath = `${userId}${workspaceId ? `/${workspaceId}` : ''}/${fileId}.${fileExtension}`
    const filePath = `uploads_test/${fileId}.${fileExtension}` // Simple path
    console.log("!!! USING TEMPORARY SIMPLIFIED STORAGE PATH:", filePath); // DEBUG
    
    console.log('Attempting storage upload:', filePath); // DEBUG
    console.log('Current supabaseAdmin client settings:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyStatus: serviceRoleKey ? `Key length: ${serviceRoleKey.length}` : 'No key found',
      bucket: 'documents'
    });
    
    const { data, error } = await supabaseAdmin
      .storage
      .from('documents') // Keep the correct bucket name
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })
    console.log('Storage upload result:', { data, error }); // DEBUG
    
    if (error) {
      console.error('Error uploading file to storage:', {
        message: error.message,
        name: error.name,
        errorObject: error
      })
      
      // Check for RLS violations specifically
      if (error.message.includes('row-level security') || error.message.includes('RLS')) {
        console.error('RLS VIOLATION DETECTED: Service role key may not be working correctly or RLS policy is misconfigured');
        
        // Test if we can at least access the bucket (this won't upload but checks permissions)
        const { data: listData, error: listError } = await supabaseAdmin
          .storage
          .from('documents')
          .list('uploads_test', { limit: 1 })
          
        console.error('Bucket list test result:', { 
          canList: listError ? 'No' : 'Yes',
          listError
        });
      }
      
      throw new Error(`Failed to upload file to storage: ${error.message}`)
    }
    
    // Get public URL for the file
    const { data: urlData } = supabaseAdmin
      .storage
      .from('documents')
      .getPublicUrl(filePath)
    
    return urlData.publicUrl
  } catch (error: any) {
    console.error('Unexpected exception in uploadFileToStorage:', error);
    throw error;
  }
}

/**
 * Creates a document record in the database
 * @param documentData The document data
 * @returns The created document
 */
export const createDocumentRecord = async (
  documentData: Omit<Document, 'id' | 'created_at' | 'updated_at'>
): Promise<Document> => {
  console.log('Attempting document record insert...'); // DEBUG
  const { data, error } = await supabaseAdmin
    .from('documents')
    .insert(documentData)
    .select()
    .single()
  console.log('Document record insert result:', { data, error }); // DEBUG
  
  if (error) {
    console.error('Error creating document record:', error)
    throw new Error(`Failed to create document record: ${error.message}`)
  }
  
  return data
}

/**
 * Updates the document processing status
 * @param documentId The document ID
 * @param status The processing status
 * @param progress The processing progress (0-100)
 * @param error Optional error message
 */
export const updateDocumentStatus = async (
  documentId: string,
  status: 'uploading' | 'processing' | 'embedding' | 'completed' | 'failed',
  progress: number,
  error?: string
): Promise<void> => {
  // Runde den Fortschrittswert auf ganze Zahlen
  const roundedProgress = Math.round(progress);
  
  // Check if document_processing_status table exists before upserting
  // Note: This check might add slight overhead but prevents errors if the table is missing.
  // Consider removing if performance is critical and table existence is guaranteed.
  try {
    const { error: checkError } = await supabaseAdmin
      .from('document_processing_status')
      .select('document_id', { count: 'exact', head: true })
      .limit(1);

    if (checkError && checkError.code === '42P01') { // 42P01: undefined_table
        console.error('CRITICAL: \'document_processing_status\' table does not exist. Cannot update status.');
        return; // Stop further execution for status update
    } else if (checkError) {
        console.warn('Warning checking document_processing_status table:', checkError)
        // Continue anyway, maybe a transient error
    }

    // Proceed with upsert if table check passed or only warned
    const { data, error: statusError } = await supabaseAdmin
      .from('document_processing_status')
      .upsert({
        document_id: documentId,
        status,
        progress: roundedProgress,
        error,
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (statusError) {
      console.error('Error updating document status:', statusError)
      // Non-critical, continue without throwing
    }
  } catch (err) {
      console.error('Unexpected error during status update check:', err)
  }
}

/**
 * Extracts both potential user questions and key facts from a text chunk
 * @param chunk The text chunk
 * @returns Array of knowledge items (questions and facts) with content and source reference
 */
const extractFactsFromChunk = async (chunk: string, chunkIndex: number): Promise<Array<{content: string, sourceChunk: number}>> => {
  try {
    // Use OpenAI to extract potential questions and key facts from the chunk
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte im Generieren von Knowledge-Items für eine Vektordatenbank, die für ein RAG-System (Retrieval Augmented Generation) verwendet wird. Erstelle sowohl direkte Fragen als auch wichtige Fakten, die bei verschiedenen Suchmustern gefunden werden können."
        },
        {
          role: "user",
          content: `Analysiere den folgenden Textabschnitt und erstelle zwei Arten von Knowledge-Items:

1. NUTZER-FRAGEN: Mögliche Fragen, die Nutzer zu diesem Inhalt stellen könnten:
   - Direkte Fragen: "Wo befinden sich die Serverstandorte?"
   - Varianten: "Wo stehen die Server?", "In welchem Land sind die Server?"
   - Detailfragen: "Welche ISO-Zertifizierung haben die Server?"
   - Fragen zu Problemen: "Was tun bei langsamem Server?", "Warum sind die Antwortzeiten so langsam?"
   - Fragen nach Wichtigkeit: "Warum ist es wichtig, die Serverantwortzeiten zu überwachen?"

2. WICHTIGE FAKTEN: Kernaussagen in verschiedenen Formaten:
   - Direkte Aussagen: "Server stehen in Deutschland"
   - Problem-Lösungs-Paare: "Problem: 504 Gateway Timeout | Lösung: Modell wechseln"
   - Technische Informationen: "Serverantwortzeiten beeinflussen die Benutzererfahrung"
   - Wenn-Dann-Regeln: "Wenn die Serverantwort zu langsam ist, kann ein 504 Gateway Timeout auftreten"
   - Wichtigkeits-Aussagen: "Die Überwachung von Serverantwortzeiten ist wichtig für die Systemperfomance"

WICHTIG: 
- Jedes Knowledge-Item muss eine eigenständige Frage, Aussage oder Information sein
- Keine Labels, Präfixe oder Kategorie-Marker verwenden (z.B. NICHT "FRAGE:", "NUTZER-FRAGEN:", usw.) 
- Nur den reinen Inhalt ohne Formatierungshinweise ausgeben
- Jede wichtige Information sollte durch mehrere Knowledge-Items repräsentiert werden

Text:
---
${chunk}
---`
        }
      ],
      temperature: 0.3,
    });
    
    // Extract knowledge items from the response
    const knowledgeText = response.choices[0].message.content;
    // Split into an array (one item per line)
    const knowledgeArray = knowledgeText?.split('\n')
      .filter(item => item.trim().length > 0)
      .map(item => item.trim())
      // Remove numbering and basic formatting
      .map(item => item.replace(/^\d+[\.\)]\s*/, '').trim())
      // Remove all kinds of category markers and prefixes
      .map(item => item
        .replace(/^(FRAGE|NUTZER-FRAGE|FAKT|WICHTIGER FAKT|NUTZER-FRAGEN|DIREKTE FRAGEN|VARIANTEN|DETAILFRAGEN|WICHTIGE FAKTEN|PROBLEM-LÖSUNGS-PAARE|TECHNISCHE INFORMATIONEN|WENN-DANN-REGELN|WICHTIGKEITS-AUSSAGEN)[:;-–—]\s*/i, '')
        .replace(/^[-–—•*]\s*/, '') // Remove bullet points
        .replace(/^["'](.+)["']$/, '$1') // Remove surrounding quotes
        .trim()
      ) || [];
    
    // Filter out any items that still contain category markers (second-level filtering)
    const cleanedArray = knowledgeArray.filter(item => 
      !item.startsWith('NUTZER-FRAGEN') && 
      !item.startsWith('DIREKTE FRAGEN') && 
      !item.startsWith('VARIANTEN') && 
      !item.startsWith('DETAILFRAGEN') && 
      !item.startsWith('WICHTIGE FAKTEN') &&
      !item.startsWith('TECHNISCHE INFORMATIONEN') &&
      !item.startsWith('WENN-DANN-REGELN') &&
      !item.startsWith('WICHTIGKEITS-AUSSAGEN') &&
      item.length > 10 // Mindestens 10 Zeichen
    );
    
    // Add source reference to each knowledge item
    const knowledgeItemsWithSource = cleanedArray.map(item => ({
      content: item,
      sourceChunk: chunkIndex
    }));
    
    console.log(`Generated ${knowledgeItemsWithSource.length} knowledge items from chunk ${chunkIndex}`);
    
    return knowledgeItemsWithSource;
  } catch (error) {
    console.error('Error generating knowledge items from chunk:', error);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Preprocesses a text chunk to optimize it for storage and AI prompting
 * Makes the chunk more structured, readable, and informative when used as context
 * @param chunk The raw text chunk
 * @param fileName File name for reference
 * @param pageNumber Page number (if applicable)
 * @returns Processed text chunk
 */
const preprocessChunk = async (chunk: string, fileName: string, pageNumber: number): Promise<string> => {
  if (!chunk || chunk.trim().length === 0) return '';
  
  try {
    // Use OpenAI to structure and enhance the chunk
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a lighter model to save costs
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte für Textaufbereitung. WICHTIGSTE REGEL: KEINE Informationen dürfen verloren gehen oder verändert werden. Deine Aufgabe ist es, Text aus einem PDF so aufzubereiten, dass er als optimaler Kontext für KI-Systeme dienen kann, während du ALLE Fakten und Informationen beibehältst. Jede einzelne Information, Zahl, Name oder Fakt MUSS erhalten bleiben."
        },
        {
          role: "user",
          content: `Bereite den folgenden Textabschnitt aus "${fileName}" (Seite ${pageNumber}) so auf, dass er für ein KI-System als optimaler Kontext dienen kann:
          
1. ABSOLUTE HÖCHSTE PRIORITÄT: Behalte 100% ALLE inhaltlichen Informationen bei - NICHTS darf verloren gehen, aber auch nichts erfunden werden.
2. Wandle ALLE strukturierten Informationen (Tabellen, Listen, FAQs) in vollständige in vollständige verständlich und in sich logische Sätze um.
3. Behalte eine klare Abschnittsstruktur mit aussagekräftigen Überschriften bei.
4. Schreibe für jede Information einen vollständigen Satz, auch wenn es redundant erscheint.
5. Wichtig: Das Ergebnis muss ein zusammenhängender Text sein, der die ganzen Informationen einer Seite beinhaltet.
Text:
${chunk}
`
        }
      ],
      temperature: 0.1,
    });
    
    // Get the processed text
    const processedText = response.choices[0].message.content || chunk;
    
    // Überprüfe, dass kein signifikanter Informationsverlust stattgefunden hat
    // Dies ist ein einfacher Längencheck - im Zweifelsfall behalten wir den Originaltext bei
    const originalLength = chunk.replace(/\s+/g, '').length;
    const processedLength = processedText.replace(/\s+/g, '').length;
    
    // Prüfe, ob das Ergebnis ausreichend vollständige Sätze enthält
    const sentenceCount = (processedText.match(/[.!?]+\s*[A-Z0-9]/g) || []).length;
    const minExpectedSentences = 5; // Erwarten mindestens 5 Sätze für einen typischen Chunk
    
    // Wenn mehr als 10% der Nicht-Whitespace-Zeichen verloren gegangen sind oder zu wenige Sätze, verwende Original
    if (processedLength < originalLength * 0.9 || sentenceCount < minExpectedSentences) {
      console.warn(`Chunk (Page ${pageNumber}) preprocessing resulted in possible information loss or insufficient sentence structure. Using original text.`);
      return chunk;
    }
    
    console.log(`Chunk (Page ${pageNumber}) preprocessed for better AI readability with ${sentenceCount} complete sentences`);
    return processedText;
  } catch (error) {
    console.error('Error preprocessing chunk:', error);
    // Return original chunk if processing fails
    return chunk;
  }
}

/**
 * Processes a document file, extracts text, chunks it, and generates embeddings
 * @param document The document record
 * @param file The document file
 * @param knowledgeBaseId Optional knowledge base ID for facts extraction
 * @param userId The user ID who uploaded the document
 */
export const processDocumentFile = async (
  document: Document,
  file: File,
  knowledgeBaseId?: string,
  userId?: string
): Promise<void> => {
  try {
    console.log('--- processDocumentFile started ---', { documentId: document.id, fileName: file.name }); // DEBUG
    // Update status to processing
    await updateDocumentStatus(document.id, 'processing', 10)
    
    // Extract text from file
    console.log('Extracting text...'); // DEBUG
    const extractedText = await extractTextFromFile(file, (progress) => {
      console.log(`Extraction progress: ${Math.round(progress.percentComplete)}%`); // DEBUG
      updateDocumentStatus(document.id, 'processing', 10 + Math.round(progress.percentComplete * 0.3))
    })
    
    // Step 1: Split PDF into pages (chunks)
    // For PDFs, extractedText is already an array of page texts
    const rawPageChunks = Array.isArray(extractedText) 
      ? extractedText 
      : [extractedText]; // For non-PDFs, treat the whole text as one chunk
    
    console.log(`Text extracted (${rawPageChunks.length} pages/chunks).`); // DEBUG
    
    // Step 1.5: Preprocess each chunk to optimize for AI context
    console.log('Preprocessing chunks for better AI readability...'); // DEBUG
    const pageChunks = [];
    for (let i = 0; i < rawPageChunks.length; i++) {
      const pageNum = i + 1;
      const processedChunk = await preprocessChunk(rawPageChunks[i], document.file_name, pageNum);
      pageChunks.push(processedChunk);
      
      // Update progress during preprocessing
      const progress = 40 + Math.round((i + 1) / rawPageChunks.length * 10);
      await updateDocumentStatus(document.id, 'processing', progress);
    }
    
    // Update status to page chunking complete
    await updateDocumentStatus(document.id, 'processing', 50)
    
    // Insert page chunks into database
    console.log('Inserting page chunks...'); // DEBUG
    // Entferne chunk_type um Schema-Cache-Fehler zu vermeiden
    const pageChunkRecords = pageChunks.map((pageContent, index) => ({
      document_id: document.id,
      content: pageContent,
      content_position: index,
      chunk_size: pageContent.length,
      created_at: new Date().toISOString()
    }));
    
    const { data: insertedChunks, error: chunkInsertError } = await supabaseAdmin
      .from('document_chunks')
      .insert(pageChunkRecords)
      .select('id, content_position');
    
    if (chunkInsertError) {
      console.error('Error inserting page chunks:', chunkInsertError);
      throw new Error(`Failed to insert page chunks: ${chunkInsertError.message}`);
    }
    
    console.log(`Inserted ${insertedChunks.length} page chunks.`); // DEBUG
    
    // Step 2: Extract facts from each page/chunk
    console.log('Extracting facts from chunks...'); // DEBUG
    await updateDocumentStatus(document.id, 'processing', 60);
    
    let allFacts: Array<{content: string, sourceChunk: number}> = [];
    for (let i = 0; i < insertedChunks.length; i++) {
      const chunk = insertedChunks[i];
      const progress = 60 + Math.round((i + 1) / insertedChunks.length * 10);
      await updateDocumentStatus(document.id, 'processing', progress);
      
      console.log(`Extracting facts from chunk ${i+1}/${insertedChunks.length}...`);
      const facts = await extractFactsFromChunk(pageChunks[chunk.content_position], chunk.id);
      allFacts = [...allFacts, ...facts];
    }
    
    console.log(`Extracted ${allFacts.length} facts from ${insertedChunks.length} chunks.`); // DEBUG
    
    // Update status to fact extraction complete
    await updateDocumentStatus(document.id, 'embedding', 70);
    
    // Überprüfen, ob die erforderlichen Parameter vorhanden sind
    if (!knowledgeBaseId) {
      console.warn('No knowledge base ID provided, using default');
      // Versuche, eine Standard-Knowledge-Base zu finden
      const { data: kbs, error: kbError } = await supabaseAdmin
        .from('knowledge_bases')
        .select('id')
        .limit(1);
      
      if (kbError || !kbs || kbs.length === 0) {
        throw new Error('No knowledge base ID provided and no default found');
      }
      
      knowledgeBaseId = kbs[0].id;
    }
    
    if (!userId) {
      // Verwende den user_id vom Dokument
      userId = document.user_id;
    }
    
    // Step 3: Create embeddings for facts and store with source reference
    console.log('Generating embeddings for facts...'); // DEBUG
    
    // Process facts in batches to avoid rate limits
    const batchSize = 20;
    const factCount = allFacts.length;
    let processedFacts = 0;
    
    for (let i = 0; i < allFacts.length; i += batchSize) {
      const batchFacts = allFacts.slice(i, i + batchSize);
      console.log(`Processing fact batch ${i / batchSize + 1} of ${Math.ceil(factCount / batchSize)}`); // DEBUG
      
      // Generate embeddings for the facts
      const factChunks = batchFacts.map(fact => ({
        content: fact.content,
        tokens: fact.content.split(/\s+/).length // Ungefähre Token-Anzahl
      }));
      const embeddings = await generateEmbeddings(factChunks, 'openai');
      
      // Prepare knowledge item records with links to source chunks
      const knowledgeItems = batchFacts.map((fact, index) => ({
        document_id: document.id,
        content: fact.content,
        openai_embedding: embeddings[index], // Korrekt: openai_embedding statt embedding
        source_chunk: fact.sourceChunk, // Link to the source chunk
        knowledge_base_id: knowledgeBaseId, // Erforderliches Feld
        user_id: userId, // Erforderliches Feld
        tokens: factChunks[index].tokens, // Erforderliches Feld
        source_type: 'document', // Erforderliches Feld
        source_name: document.title || document.file_name, // Erforderliches Feld
        created_at: new Date().toISOString()
      }));
      
      // Insert knowledge items into database
      console.log(`Inserting ${knowledgeItems.length} knowledge items...`);
      const { error: itemsError } = await supabaseAdmin
        .from('knowledge_items')
        .insert(knowledgeItems);
      
      if (itemsError) {
        console.error('Error inserting knowledge items:', itemsError);
        throw new Error(`Failed to insert knowledge items: ${itemsError.message}`);
      }
      
      // Update progress
      processedFacts += batchFacts.length;
      const progress = 70 + Math.round((processedFacts / factCount) * 30);
      console.log(`Embedding progress: ${Math.round(progress)}%`); // DEBUG
      await updateDocumentStatus(document.id, 'embedding', progress);
    }
    
    // Update status to completed
    console.log('Processing complete. Setting status to completed.'); // DEBUG
    await updateDocumentStatus(document.id, 'completed', 100);
    
  } catch (error: any) {
    console.error('!!! Error in processDocumentFile:', error); // DEBUG
    await updateDocumentStatus(document.id, 'failed', 0, error.message);
    // Do not re-throw here, allow processDocument to catch the original error if needed
  }
}

/**
 * Complete document processing workflow from upload to embedding
 * @param file The file to process
 * @param userId The user ID
 * @param title Optional document title
 * @param description Optional document description
 * @param workspaceId Optional workspace ID
 * @param knowledgeBaseId Optional knowledge base ID
 * @returns The document ID
 */
export const processDocument = async (
  file: File, 
  userId: string,
  title?: string,
  description?: string,
  workspaceId?: string,
  knowledgeBaseId?: string
): Promise<string> => {
  console.log('--- processDocument started ---', { fileName: file.name, userId, workspaceId }); // DEBUG
  try {
    // Upload file to Supabase Storage
    const storageUrl = await uploadFileToStorage(file, userId, workspaceId)
    console.log('File uploaded to storage:', storageUrl); // DEBUG
    
    // Create document record
    const document = await createDocumentRecord({
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_url: storageUrl,
      title: title || file.name,
      description,
      user_id: userId,
      workspace_id: workspaceId
    })
    console.log('Document record created:', document.id); // DEBUG
    
    // Process document in background (async, fire-and-forget)
    // Intentionally not awaiting this promise
    processDocumentFile(document, file, knowledgeBaseId, userId).catch(error => {
      // Log the error but don't crash the initial request
      console.error('!!! Background document processing failed:', error); // DEBUG
    })
    
    return document.id // Return immediately after initiating background processing
  } catch (error) {
    console.error('!!! Error in processDocument (initial phase):', error); // DEBUG
    throw error // Re-throw to be caught by the API route
  }
} 