import OpenAI from 'openai';

// Initialize OpenAI client (consider moving to a shared config if used elsewhere)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Neuer Prompt für Faktenextraktion auf Seitenebene
const EXTRACTION_PROMPT = `
Du bist ein Assistent zur Wissensaufbereitung. Analysiere den folgenden Text, der eine einzelne Seite eines Dokuments darstellt.
Extrahiere ALLE sinnvollen, einzelnen Informationen, Fakten und Kernaussagen, die auf dieser Seite enthalten sind. Jeder Fakt sollte in sich geschlossen sein und eine spezifische Information vermitteln.
Formuliere jeden Fakt klar und prägnant.
Gib jeden Fakt in einer neuen Zeile zurück. Beginne jede Zeile mit einem Bindestrich (-).
Füge KEINE Einleitung, Zusammenfassung oder sonstige Kommentare hinzu. Gib nur die Liste der extrahierten Fakten für diese Seite aus.

Seitentext:
---
{text_segment}
---
Extrahierte Fakten:
`;

/**
 * Uses GPT-3.5 to generate a list of short, atomic facts from the text of a single document page.
 * Each fact is intended to be on a new line, starting with '-'.
 *
 * @param pageText The text content of a single document page.
 * @returns A promise that resolves to a single string containing the list of extracted facts for that page.
 * @throws If the OpenAI API call fails.
 */
export async function generateDetailedSegmentExtract(pageText: string): Promise<string> {
  console.log(`[LLM Page Facts] Generating facts for page of length: ${pageText.length}`); // Angepasstes Log

  if (!pageText || pageText.trim().length === 0) {
    console.log('[LLM Page Facts] Page text is empty, returning empty string.');
    return '';
  }

  try {
    const prompt = EXTRACTION_PROMPT.replace('{text_segment}', pageText);

    // Optional: Token-Schätzung und Warnung, falls Seite sehr lang ist
    // const estimatedTokens = Math.ceil(prompt.length / 3);
    // if (estimatedTokens > 3500) { 
    //   console.warn(`[LLM Page Facts] Page text might be very long (${pageText.length} chars), potentially exceeding context limit.`);
    // }

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, 
      max_tokens: 1500, // Ggf. erhöhen, wenn viele Fakten erwartet werden
      n: 1,
    });

    const extractedText = chatCompletion.choices[0]?.message?.content?.trim();

    if (!extractedText) {
      console.warn('[LLM Page Facts] OpenAI returned no content for the page.');
      return ''; 
    }

    console.log(`[LLM Page Facts] Successfully generated facts list of length: ${extractedText.length}`); 
    return extractedText;

  } catch (error: any) {
    console.error('[LLM Page Facts] Error calling OpenAI API for page fact extraction:', error);
    throw new Error(`Failed to generate page facts: ${error.message}`);
  }
} 