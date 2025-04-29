# Integration des konsolidierten Prompt-Builders

Dieser Plan beschreibt die Schritte zur vollständigen Integration des `prompt-builder.ts` in die EcomTask-Anwendung.

## Bereits durchgeführte Schritte

1. ✅ Konsolidierter Prompt-Builder wurde in `lib/prompt-builder.ts` erstellt
2. ✅ Linter-Fehler in `prompt-builder.ts` wurden behoben
3. ✅ Vollständige Integration in `app/chat/page.tsx` wurde durchgeführt
   - Der konsolisierte Prompt-Builder ersetzt jetzt die bisherige manuelle Prompt-Zusammensetzung

## Noch durchzuführende Schritte

1. **components/chat/chat-hooks/use-chat-handler.tsx anpassen**
   - Die Datei benötigt größere Änderungen, um die Import-Struktur korrekt anzupassen
   - `buildPrompt` anstelle von `buildFinalMessages` verwenden mit korrekten Parametern

2. **Anpassung anderer Chat-Komponenten**
   - Überprüfe, ob in `components/chat/chat-helpers/index.ts` Anpassungen nötig sind
   - Überprüfe, ob Tools-spezifische Komponenten die Prompt-Erstellung verwenden

3. **Migration der Gemini-Unterstützung**
   - Stelle sicher, dass die `adaptForGemini`-Funktion vollständig implementiert ist
   - Integriere die Gemini-Unterstützung in entsprechenden Komponenten

4. **Vollständige Test-Suite für den Prompt-Builder entwickeln**
   - Teste verschiedene Szenarien:
     - Standard-Chat
     - Tools-Verwendung
     - Wissensdatenbank-Integration
     - Gemini-Formatierung
   - Stelle Korrektheit sicher (richtige Reihenfolge der Nachrichten, korrektes Format)

5. **Geplante Entfernung des alten Systems**
   - Nach erfolgreicher Integration und Tests: `lib/build-prompt.ts` entfernen
   - Unnötige Importe und Code-Teile entfernen
   - Build-Fehler beheben, die durch die Entfernung entstehen könnten

6. **Dokumentation**
   - Dokumentiere die neue Prompt-Struktur
   - Erstelle Beispiele für die Verwendung des `prompt-builder.ts`
   - Halte fest, welche Parameter für welche Szenarien verwendet werden sollten

## Best Practices für die Verwendung

1. **Parameter konsistent halten**
   ```typescript
   const finalPrompt = buildPrompt({
     userInput,     // Aktuelle Benutzereingabe
     chatId,        // Aktuelle Chat-ID
     taskPrompt,    // Task-spezifischer Prompt, falls vorhanden
     systemPrompt,  // Standardprompt als Fallback
     userProfile,   // Benutzerprofil für Kontext
     knowledgeResults, // Wissensdatenbank-Ergebnisse
     pastMessages,  // Frühere relevante Nachrichten
     allMessages,   // Alle aktuellen Nachrichten des Chats
     modelType      // "default", "tools", "vision" oder "gemini"
   });
   ```

2. **Debugging**
   - Verwende `console.log("Final apiMessages array:", JSON.stringify(finalPrompt, null, 2))` 
     zum Debuggen des erstellten Prompts
   - Überprüfe, ob alle erwarteten Komponenten im finalen Prompt enthalten sind 