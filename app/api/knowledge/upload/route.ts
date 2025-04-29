import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { Database } from "@/supabase/types"
import { extractTextFromFile } from "@/lib/knowledge-base/extraction"
import { generateEmbeddings } from "@/lib/knowledge-base/embedding"
import OpenAI from "openai"
import { uploadStatusUtils } from "../upload-status/utils"

const { initUploadStatus, addUploadLog, updateUploadProgress, completeUpload } =
  uploadStatusUtils

// Die Chunks werden nicht mehr benötigt, stattdessen nutzen wir die Faktenextraktion
// import { chunkTextForKnowledgeBase } from "@/lib/knowledge-base/chunking"
// import { KnowledgeItemChunk } from "@/types/knowledge"
// import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers" // Remove getServerProfile if not needed elsewhere

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  })

  // Extrahiere Request-ID für Status-Tracking
  let requestId = ""

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[Upload API] User not found in session.")
      return NextResponse.json(
        { error: "Unauthorized - Session Invalid" },
        { status: 401 }
      )
    }
    console.log(`[Upload API] User authenticated: ${user.id}`)

    // TODO: Implement Admin check
    const isAdmin = true // Replace with actual check
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // --- REMOVE Load FULL Profile ---
    // console.log(`[Upload API] Fetching FULL profile for user: ${user.id}...`);
    // const { data: fullProfile, error: profileError } = await supabase ...
    // ... removed profile loading logic ...
    // --- End REMOVE Load FULL Profile ---

    const formData = await request.formData()
    const knowledgeBaseId = formData.get("knowledgeBaseId") as string
    const sourceType = formData.get("sourceType") as "file" | "text"
    const sourceName = formData.get("sourceName") as string // User-provided title or filename fallback
    const file = formData.get("file") as File | null
    const content = formData.get("content") as string | null
    const embeddingsProvider = formData.get("embeddingsProvider") as
      | "openai"
      | "local" // TODO: Get from knowledge_base settings?

    // Hole die Request-ID für Status-Tracking
    requestId = (formData.get("requestId") as string) || `upload-${Date.now()}`

    // Initialisiere Status-Tracking
    initUploadStatus(requestId)
    addUploadLog(
      requestId,
      `Upload für ${sourceType === "file" ? file?.name : "Text"} initialisiert`
    )

    console.log(
      `[Upload API] Received request: KB ID=${knowledgeBaseId}, Type=${sourceType}, Provider=${embeddingsProvider}, File=${file?.name}, Text=${!!content}`
    )
    addUploadLog(
      requestId,
      `Request empfangen: KB=${knowledgeBaseId}, Type=${sourceType}, Provider=${embeddingsProvider}`
    )

    if (
      !knowledgeBaseId ||
      !sourceType ||
      !embeddingsProvider ||
      (!file && !content)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required form fields (knowledgeBaseId, sourceType, embeddingsProvider, and file or content)"
        },
        { status: 400 }
      )
    }

    let processingContent: string = ""
    let processingSourceName: string = sourceName

    if (sourceType === "file" && file) {
      processingSourceName = sourceName || file.name // Use provided name or fallback to filename
      console.log(`Processing file: ${processingSourceName}`)
      addUploadLog(requestId, `Verarbeite Datei: ${processingSourceName}`)

      updateUploadProgress(
        requestId,
        "extraction",
        10,
        `Extrahiere Text aus Datei: ${processingSourceName}...`
      )

      try {
        processingContent = await extractTextFromFile(file, progress => {
          // Fortschritt der PDF-Extraktion melden, falls vorhanden
          if (progress) {
            updateUploadProgress(
              requestId,
              "extraction",
              Math.min(20, 10 + (progress.percentComplete / 100) * 10),
              `Extrahiere Seite ${progress.currentPage}/${progress.totalPages}...`,
              progress.currentPage,
              progress.totalPages
            )
            addUploadLog(
              requestId,
              `Extrahierte Seite ${progress.currentPage}/${progress.totalPages}`
            )
          }
        })

        addUploadLog(
          requestId,
          `Text erfolgreich extrahiert: ${processingContent.length} Zeichen`
        )
      } catch (extractError: any) {
        console.error("File extraction failed:", extractError)
        addUploadLog(
          requestId,
          `Fehler bei Textextraktion: ${extractError.message}`
        )
        return NextResponse.json(
          { error: `File extraction failed: ${extractError.message}` },
          { status: 500 }
        )
      }
    } else if (sourceType === "text" && content) {
      if (!sourceName) {
        return NextResponse.json(
          { error: "Source name (title) is required for text input." },
          { status: 400 }
        )
      }
      processingSourceName = sourceName
      processingContent = content
      console.log(`Processing text input: ${processingSourceName}`)
      addUploadLog(requestId, `Verarbeite Texteingabe: ${processingSourceName}`)
    } else {
      return NextResponse.json(
        { error: "Missing file or content for the specified source type" },
        { status: 400 }
      )
    }

    if (!processingContent || processingContent.trim().length === 0) {
      console.log(
        "[Upload API] Kein Text konnte extrahiert werden, verwende Fallback-Inhalt"
      )
      addUploadLog(
        requestId,
        "Warnung: Kein Inhalt konnte extrahiert werden, verwende Standard-Inhalt"
      )

      // Statt Fehler zu werfen, setzen wir einen Standard-Inhalt
      processingContent = `Dokument: ${processingSourceName}. Inhalt konnte nicht extrahiert werden, aber die Verarbeitung wird fortgesetzt.`
    }

    console.log(
      `[Upload API] Content extracted, length: ${processingContent.length}`
    )

    // Text in Chunks aufteilen
    updateUploadProgress(
      requestId,
      "chunking",
      25,
      "Teile Text in Chunks für die Analyse..."
    )

    // --- NEUE IMPLEMENTIERUNG ---
    // Extrahiere Fakten direkt hier, ohne separate API
    console.log(`[Upload API] Extracting facts from document...`)
    addUploadLog(requestId, "Beginne mit der Faktenextraktion...")

    // Erkenne Projektkontext aus Dateinamen
    let projectName = "Allgemein"

    // Versuche, den Projektnamen aus dem Dateinamen zu extrahieren
    if (
      processingSourceName.includes("Deutscher Bauservi") ||
      processingSourceName.includes("Bauservice")
    ) {
      projectName = "Deutscher Bauservice"
    } else if (processingSourceName.includes("EcomTask")) {
      projectName = "EcomTask"
    }

    try {
      // Frage OpenAI direkt, um Fakten zu extrahieren

      // --- NEUE IMPLEMENTIERUNG: Text in Chunks aufteilen ---
      const CHUNK_SIZE = 3000 // Anzahl der Zeichen pro Chunk (reduziert von ursprünglich 1000)
      const CHUNK_OVERLAP = 200 // Überlappung zwischen Chunks

      console.log(
        `[Upload API] Text wird in Chunks mit je ${CHUNK_SIZE} Zeichen aufgeteilt...`
      )
      addUploadLog(
        requestId,
        `Teile Text in Chunks mit je ${CHUNK_SIZE} Zeichen und ${CHUNK_OVERLAP} Zeichen Überlappung`
      )

      // Text in überlappende Chunks von je 3000 Zeichen aufteilen
      const chunks: string[] = []
      let startPos = 0

      while (startPos < processingContent.length) {
        const endPos = Math.min(startPos + CHUNK_SIZE, processingContent.length)
        chunks.push(processingContent.slice(startPos, endPos))
        startPos = endPos - CHUNK_OVERLAP // Überlappung für Kontext

        // Verhindere zu kleine Chunks am Ende
        if (processingContent.length - startPos < CHUNK_SIZE / 3) {
          break
        }
      }

      // Letzten Chunk hinzufügen, falls nötig
      if (startPos < processingContent.length) {
        chunks.push(processingContent.slice(startPos))
      }

      console.log(
        `[Upload API] Dokument in ${chunks.length} Chunks aufgeteilt.`
      )
      addUploadLog(requestId, `Dokument in ${chunks.length} Chunks aufgeteilt`)

      // Fortschritt aktualisieren
      updateUploadProgress(
        requestId,
        "facts",
        30,
        `Extrahiere Fakten aus ${chunks.length} Chunks...`,
        0,
        chunks.length
      )

      // Fakten aus jedem Chunk extrahieren
      let allFacts: string[] = []

      for (let i = 0; i < chunks.length; i++) {
        console.log(
          `[Upload API] Verarbeite Chunk ${i + 1}/${chunks.length}...`
        )
        addUploadLog(
          requestId,
          `Extrahiere Fakten aus Chunk ${i + 1}/${chunks.length}`
        )

        // Fortschritt aktualisieren
        updateUploadProgress(
          requestId,
          "facts",
          30 + Math.floor((i / chunks.length) * 40), // 30-70% für Faktenextraktion
          `Extrahiere Fakten aus Chunk ${i + 1}/${chunks.length}...`,
          i + 1,
          chunks.length
        )

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
              
              Dies ist Teil ${i + 1} von ${chunks.length} des Dokuments "${processingSourceName}". 
              Extrahiere ALLE relevanten Fakten aus diesem Teil, auch wenn sie banal erscheinen.
              
              Formatiere jeden Fakt als eigenständigen Satz, der IMMER mit "Im Dokument '${processingSourceName}' ist enthalten, dass" beginnt.
              
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
          `[Upload API] ${chunkFacts.length} Fakten aus Chunk ${i + 1} extrahiert.`
        )
        addUploadLog(
          requestId,
          `${chunkFacts.length} Fakten aus Chunk ${i + 1} extrahiert`
        )
        allFacts = [...allFacts, ...chunkFacts]
      }

      console.log(
        `[Upload API] Gesamtergebnis: ${allFacts.length} einzigartige Fakten extrahiert.`
      )
      addUploadLog(
        requestId,
        `Insgesamt wurden ${allFacts.length} Fakten extrahiert`
      )

      if (allFacts.length === 0) {
        addUploadLog(
          requestId,
          "Fehler: Es konnten keine Fakten aus dem Dokument extrahiert werden"
        )
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
        `[Upload API] ${uniqueFacts.length} einzigartige Fakten nach Entfernung von Duplikaten.`
      )
      addUploadLog(
        requestId,
        `${uniqueFacts.length} einzigartige Fakten nach Entfernung von Duplikaten`
      )

      // Fortschritt aktualisieren für Embedding-Phase
      updateUploadProgress(
        requestId,
        "embedding",
        70,
        `Erzeuge Embeddings für ${uniqueFacts.length} Fakten...`,
        0,
        uniqueFacts.length
      )

      // 2. Embeddings für jeden Fakt generieren und speichern
      const savedItems = []
      let failedCount = 0

      for (let i = 0; i < uniqueFacts.length; i++) {
        const fact = uniqueFacts[i]
        try {
          // Fortschritt für Embeddings
          updateUploadProgress(
            requestId,
            "embedding",
            70 + Math.floor((i / uniqueFacts.length) * 20), // 70-90% für Embeddings
            `Erzeuge Embedding für Fakt ${i + 1}/${uniqueFacts.length}...`,
            i + 1,
            uniqueFacts.length
          )

          // Embedding generieren
          const embedding = await generateEmbeddings(
            [{ content: fact, tokens: 0 }],
            embeddingsProvider
          )

          if (!embedding || !embedding[0]) {
            console.error(
              `Failed to generate embedding for fact: ${fact.substring(0, 50)}...`
            )
            addUploadLog(
              requestId,
              `Fehler beim Generieren von Embedding für Fakt: ${fact.substring(0, 50)}...`
            )
            failedCount++
            continue
          }

          // Embedding formatieren
          const embeddingString = `[${embedding[0].join(",")}]`

          // Fortschritt für Speichern
          if (i === Math.floor(uniqueFacts.length / 2)) {
            updateUploadProgress(
              requestId,
              "saving",
              90,
              `Speichere Fakten in Datenbank...`,
              i + 1,
              uniqueFacts.length
            )
          }

          // In DB speichern
          const { data, error } = await supabase
            .from("knowledge_items")
            .insert({
              content: fact,
              knowledge_base_id: knowledgeBaseId,
              user_id: user.id,
              source_type: sourceType,
              source_name: processingSourceName,
              openai_embedding:
                embeddingsProvider === "openai" ? embeddingString : null,
              local_embedding:
                embeddingsProvider === "local" ? embeddingString : null,
              tokens: Math.ceil(fact.length / 4) // Ungefähre Schätzung
            })
            .select()

          if (error) {
            console.error(`Error saving fact: ${error.message}`)
            addUploadLog(
              requestId,
              `Fehler beim Speichern eines Fakts: ${error.message}`
            )
            failedCount++
          } else {
            savedItems.push(data[0])
          }
        } catch (error) {
          console.error("Error processing fact:", error)
          addUploadLog(
            requestId,
            `Fehler bei der Verarbeitung eines Fakts: ${error}`
          )
          failedCount++
        }
      }

      console.log(
        `[Upload API] Successfully saved ${savedItems.length} facts, ${failedCount} failed`
      )
      addUploadLog(
        requestId,
        `Erfolgreich ${savedItems.length} Fakten gespeichert, ${failedCount} fehlgeschlagen`
      )

      // Finales Ergebnis
      const result = {
        message: `Successfully processed and added ${savedItems.length} facts to knowledge base ${knowledgeBaseId}`,
        factsCount: uniqueFacts.length,
        savedCount: savedItems.length,
        failedCount: failedCount,
        facts: savedItems.map(item => item.content)
      }

      // Abschließen des Status-Trackings
      completeUpload(requestId, result)

      return NextResponse.json(result, { status: 201 })
    } catch (error: any) {
      console.error("[Upload API] Facts extraction failed:", error)
      addUploadLog(
        requestId,
        `Fehler bei der Faktenextraktion: ${error.message}`
      )
      return NextResponse.json(
        {
          error: `Failed to extract facts: ${error.message}`
        },
        { status: 500 }
      )
    }
    // --- ENDE DER NEUEN IMPLEMENTIERUNG ---
  } catch (error: any) {
    console.error("[Upload API] Unhandled error in POST handler:", error)
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred."

    if (requestId) {
      addUploadLog(requestId, `Unbehandelter Fehler: ${message}`)
    }

    return NextResponse.json(
      { error: `An unexpected error occurred: ${message}` },
      { status: 500 }
    )
  }
}
