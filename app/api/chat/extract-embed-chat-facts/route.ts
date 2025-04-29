import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { generateEmbeddings } from '@/lib/knowledge-base/embedding' 
import { Database } from '@/supabase/types'
import { KnowledgeItemChunk } from "@/types/knowledge"
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Helper function to get the first available KB ID for a workspace/user
async function getTargetKnowledgeBaseId(supabase: SupabaseClient<Database>, workspaceId: string | null, userId: string): Promise<string | null> {
  let query = supabase.from('knowledge_bases').select('id').eq('user_id', userId);
  if (workspaceId) {
    // In a real workspace, KBs might be linked differently, but let's assume user-specific within workspace for now
    // This might need adjustment based on how KBs are truly associated with workspaces vs. users
     console.warn("[Fact Embed API] KB association with workspace needs review. Using user's KBs as fallback.");
     // Ideally, filter by workspace AND user access/membership. 
     // For now, we stick to user ID as the primary filter.
  }
  
  const { data, error } = await query.limit(1);
  
  if (error) {
    console.error("[Fact Embed API] Error fetching knowledge base ID:", error);
    return null;
  }
  return data?.[0]?.id || null;
}

export async function POST(req: NextRequest) {
  console.log('--- API /api/chat/extract-embed-chat-facts v5 reached ---');

  const { chat_id, user_id, workspace_id } = await req.json();

  if (!chat_id || !user_id) {
    console.error('[Fact Embed API v5] Missing chat_id or user_id');
    return NextResponse.json({ error: 'Missing chat_id or user_id' }, { status: 400 });
  }

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch UNPROCESSED messages (facts_extracted = FALSE)
    console.log(`[Fact Embed API v5] Fetching unprocessed messages for chat ${chat_id}...`);
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from('chat_messages')
      .select('id, role, content, created_at') 
      .eq('chat_id', chat_id)
      .eq('facts_extracted', false) 
      .order('created_at', { ascending: true });

    if (fetchError) throw new Error(`Failed to fetch messages: ${fetchError.message}`);

    if (!messages || messages.length === 0) { 
      console.log(`[Fact Embed API v5] No new unprocessed messages in chat ${chat_id}.`);
      return NextResponse.json({ success: true, message: 'No new messages to process.' });
    }
    
    const processedMessageIds: string[] = messages.map(msg => msg.id);
    console.log(`[Fact Embed API v5] Found ${messages.length} new messages to process.`);

    // 3. PRE-FILTER messages and Format for the IMPROVED prompt
    const filteredMessages = messages.filter(msg => msg.role === 'user'); // Focus on user messages for facts
    
    let facts: string[] = []; // Initialize facts array
    let factsInsertedCount = 0;

    if (filteredMessages.length > 0) {
        const conversationText = filteredMessages
          .map(msg => `User: ${msg.content}`)
          .join('\n\n');

        // --- HIGHLY REFINED PROMPT V3 (remains the same) --- 
        const prompt = `Du bist ein Experte darin, aus Gesprächsverläufen **dauerhaft relevantes Wissen** über den Benutzer, seine Projekte, Präferenzen und getroffene Entscheidungen zu extrahieren. Dein Ziel ist es, eine Wissensbasis aufzubauen, die zukünftige Interaktionen verbessert.\n\n**Ignoriere unbedingt:**\n- Smalltalk, Begrüßungen, Verabschiedungen.\n- Generische Antworten oder Unterstützungsangebote des Assistenten.\n- Triviale oder temporäre Aussagen ohne langfristigen Wert.\n- Informationen, die bereits offensichtlich sind.\n- Wiederholungen.\n\n**Konzentriere dich ausschließlich auf:**\n- **Konkrete, neue Fakten über den User:** Präferenzen, Ziele, Fachwissen, Kontaktdaten (nur wenn explizit genannt und relevant).\n- **Fakten über Projekte/Aufgaben:** Namen, Ziele, Status, spezifische Anforderungen, getroffene Entscheidungen.\n- **Wichtige Vereinbarungen & Zusagen:** Was wurde verbindlich vereinbart?\n- **Definitionen & Erklärungen:** Nur wenn sie spezifisch für den Kontext des Users oder Projekts sind.\n\nAnalysiere folgenden Chatverlauf (User-Aussagen). Extrahiere JEDEN relevanten, dauerhaften Fakt als EIGENSTÄNDIGEN, kurzen Satz.\nGib NUR die extrahierten Fakten zurück, einen Fakt pro Zeile. \nWenn absolut KEINE dauerhaft relevanten Fakten enthalten sind, gib die exakte Zeichenfolge "NO_FACTS_EXTRACTED" zurück und sonst nichts.\n\nChatverlauf:\n${conversationText}\n\nExtrahierte Fakten:`;
        // --- END REFINED PROMPT --- 

        console.log(`[Fact Embed API v5] Sending filtered conversation (length: ${conversationText.length}) to GPT-3.5 Turbo...`);

        // 4. Call GPT-3.5 Turbo
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1, 
          max_tokens: 500,
        });

        const rawFacts = chatCompletion.choices[0]?.message?.content?.trim();

        // 5. Process response
        if (!rawFacts || 
            rawFacts === "NO_FACTS_EXTRACTED" || 
            rawFacts === "- NO_FACTS_EXTRACTED" || 
            rawFacts.includes("NO_FACTS_EXTRACTED")) {
          console.log(`[Fact Embed API v5] No relevant facts extracted by GPT-3.5. Response: "${rawFacts}"`);
          // Wir fügen KEINE Einträge in die Datenbank ein, wenn keine Fakten gefunden wurden
          // Stattdessen markieren wir die Nachrichten einfach als verarbeitet
        } else {
          // 6. Parse facts and generate embeddings
          facts = rawFacts.split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 10)
            .filter(f => !f.includes("NO_FACTS_EXTRACTED")); // Zusätzliche Sicherheit
          
          if (facts.length > 0) {
            console.log(`[Fact Embed API v5] Extracted ${facts.length} relevant facts. Generating embeddings...`);
            
            const factsForEmbedding: KnowledgeItemChunk[] = facts.map(fact => ({ content: fact, tokens: 0 }));
            const embeddings = await generateEmbeddings(factsForEmbedding, 'openai');

            if (embeddings && embeddings.length === facts.length) {
              // 7. Prepare data for insertion into **message_embeddings**
              const itemsToInsert = facts.map((fact, index) => ({
                message_id: null, 
                chat_id: chat_id, 
                workspace_id: workspace_id, 
                fact_source: 'chat_fact', 
                role: 'system', 
                embedding: embeddings[index], 
                source_content: fact 
              }));

              // 8. Insert facts into **message_embeddings**
              console.log(`[Fact Embed API v5] Inserting ${itemsToInsert.length} facts into message_embeddings...`);
              const { error: insertError } = await supabaseAdmin
                .from('message_embeddings') // Target the correct table
                .insert(itemsToInsert);
                
              if (insertError) {
                console.error(`[Fact Embed API v5] Error inserting facts into message_embeddings for chat ${chat_id}:`, insertError);
              } else {
                factsInsertedCount = itemsToInsert.length;
                console.log(`[Fact Embed API v5] Successfully inserted ${factsInsertedCount} facts into message_embeddings.`);
              }
            } else {
              console.error('[Fact Embed API v5] Embedding generation failed for facts.');
            }
          } else {
            console.log(`[Fact Embed API v5] GPT-3.5 response parsed into 0 valid facts.`);
          }
        }
    } else {
        console.log(`[Fact Embed API v5] No relevant (user) messages found in this batch after pre-filtering.`);
    }

    // 9. Mark ALL initially fetched messages as processed in chat_messages
    if (processedMessageIds.length > 0) {
      console.log(`[Fact Embed API v5] Marking ${processedMessageIds.length} messages as facts_extracted=true...`);
      const { error: updateError } = await supabaseAdmin
        .from('chat_messages')
        .update({ facts_extracted: true })
        .in('id', processedMessageIds);
      if (updateError) {
        console.error(`[Fact Embed API v5] Failed to mark messages as processed for chat ${chat_id}:`, updateError);
      }
    }

    console.log(`[Fact Embed API v5] Processing finished for chat ${chat_id}.`);
    return NextResponse.json({
      success: true,
      message: `Processing finished. Processed ${processedMessageIds.length} messages. Inserted ${factsInsertedCount} facts.`,
      extractedFactCount: factsInsertedCount 
    });

  } catch (error: any) {
    console.error(`[Fact Embed API v5] Error processing chat ${chat_id}:`, error);
    // Don't mark messages as processed if a general error occurred before the update step
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 