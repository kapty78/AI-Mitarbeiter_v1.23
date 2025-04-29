import { encode } from "gpt-tokenizer";

export interface PromptBuilderOptions {
  // Basisinformationen
  userInput: string;
  chatId: string;
  
  // Systemanweisungen
  taskPrompt?: string | null;
  systemPrompt?: string;
  
  // Benutzerprofil
  userProfile?: {
    full_name?: string;
    role?: string;
    company_name?: string;
    preferred_language?: string;
    communication_style?: string;
    expertise?: string;
    profile_context?: string;
  } | null;
  
  // Wissensdatenbank-Ergebnisse
  knowledgeResults?: Array<{
    content: string;
    source_name?: string;
    created_at?: string;
    similarity?: number;
  }>;
  
  // NEU: Chat-Fakten-Ergebnisse
  chatFacts?: Array<{
    content: string; // Der Faktentext
    similarity?: number;
  }>;
  
  // Kontextdaten
  pastMessages?: Array<{
    role: string;
    content: string;
    content_with_date?: string;
    created_at?: string;
    id?: string;
  }>;
  
  // Gesamte Nachrichtenkette
  allMessages?: Array<{
    role: string;
    content: string;
    id?: string;
    timestamp?: Date;
    image_paths?: string[];
    sequence_number?: number;
  }>;
  
  // Konfiguration
  modelType?: "default" | "tools" | "vision" | "gemini";
  includeWorkspaceInstructions?: boolean;
  workspaceInstructions?: string;
  contextLength?: number;
  maxPastMessages?: number;
  maxKnowledgeResults?: number;
  maxChatFacts?: number;
  assistant?: {
    name: string;
    id?: string;
  } | null;
  
  // Bilder und Dateien
  chatImages?: Array<{
    path: string;
    base64: string;
  }>;
  messageFileItems?: Array<any>;
  chatFileItems?: Array<any>;
}

/**
 * Standard-Systemprompt für die KI
 */
export const DEFAULT_SYSTEM_PROMPT = `
Du bist der AI-Mitarbeiter von EcomTask. 
Dein Ziel: präzise, fachlich korrekte Antworten mithilfer einer internen Wissensdatenbank, alten Gesprächsverläufen und deiner eigenen Intelligenz.
`.trim();

/**
 * Utility-Funktion zum Kürzen langer Texte
 */
function trimText(txt: string | null | undefined, maxWords = 60): string {
  if (!txt) return "";
  const words = txt.trim().split(/\s+/);
  if (words.length <= maxWords) return txt;
  return words.slice(0, maxWords).join(" ") + " …";
}

/**
 * Verarbeitet Benutzerprofildaten in ein formatiertes Prompt-Segment
 */
function formatUserProfileContext(userProfile: PromptBuilderOptions['userProfile']): string {
  if (!userProfile) return "";
  
  let userContextPrompt = `--- Benutzerkontext ---\n`;
  
  if (userProfile.full_name) {
    userContextPrompt += `Name: ${userProfile.full_name}\n`;
  }
  
  if (userProfile.role) {
    userContextPrompt += `Rolle: ${userProfile.role}\n`;
  }
  
  if (userProfile.company_name) {
    userContextPrompt += `Unternehmen: ${userProfile.company_name}\n`;
  }
  
  if (userProfile.preferred_language) {
    userContextPrompt += `Bevorzugte Sprache: ${userProfile.preferred_language}\n`;
  }
  
  if (userProfile.communication_style) {
    userContextPrompt += `Kommunikationsstil: ${userProfile.communication_style}\n`;
  }
  
  if (userProfile.expertise) {
    userContextPrompt += `Expertise/Fachwissen: ${userProfile.expertise}\n`;
  }
  
  userContextPrompt += `--- Ende Benutzerkontext ---\n\n`;
  return userContextPrompt;
}

/**
 * Erstellt einen formatierten Text aus Wissensdatenbank-Ergebnissen
 */
function formatKnowledgeResults(knowledgeResults: PromptBuilderOptions['knowledgeResults'], maxResults = 3): string {
  if (!knowledgeResults || knowledgeResults.length === 0) return "";
  
  // Sortiere nach Relevanz, falls vorhanden
  const sortedResults = [...knowledgeResults].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  
  // Erstelle formatierte Chunks
  const kbChunks = sortedResults
    .slice(0, maxResults)
    .map(c => 
      `\n<chunk source="${c.source_name || 'Unbekannt'}" paragraph="-" timestamp="${c.created_at || new Date().toISOString()}">\n${trimText(c.content, 75)}\n</chunk>`
    )
    .join(""); 
    
  return `<knowledge>\n${kbChunks}\n</knowledge>\n\n`;
}

/**
 * Wählt relevante frühere Nachrichten aus und formatiert sie
 */
function formatPastMessages(pastMessages: PromptBuilderOptions['pastMessages'], maxMessages = 4): string {
  if (!pastMessages || pastMessages.length === 0) return "";
  
  // Stelle sicher, dass wir ein Array mit gültigen Elementen haben
  const validMessages = pastMessages.filter(m => m && (m.content || m.content_with_date));
  if (validMessages.length === 0) return "";
  
  // Sortiere nach Datum für chronologische Auswahl
  const sortedByDate = [...validMessages].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
  });
  
  // Wähle wichtige Nachrichten aus (älteste, neueste, und relevanteste dazwischen)
  const selectedMessages = [];
  const includedIds = new Set<string>();
  
  // Älteste Nachricht
  if (sortedByDate.length > 0) {
    selectedMessages.push(sortedByDate[0]);
    if (sortedByDate[0].id) includedIds.add(sortedByDate[0].id);
  }
  
  // Neueste Nachricht
  if (sortedByDate.length > 1) {
    const newest = sortedByDate[sortedByDate.length - 1];
    if (!newest.id || !includedIds.has(newest.id)) {
      selectedMessages.push(newest);
      if (newest.id) includedIds.add(newest.id);
    }
  }
  
  // Sortiere nach Relevanz für die mittleren Nachrichten (mit Type Assertion für similarity)
  const sortedBySimilarity = [...validMessages].sort((a, b) => {
    // Typensichere Version mit optionalen Eigenschaften
    const similarityA = (a as any).similarity || 0;
    const similarityB = (b as any).similarity || 0;
    return similarityB - similarityA;
  });
  
  // Fülle bis zum Maximum auf
  for (const msg of sortedBySimilarity) {
    if (selectedMessages.length >= maxMessages) break;
    if (msg.id && !includedIds.has(msg.id)) {
      selectedMessages.push(msg);
      includedIds.add(msg.id);
    }
  }
  
  // Sortiere die finale Auswahl chronologisch
  selectedMessages.sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
  });
  
  // Formatiere die ausgewählten Nachrichten
  const historyChunks = selectedMessages
    .map(item => {
      const messageContent = item?.content || '';
      const role = item?.role;
      const createdAt = item?.created_at || new Date().toISOString();
      
      if (role === 'user') {
        const userContent = item?.content_with_date?.replace(/\[Datum: [^\]]+\]\n/, "") || item?.content || '';
        return `\n<past_user_msg when="${createdAt}">${trimText(userContent, 60)}</past_user_msg>`;
      } else if (role === 'assistant') {
        const assistantContent = item?.content_with_date?.replace(/\[Datum: [^\]]+\]\n/, "") || item?.content || '';
        return `\n<past_assistant_msg when="${createdAt}">${trimText(assistantContent, 60)}</past_assistant_msg>`;
      }
      return '';
    })
    .filter(Boolean)
    .join("");
  
  return `<past_dialogue>\n${historyChunks}\n</past_dialogue>\n\n`;
}

/**
 * NEU: Erstellt einen formatierten Text aus Chat-Fakten
 */
function formatChatFacts(chatFacts: PromptBuilderOptions['chatFacts'], maxFacts = 3): string {
  if (!chatFacts || chatFacts.length === 0) return "";
  
  // Sortiere nach Relevanz (höchste zuerst)
  const sortedFacts = [...chatFacts].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  
  const factChunks = sortedFacts
    .slice(0, maxFacts)
    .map(fact => `- ${fact.content}`) // Einfache Liste
    .join("\n");
    
  return `<chat_facts>\n**Relevante Fakten aus früheren Gesprächen:**\n${factChunks}\n</chat_facts>\n\n`;
}

/**
 * Hauptfunktion zum Erstellen des Prompts
 */
export function buildPrompt(options: PromptBuilderOptions): Array<{role: string, content: any}> {
  const {
    userInput,
    taskPrompt,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    userProfile,
    knowledgeResults,
    pastMessages,
    chatFacts,
    allMessages,
    modelType = "default",
    includeWorkspaceInstructions = false,
    workspaceInstructions = "",
    maxPastMessages = 4,
    maxKnowledgeResults = 3,
    maxChatFacts = 5,
    assistant,
    messageFileItems = [],
    chatFileItems = [],
    chatImages = [],
    contextLength
  } = options;
  
  // ========== V1-BASIERTER PROMPT (für tools, vision, gemini) ==========
  if (modelType === "tools" || modelType === "vision" || modelType === "gemini") {
    let basePrompt = "";
    
    // Rollendefinition (wenn ein spezifischer Assistent gewählt wurde)
    if (assistant?.name) {
      basePrompt += `<INJECT ROLE>\nYou are not an AI. You are ${assistant.name}.\n</INJECT ROLE>\n\n`;
    }
    
    // Datum
    basePrompt += `Today is ${new Date().toLocaleDateString()}.\n\n`;
    
    // Benutzerprofil
    if (userProfile?.profile_context) {
      basePrompt += `User Info:\n${userProfile.profile_context}\n\n`;
    }
    
    // Workspace-Anweisungen
    if (includeWorkspaceInstructions && workspaceInstructions) {
      basePrompt += `System Instructions:\n${workspaceInstructions}\n\n`;
    }
    
    // Task oder System Prompt
    const effectivePrompt = taskPrompt || systemPrompt;
    basePrompt += `User Instructions:\n${effectivePrompt}`;
    
    // Token-Berechnung
    const promptTokens = contextLength ? encode(basePrompt).length : 0;
    let remainingTokens = contextLength ? contextLength - promptTokens : Infinity;
    
    // Nachrichten für Tokenmanagement
    let finalMessages = [];
    
    if (allMessages && allMessages.length > 0 && contextLength) {
      for (let i = allMessages.length - 1; i >= 0; i--) {
        const message = allMessages[i];
        const messageTokens = encode(message.content).length;
        
        if (messageTokens <= remainingTokens) {
          remainingTokens -= messageTokens;
          finalMessages.unshift(message);
        } else {
          break;
        }
      }
    }
    
    // Formatiere für die API
    let formattedMessages = [];
    
    // System-Nachricht
    formattedMessages.push({
      role: "system",
      content: basePrompt
    });
    
    // Füge formatierte Nachrichten hinzu
    if (finalMessages.length > 0) {
      formattedMessages = [
        ...formattedMessages,
        ...finalMessages.map(message => {
          // Bilder verarbeiten
          if (message.image_paths && message.image_paths.length > 0) {
            return {
              role: message.role,
              content: [
                { type: "text", text: message.content },
                ...message.image_paths.map(path => {
                  let imageUrl = path;
                  
                  // Finde Base64-Darstellung falls vorhanden
                  if (!path.startsWith("data")) {
                    const chatImage = chatImages.find(img => img.path === path);
                    if (chatImage) {
                      imageUrl = chatImage.base64;
                    }
                  }
                  
                  return {
                    type: "image_url",
                    image_url: { url: imageUrl }
                  };
                })
              ]
            };
          }
          
          return {
            role: message.role,
            content: message.content
          };
        })
      ];
    }
    
    // Dateianhänge verarbeiten
    if (messageFileItems.length > 0) {
      const retrievalText = buildRetrievalText(messageFileItems);
      
      // Füge den Retrieval-Text zur letzten Nachricht hinzu
      const lastMessage = formattedMessages[formattedMessages.length - 1];
      
      // Typsichere Version für die Bearbeitung des Inhalts
      if (typeof lastMessage.content === 'string') {
        formattedMessages[formattedMessages.length - 1] = {
          ...lastMessage,
          content: `${lastMessage.content}\n\n${retrievalText}`
        };
      } 
      // Für den Fall komplexer Nachrichten mit Bildern behalten wir den Inhalt unverändert
      // (oder alternativ könnten wir ihn anpassen, wenn nötig)
    }
    
    return formattedMessages;
  }
  
  // ========== V2-BASIERTER PROMPT (Standardformat für chat) ==========
  else {
    const finalPrompt = [];
    
    // Systemnachricht (Task-Prompt oder Standard)
    if (taskPrompt) {
      finalPrompt.push({ role: "system", content: taskPrompt });
    } else {
      // Benutzerprofilinformationen dem System-Prompt hinzufügen, wenn vorhanden
      const userContextString = userProfile ? formatUserProfileContext(userProfile) : '';
      finalPrompt.push({ 
        role: "system", 
        content: systemPrompt + (userContextString ? '\n\n' + userContextString : '') 
      });
    }
    
    // Dynamischer Kontext erstellen
    let dynamicContextString = "";
    
    // Wissensbasis-Chunks
    if (knowledgeResults && knowledgeResults.length > 0) {
      dynamicContextString += formatKnowledgeResults(knowledgeResults, maxKnowledgeResults);
    }
    
    // Chat-Fakten (NEU)
    if (chatFacts && chatFacts.length > 0) {
      dynamicContextString += formatChatFacts(chatFacts, maxChatFacts);
    }
    
    // Frühere Gespräche
    if (pastMessages && pastMessages.length > 0) {
      dynamicContextString += formatPastMessages(pastMessages, maxPastMessages);
    }
    
    // Wenn dynamischer Kontext vorhanden ist, füge ihn als System-Nachricht hinzu
    if (dynamicContextString.trim()) {
      finalPrompt.push({ role: "system", content: dynamicContextString.trim() });
    }
    
    // Füge alle aktuellen Nachrichten hinzu, außer Systemnachrichten
    if (allMessages && allMessages.length > 0) {
      allMessages.forEach(msg => {
        if (msg.role !== "system") {
          finalPrompt.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    } 
    // Wenn keine allMessages übergeben wurden, mindestens die aktuelle Benutzereingabe hinzufügen
    else if (userInput) {
      finalPrompt.push({ role: "user", content: userInput });
    }
    
    return finalPrompt;
  }
}

/**
 * Hilfsfunktion zum Formatieren von Dateisuchergebnissen
 */
function buildRetrievalText(fileItems: any[]): string {
  const retrievalText = fileItems
    .map(item => `<BEGIN SOURCE>\n${item.content}\n</END SOURCE>`)
    .join("\n\n");

  return `You may use the following sources if needed to answer the user's question. If you don't know the answer, say "I don't know."\n\n${retrievalText}`;
}

/**
 * Hilfsfunktion für die Konvertierung zu Gemini-Format
 */
export function adaptForGemini(messages: Array<{role: string, content: any}>): any[] {
  // Implementierung der Anpassung für Google Gemini...
  return messages.map(message => {
    let role = "user";
    if (message.role === "assistant") {
      role = "model";
    }
    
    return {
      role,
      parts: Array.isArray(message.content)
        ? message.content.map(part => {
            if (part.type === "text") {
              return { text: part.text };
            } else if (part.type === "image_url") {
              // Konvertierung für Gemini-Format...
              return { /* ... */ };
            }
            return part;
          })
        : [{ text: message.content }]
    };
  });
} 