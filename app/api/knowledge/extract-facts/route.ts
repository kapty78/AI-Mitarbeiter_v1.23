import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { generateEmbeddings } from "@/lib/knowledge-base/embedding"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Auth-Check
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, documentName, knowledgeBaseId } = await request.json()

    if (!text || !documentName || !knowledgeBaseId) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: text, documentName, or knowledgeBaseId"
        },
        { status: 400 }
      )
    }

    console.log(
      `[Facts API] Extracting facts from ${documentName}, text length: ${text.length}`
    )

    // NEU: Text in Chunks aufteilen für bessere Extraktion
    const CHUNK_SIZE = 3000 // Anzahl der Zeichen pro Chunk (reduziert von ursprünglich 1000)
    const CHUNK_OVERLAP = 200 // Überlappung zwischen Chunks

    console.log(
      `[Facts API] Text wird in Chunks mit je ${CHUNK_SIZE} Zeichen aufgeteilt...`
    )

    // Text in überlappende Chunks von je 3000 Zeichen aufteilen
    const chunks: string[] = []
    let startPos = 0

    while (startPos < text.length) {
      const endPos = Math.min(startPos + CHUNK_SIZE, text.length)
      chunks.push(text.slice(startPos, endPos))
      startPos = endPos - CHUNK_OVERLAP // Überlappung für Kontext

      // Verhindere zu kleine Chunks am Ende
      if (text.length - startPos < CHUNK_SIZE / 3) {
        break
      }
    }

    // Letzten Chunk hinzufügen, falls nötig
    if (startPos < text.length) {
      chunks.push(text.slice(startPos))
    }

    console.log(`[Facts API] Dokument in ${chunks.length} Chunks aufgeteilt.`)

    // Fakten aus jedem Chunk extrahieren
    let allFacts: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      console.log(`[Facts API] Verarbeite Chunk ${i + 1}/${chunks.length}...`)

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Du bist ein spezialisierter KI-Assistent für Faktenextraktion aus Dokumenten. 
            Deine Aufgabe ist es, präzise, eigenständige Fakten aus jedem Dokumentteil zu extrahieren.
            
            Wichtige Regeln:
            - Extrahiere ALLE Fakten und Informationen aus dem Text, ohne Auslassungen
            - Jeder Fakt muss vollständig und eigenständig verständlich sein
            - Achte besonders auf Zahlen, Daten, Namen und andere spezifische Informationen
            - Sei präzise und objektiv - keine Interpretationen oder Meinungen
            - Behandle jeden Chunk als eigenständigen Teil, auch wenn er im Kontext eines größeren Dokuments steht
            - Fasse keine Informationen zusammen - extrahiere jeden einzelnen Fakt separat
            - Bei Unsicherheit: Lieber zu viele als zu wenige Fakten extrahieren`
          },
          {
            role: "user",
            content: `Extrahiere aus folgendem Dokumentteil alle wichtigen Fakten.
            
            Dies ist Teil ${i + 1} von ${chunks.length} des Dokuments "${documentName}". 
            Extrahiere ALLE relevanten Fakten aus diesem Teil, auch wenn sie banal erscheinen.
            
            Formatiere jeden Fakt als eigenständigen Satz, der IMMER mit "Im Dokument '${documentName}' ist enthalten, dass" beginnt.
            
            Befolge unbedingt diese Regeln:
            1. Jeder Fakt muss vollständig und für sich verständlich sein
            2. Jeder Fakt sollte genau EINE spezifische Information enthalten
            3. Formatiere als numerierte Liste (1., 2., 3., usw.)
            4. Verwende die Originalformulierungen aus dem Dokument soweit wie möglich
            5. Extrahiere alle Informationen - Zahlen, Daten, Definitionen, Beschreibungen, etc.
            6. Bei Tabellen oder Listen: Extrahiere jedes Element als separaten Fakt
            7. Bei Rechnungen oder wichtigen Dokumenten: Erfasse alle Details wie Nummern, Beträge, Daten
            
            Hier ist der Dokumentteil ${i + 1}/${chunks.length}:
            ${chunks[i]}`
          }
        ],
        temperature: 0.2, // Leicht höhere Temperatur für mehr Vielfalt
        max_tokens: 4000
      })

      const output = response.choices[0].message.content || ""

      // Extrahiere nummerierte Fakten und entferne die Nummerierung
      const chunkFacts = output
        .split("\n")
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, "").trim())

      console.log(
        `[Facts API] ${chunkFacts.length} Fakten aus Chunk ${i + 1} extrahiert.`
      )
      allFacts = [...allFacts, ...chunkFacts]
    }

    console.log(
      `[Facts API] Gesamtergebnis: ${allFacts.length} einzigartige Fakten extrahiert.`
    )

    if (allFacts.length === 0) {
      return NextResponse.json(
        {
          error: "Es konnten keine Fakten aus dem Dokument extrahiert werden."
        },
        { status: 400 }
      )
    }

    // Duplikate entfernen
    const uniqueFacts = [...new Set(allFacts)]
    console.log(
      `[Facts API] ${uniqueFacts.length} einzigartige Fakten nach Entfernung von Duplikaten.`
    )

    // 2. Embeddings für jeden Fakt generieren und speichern
    const savedItems = []
    let failedCount = 0

    for (const fact of uniqueFacts) {
      try {
        // Embedding generieren
        const embedding = await generateEmbeddings(
          [{ content: fact, tokens: 0 }],
          "openai"
        )

        if (!embedding || !embedding[0]) {
          console.error(
            `Failed to generate embedding for fact: ${fact.substring(0, 50)}...`
          )
          failedCount++
          continue
        }

        // Embedding formatieren
        const embeddingString = `[${embedding[0].join(",")}]`

        // In DB speichern
        const { data, error } = await supabase
          .from("knowledge_items")
          .insert({
            content: fact,
            knowledge_base_id: knowledgeBaseId,
            user_id: user.id,
            source_type: "document",
            source_name: documentName,
            openai_embedding: embeddingString,
            tokens: Math.ceil(fact.length / 4) // Ungefähre Schätzung
          })
          .select()

        if (error) {
          console.error(`Error saving fact: ${error.message}`)
          failedCount++
        } else {
          savedItems.push(data[0])
        }
      } catch (error) {
        console.error("Error processing fact:", error)
        failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed and added ${savedItems.length} facts to knowledge base ${knowledgeBaseId}`,
      factsCount: uniqueFacts.length,
      savedCount: savedItems.length,
      failedCount: failedCount,
      facts: savedItems.map(item => item.content)
    })
  } catch (error: any) {
    console.error("[Facts API] Error:", error)
    return NextResponse.json(
      {
        error: `Error extracting facts: ${error.message}`
      },
      { status: 500 }
    )
  }
}
