import { Message } from "../types"

/**
 * Generiert ein Prompt für die KI, um den Chat zusammenzufassen
 */
const generateSummaryPrompt = (messages: Message[]): string => {
  // Filtere User und Assistant Nachrichten
  const relevantMessages = messages.filter(
    m => m.role === "user" || m.role === "assistant"
  )

  if (relevantMessages.length < 2) {
    return "Es gibt nicht genügend Nachrichten für eine Zusammenfassung."
  }

  return `
Erstelle eine strukturierte Zusammenfassung des folgenden Chatverlaufs. 
Die Zusammenfassung sollte folgende Elemente enthalten:

1. Einen einleitenden Absatz, der die Hauptthemen des Gesprächs beschreibt
2. Eine Auflistung der wichtigsten besprochenen Punkte in Stichpunkten
3. Relevante Fakten oder Informationen, die ausgetauscht wurden
4. Wenn vorhanden: Entscheidungen oder Schlussfolgerungen, die erreicht wurden

WICHTIG: Verwende KEINEN Markdown-Syntax (#, ##, etc.) in deiner Antwort!
Formatiere deine Antwort mit folgendem Format ohne spezielle Formatierungszeichen:

"Chat-Zusammenfassung

[Einleitender Absatz]

Hauptpunkte:
- Punkt 1
- Punkt 2
- Punkt 3

Wichtige Informationen:
- Information 1
- Information 2

Schlussfolgerungen:
- Schlussfolgerung 1"

Hier ist der Chatverlauf:

${relevantMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}
`
}

/**
 * Sendet eine Anfrage an die OpenAI API, um den Chat zusammenzufassen
 */
export const generateChatSummary = async (
  messages: Message[],
  apiEndpoint: string = "/api/chat"
): Promise<string> => {
  try {
    if (messages.length < 2) {
      return "Nicht genügend Nachrichten für eine Zusammenfassung vorhanden."
    }

    const prompt = generateSummaryPrompt(messages)

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o" // Verwende das leistungsstärkste Modell für Zusammenfassungen
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    // Versuche zuerst, die Antwort als Text zu erhalten
    const responseText = await response.text();
    
    // Versuche dann, den Text als JSON zu parsen
    let summaryText = "";
    try {
      // Versuche, den Text als JSON zu parsen
      const responseData = JSON.parse(responseText);
      
      if (typeof responseData === "string") {
        // Falls die API direkt einen String zurückgibt
        summaryText = responseData;
      } else if (responseData && typeof responseData.content === "string") {
        // Falls die API ein Objekt mit content-Property zurückgibt
        summaryText = responseData.content;
      } else if (responseData && responseData.choices && responseData.choices[0]) {
        // Falls OpenAI-Standardformat zurückgegeben wird
        summaryText = responseData.choices[0].message?.content || "";
      } else {
        // Wenn nichts passt, aber trotzdem valides JSON
        console.warn("Unbekanntes JSON-Format:", responseData);
        summaryText = JSON.stringify(responseData);
      }
    } catch (jsonError) {
      // Wenn kein gültiges JSON, verwende den Text direkt
      console.log("Antwort ist kein JSON, verwende direkten Text");
      summaryText = responseText;
    }
    
    // Entferne alle Markdown-Formatierung, um sicherzustellen, dass kein Formatierungsproblem auftritt
    summaryText = summaryText
      .replace(/^#+\s+/gm, '') // Entferne alle Markdown-Überschriften 
      .replace(/^\s*[*-]\s+/gm, '- ') // Standardisiere Aufzählungspunkte
      .replace(/```[^`]*```/g, ''); // Entferne Code-Blöcke
    
    return summaryText;
  } catch (error) {
    console.error("Fehler bei der Generierung der Zusammenfassung:", error);
    throw error;
  }
}
