import { SupabaseClient, createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { Database } from "@/supabase/types"

export const runtime = "edge"

// Vereinfachte Funktion zur Generierung von Embeddings
async function generateEmbeddings(text: string): Promise<number[] | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small"
      })
    })

    if (!response.ok) {
      console.error("OpenAI API error:", response.statusText)
      return null
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error("Error generating embeddings:", error)
    return null
  }
}

// Interface für das Ergebnis der Fakten-Suche
interface FactSearchResult {
  id: string;
  source_name: string;
  linked_context_id: string; // Wichtig: Muss vorhanden sein!
  similarity: number;
}

// Interface für das Ergebnis der Kontext-Suche
interface ContextItem {
  id: string;
  content: string;
}

// Neues Interface für die verbesserte Suche
interface KnowledgeFactWithChunk {
  fact_id: string;
  fact_content: string;
  fact_source_name: string;
  chunk_id: string;
  chunk_content: string;
  similarity: number;
}

export async function POST(req: NextRequest) {
  try {
    console.log("Knowledge search API V5 (Direct Facts with Chunks) called"); // Version erhöht

    const json = await req.json();
    const { query, chatId, knowledge_base_id, auth_token } = json;

    console.log(
      `Query: "${query}", ChatId: "${chatId}", KnowledgeBaseId: "${knowledge_base_id || "all"}"`
    );
    console.log(`Auth token provided: ${Boolean(auth_token)}`);

    if (!query || !knowledge_base_id) { // KB ID ist jetzt erforderlich
      console.log("Query or Knowledge Base ID missing");
      return NextResponse.json(
        { error: "Query and Knowledge Base ID are required", results: [] },
        { status: 400 }
      );
    }

    // Erstelle Supabase Client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVICE KEY für Kontext-Fetch benötigt!
      // Auth-Header nicht mehr nötig, wenn Service Key verwendet wird
    );

    // --- Berechtigungsprüfung (kann ausgelagert werden, hier vereinfacht) ---
    // TODO: Implementiere eine robuste Berechtigungsprüfung basierend auf auth_token oder User Session
    console.log("Skipping detailed permission check in this version - using Service Key");
    
    // Constants
    const MATCH_THRESHOLD = 0.4; // Reduzierter Schwellenwert für bessere Ergebnisse
    const MAX_RESULTS = 5;

    try {
      // Generiere ein Embedding für die Suchanfrage
      console.log("Generating embedding for query:", query);
      const embedding = await generateEmbeddings(query);
      
      if (!embedding) {
        console.error("Failed to generate embedding for query");
        return NextResponse.json(
          { error: "Failed to generate embedding for query", results: [] },
          { status: 500 }
        );
      }

      // Formatiere das Embedding für die Datenbank
      const formattedEmbedding = `[${embedding.join(",")}]`;
      
      // --- Neue Implementierung: Direkte Suche nach Fakten mit ihren Chunks ---
      console.log(`Calling RPC kb_find_facts_with_chunks with query: "${query}"`);
      
      const { data: searchResults, error: rpcError } = await supabase.rpc(
        "kb_find_facts_with_chunks",
        {
          p_query_embedding: formattedEmbedding,
          p_knowledge_base_id: knowledge_base_id,
          p_match_threshold: MATCH_THRESHOLD,
          p_match_count: MAX_RESULTS
        }
      );

      // Typzuweisung für das RPC-Ergebnis
      const factWithChunksResults = searchResults as unknown as KnowledgeFactWithChunk[] | null;

      if (rpcError) {
        console.error("Error calling kb_find_facts_with_chunks RPC:", rpcError);
        throw new Error(`Error searching for facts with chunks: ${rpcError.message}`);
      }

      if (!factWithChunksResults || factWithChunksResults.length === 0) {
        console.log("No relevant facts found for query:", query);
        return NextResponse.json({ results: [] });
      }

      console.log(`Found ${factWithChunksResults.length} relevant facts with chunks`);

      // Format results for the chat UI
      const finalResults = factWithChunksResults.map(result => ({
        content: result.chunk_content, // Vollständiger Chunk-Inhalt für den Kontext
        fact: result.fact_content,     // Der spezifische Fakt (optional, kann in UI angezeigt werden)
        source_name: result.fact_source_name,
        similarity: result.similarity,
        search_type: "direct_fact_with_chunk" // Neuer Typ
      }));

      console.log(`Returning ${finalResults.length} results`);
      return NextResponse.json({ results: finalResults });

    } catch (e: any) {
      console.error("Error during knowledge search process:", e);
      return NextResponse.json(
        { error: `Search failed: ${e.message}`, results: [] },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error("!!! Critical error in /api/knowledge/search:", error);
    return NextResponse.json(
      { error: `API handler error: ${error.message}`, results: [] },
      { status: 500 }
    );
  }
}

// Alte Fallback-Funktion performTextSearch wird hier nicht mehr benötigt,
// da der primäre Pfad jetzt die RAG-Logik implementiert.
// async function performTextSearch(...) { ... }
