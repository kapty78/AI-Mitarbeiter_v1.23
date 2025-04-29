import { encode } from "gpt-tokenizer"
import {
  RecursiveCharacterTextSplitter,
  MarkdownTextSplitter,
} from "langchain/text_splitter"
import { Document } from "@langchain/core/documents"
import { KnowledgeItemChunk } from "@/types/knowledge" // Assuming a similar type definition

// Optimierte Chunk-Konstanten für bessere Extraktion
const CHUNK_SIZE = 1000 // Reduziert Chunk-Größe für präzisere semantische Einheiten
const CHUNK_OVERLAP = 150 // Ausreichend Überlappung für Kontext
const MIN_CHUNK_SIZE = 100 // Minimum Chunk-Größe um zu kleine Chunks zu vermeiden
const FORCE_SINGLE_CHUNK_THRESHOLD = 150; // Wenn Text kürzer als das, immer einen Chunk erstellen

// Separator-Muster für semantisch sinnvolles Chunking
const SEPARATORS = [
  // Hierarchische Trennzeichen (von größter zu kleinster Einheit)
  "\n## ", // Abschnittsüberschriften in Markdown
  "\n### ",
  "\n#### ",
  "\n\n", // Neue Absätze
  "\n", // Neue Zeilen
  ". ", // Satzenden
  ", ", // Nebensatztrennungen
  " " // Einzelne Wörter als letzte Option
]

/**
 * Verbesserte Funktion zum Chunking von Textinhalten mit semantisch sinnvoller Segmentierung.
 * Verwendet RecursiveCharacterTextSplitter mit optimierten Einstellungen für Wissensbasen.
 * Berücksichtigt Dokumentstruktur und häufige Muster in Dokumentationen.
 *
 * @param textContent Der zu chunking Textinhalt.
 * @returns Ein Promise, das zu einem Array von KnowledgeItemChunk-Objekten auflöst.
 */
export const chunkTextForKnowledgeBase = async (
  textContent: string
): Promise<KnowledgeItemChunk[]> => {
  if (!textContent || textContent.trim().length === 0) {
    console.log("Keine Inhalte zum Chunking gefunden.")
    return []
  }

  // Wenn der Gesamttext sehr kurz ist, erzwinge die Erstellung eines einzigen Chunks
  if (textContent.length < FORCE_SINGLE_CHUNK_THRESHOLD) {
    console.log("Text ist sehr kurz, erstelle einen einzelnen Chunk...");
    const tokens = encode(textContent).length;
    return [
      {
        content: textContent,
        tokens: tokens,
      }
    ];
  }

  console.log(`Starte Chunking von ${textContent.length} Zeichen...`)

  // Optimierter Splitter mit angepassten Separatoren für bessere semantische Teilung
  const splitter = new RecursiveCharacterTextSplitter({
    separators: SEPARATORS,
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    lengthFunction: text => encode(text).length // Tokenanzahl statt Zeichenzahl
  })

  // Verwende speziellen Markdown-Splitter, wenn der Text Markdown-Formatierung enthält
  const containsMarkdown =
    textContent.includes("##") ||
    textContent.includes("**") ||
    textContent.includes("```") ||
    textContent.includes("- ") ||
    textContent.includes("1. ")

  let splitDocs: Document[] = []

  if (containsMarkdown) {
    console.log("Markdown-Formatierung erkannt, verwende Markdown-Splitter...")
    const mdSplitter = new MarkdownTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP
    })
    splitDocs = await mdSplitter.createDocuments([textContent])
  } else {
    // Standard-Chunking für Nicht-Markdown-Inhalte
    splitDocs = await splitter.createDocuments([textContent])
  }

  console.log(`Text in ${splitDocs.length} Chunks aufgeteilt.`)

  const chunks: KnowledgeItemChunk[] = []
  let totalTokens = 0

  for (const doc of splitDocs) {
    const content = doc.pageContent.trim()

    // Prüfe Mindestlänge und entferne leere Chunks, es sei denn es ist der einzige Chunk
    if (content.length > MIN_CHUNK_SIZE || splitDocs.length === 1) {
      const tokens = encode(content).length
      totalTokens += tokens

      // Extrahiere einen Titel aus dem Chunk wenn möglich
      let title = ""
      const lines = content.split("\n")
      if (lines[0] && (lines[0].startsWith("#") || lines[0].length < 100)) {
        title = lines[0].replace(/^#+\s*/, "") // Entferne Markdown-Headings
      } else {
        // Verwende die ersten Wörter als Titel (max. 50 Zeichen)
        title = content.substring(0, 50).split(".")[0]
      }

      chunks.push({
        content,
        tokens,
      })
    }
  }

  console.log(
    `Chunking abgeschlossen. ${chunks.length} gültige Chunks erzeugt mit insgesamt ${totalTokens} Tokens.`
  )
  return chunks
}
