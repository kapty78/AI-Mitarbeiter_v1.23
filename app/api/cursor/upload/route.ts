import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processDocument } from '@/lib/cursor-documents/processing'
import OpenAI from 'openai'
import { generateEmbeddings } from '@/lib/knowledge-base/embedding'

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// }; // Remove this deprecated config

export const dynamic = 'force-dynamic'; // Prevent static generation
export const maxDuration = 60; // Increase timeout to 5 minutes for large files

// Initialisiere OpenAI-Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Handles document upload requests
 * Receives the file as a FormData object
 * Processes the document and returns the document ID
 */
export async function POST(req: NextRequest) {
  console.log('--- API /api/cursor/upload reached ---'); // DEBUG
  try {
    // Extract auth token from request
    const authHeader = req.headers.get('authorization')
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null
    
    if (!authToken) {
      console.log('No authentication token provided')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Initialize Supabase client with auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      }
    )
    
    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('Unauthorized - User error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('User authenticated:', user.id); // DEBUG
    
    // Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Get form fields
    const title = formData.get('title') as string | null
    const description = formData.get('description') as string | null
    const workspaceId = formData.get('workspace_id') as string | null
    let knowledgeBaseId = formData.get('knowledge_base_id') as string | null
    
    console.log(`File: ${file.name}, Size: ${file.size}, Type: ${file.type}`)
    console.log('FormData parsed:', { fileName: file?.name, title, workspaceId, knowledgeBaseId }); // DEBUG
    
    // Validate file
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Empty file' },
        { status: 400 }
      )
    }
    
    // Check file type
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }
    
    // Process the document (uploads, chunks, creates chunks with embeddings)
    try {
      console.log('🔄 Calling processDocument and waiting for completion...'); 
      const documentId = await processDocument(
        file,
        user.id,
        title || undefined,
        description || undefined,
        workspaceId || undefined,
        knowledgeBaseId || undefined
      )
      
      console.log('✅ Initial document processing (upload & chunking) complete for ID:', documentId);
      
      // --- START: Restore Knowledge Item Creation Logic ---
      console.log(`ℹ️ Starting Knowledge Item creation flow for Document ID: ${documentId}`);
      let knowledgeItemStatus: any = { status: 'pending', message: 'Waiting to create knowledge item.' };
      
      // 1. Find or Create Knowledge Base ID
      if (!knowledgeBaseId) {
        console.log('⚠️ No knowledge base ID provided, attempting to find or create a default one');
        try {
          const { data: userKnowledgeBases, error: userKbError } = await supabase
            .from('knowledge_bases')
            .select('id, name')
            .eq('user_id', user.id)
            .limit(1);
            
          if (userKbError) throw new Error(`Error fetching user knowledge bases: ${userKbError.message}`);
          
          if (!userKnowledgeBases || userKnowledgeBases.length === 0) {
            console.log('📝 Creating a default knowledge base for the user.');
            const { data: newKb, error: createKbError } = await supabase.from('knowledge_bases')
              .insert({ name: 'Default Knowledge Base', user_id: user.id })
              .select()
              .single();
            if (createKbError) throw new Error(`Error creating default knowledge base: ${createKbError.message}`);
            knowledgeBaseId = newKb.id;
            console.log(`✅ Created default knowledge base with ID: ${knowledgeBaseId}`);
          } else {
            knowledgeBaseId = userKnowledgeBases[0].id;
            console.log(`✅ Using existing knowledge base: ${userKnowledgeBases[0].name} (${knowledgeBaseId})`);
          }
        } catch (kbError: any) {
          console.error(`❌ Error setting up knowledge base: ${kbError.message}`);
          knowledgeItemStatus = { status: 'failed', message: `Failed to find/create knowledge base: ${kbError.message}` };
          // Do not proceed if KB setup failed
          return NextResponse.json(
            { 
              success: false, 
              document_id: documentId, 
              message: `Document processed but failed to setup knowledge base: ${kbError.message}`,
              knowledge_item_status: knowledgeItemStatus 
            },
            { status: 500 }
          );
        }
      }
      
      // 2. Wait for Chunks and Generate Knowledge Item
      if (knowledgeBaseId) {
        try {
            // Supabase Admin client needed for direct DB access
            const supabaseAdmin = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            // Function to check for chunks
            const checkForChunks = async (): Promise<boolean> => {
              const { data, error, count } = await supabaseAdmin
                .from('document_chunks')
                .select('id', { count: 'exact' })
                .eq('document_id', documentId)
                .limit(1);
              if (error) {
                console.error(`❌ Error checking for chunks: ${error.message}`);
                return false;
              }
              return count !== null && count > 0;
            };
            
            // Wait for chunks with timeout
            let chunksExist = false;
            let attempts = 0;
            const maxAttempts = 30; // Wait up to 60 seconds
            const intervalMs = 2000;
            
            console.log(`⏳ Waiting for chunks for document ID: ${documentId}...`);
            while (attempts < maxAttempts && !chunksExist) {
              chunksExist = await checkForChunks();
              if (chunksExist) {
                console.log(`✅ Chunks found for document ID: ${documentId}`);
                break;
              }
              await new Promise(resolve => setTimeout(resolve, intervalMs));
              attempts++;
            }
            
            if (!chunksExist) {
              throw new Error('Timed out waiting for document chunks to appear.');
            }
            
            // Fetch document details and chunks
            const { data: documentData, error: docError } = await supabaseAdmin
              .from('documents')
              .select('title, file_name')
              .eq('id', documentId)
              .single();
            if (docError || !documentData) throw new Error(`Document ${documentId} not found.`);
            
            const { data: chunks, error: chunksError } = await supabaseAdmin
              .from('document_chunks')
              .select('content')
              .eq('document_id', documentId)
              .order('content_position', { ascending: true });
            if (chunksError || !chunks || chunks.length === 0) throw new Error(`Failed to load chunks for document ${documentId}.`);
            
            // Combine content and generate embedding
            const documentText = chunks.map(chunk => chunk.content).join('\n\n');
            const documentName = documentData.title || documentData.file_name || 'Untitled Document';
            console.log(`📚 Generating embedding for combined text of: ${documentName}`);
            
            const embeddingResult = await generateEmbeddings([{ content: documentText, tokens: 0 }], "openai"); // Use 1536 dimensions default
            
            if (!embeddingResult || !embeddingResult[0]) {
              throw new Error("Failed to generate embedding for the combined document text.");
            }
            const embeddingString = `[${embeddingResult[0].join(",")}]`;
            
            // Insert into knowledge_items
            console.log(`💾 Saving combined text and embedding to knowledge_items for KB: ${knowledgeBaseId}`);
            const { error: saveError } = await supabaseAdmin
              .from("knowledge_items")
              .insert({
                content: documentText,
                knowledge_base_id: knowledgeBaseId,
                user_id: user.id,
                source_type: "document",
                source_name: documentName,
                openai_embedding: embeddingString,
                tokens: Math.ceil(documentText.length / 4), // Approximate tokens
                document_id: documentId // Link back to the original document
              });
              
            if (saveError) {
              throw new Error(`Error saving knowledge item: ${saveError.message}`);
            }
            
            knowledgeItemStatus = { status: 'completed', message: 'Knowledge item created successfully.' };
            console.log(`✅ Knowledge item created for document ${documentId} in KB ${knowledgeBaseId}`);
            
        } catch (itemError: any) {
            console.error(`❌ Error creating knowledge item: ${itemError.message}`);
            knowledgeItemStatus = { status: 'failed', message: `Failed to create knowledge item: ${itemError.message}` };
            // Log error but maybe don't fail the entire request? Depends on requirements.
        }
      }
      // --- END: Restore Knowledge Item Creation Logic ---
      
      // Final response includes document ID and knowledge item status
      return NextResponse.json({
        success: true,
        document_id: documentId,
        message: `Document processed. Knowledge item status: ${knowledgeItemStatus.status}`,
        knowledge_item_status: knowledgeItemStatus
      });
      
    } catch (error: any) {
      console.error('Document processing error (initial phase or item creation):', error);
      return NextResponse.json(
        { 
          error: `Document processing failed: ${error.message}`, 
          details: error.stack
        },
        { status: 400 } 
      );
    }
    
  } catch (error: any) {
    console.error('!!! Error in /api/cursor/upload (outer try-catch):', error); // DEBUG
    return NextResponse.json(
      { 
        error: `Upload fehlgeschlagen: ${error.message}`,
        details: error.stack
      },
      { status: 400 } // Änderung von 500 zu 400 für Client-Fehler
    )
  }
}

// For larger files, we need to increase the body size limit
// export const config = {                          // Remove this config block
//   api: {
//     bodyParser: {
//       sizeLimit: '10mb'
//     }
//   }
// } 
