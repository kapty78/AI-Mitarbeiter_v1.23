# Prompt-Builder Migration Status

## Zusammenfassung

Die Migration des Prompt-Builder-Systems zu einer konsolidierten Implementierung in `lib/prompt-builder.ts` wurde erfolgreich begonnen. Diese Datei dokumentiert den aktuellen Fortschritt und die nächsten Schritte.

## Abgeschlossene Schritte

1. ✅ **Erstellung des konsolidierten Prompt-Builders**
   - Neue Datei `lib/prompt-builder.ts` erstellt
   - Interface `PromptBuilderOptions` für typsichere Parameter
   - Implementierung von Hilfsfunktionen für die verschiedenen Komponenten
   - Integration von beiden früheren Implementierungsansätzen

2. ✅ **Integration in Haupt-Chat-System**
   - `app/chat/page.tsx`: Vollständige Migration zu `buildPrompt`
   - Ersetzt die manuelle Prompt-Erstellung im `sendMessageToAPI`

3. ✅ **Integration in Chat-Helper-Funktionen**
   - `components/chat/chat-helpers/index.ts`: Implementierung in `handleLocalChat` und `handleHostedChat`
   - Hinzufügung von Fallback-Code für reibungslose Migration

4. ✅ **Erstellung eines neuen Chat-Handlers**
   - `components/chat/chat-hooks/use-chat-handler-new.tsx`: Bereinigtes File mit neuer Implementierung
   - Diese Datei kann als Referenz für die finale Migration dienen

## Offene Aufgaben

1. ⏳ **Behebung von TypeScript-Fehlern**
   - Problem mit `Tables` und `TablesInsert` Typen in mehreren Dateien
   - Import-Konflikte in `use-chat-handler.tsx`

2. ⏳ **Integration der Gemini-Unterstützung**
   - Vollständige Implementierung von `adaptForGemini` in `prompt-builder.ts`
   - Sicherstellen, dass die Anpassung korrekt funktioniert

3. ⏳ **Tests für alle Szenarien**
   - Testen der Integration mit verschiedenen Modelltypen
   - Überprüfung der Wissensdatenbank-Integration
   - Validierung der Tools-Verwendung

## Bekannte Probleme

1. 🐛 **Probleme mit dem ChatbotUIContext**
   - Die Struktur und Verfügbarkeit der Kontextvariablen muss harmonisiert werden
   - Unterschiedliche Implementations-Stile zwischen den Dateien

2. 🐛 **Import-Konflikte**
   - Doppelte Imports und nicht-existierende Module müssen bereinigt werden
   - Insbesondere in `components/chat/chat-hooks/use-chat-handler.tsx`

## Nächste Schritte

1. ▶️ **Abschluss der Integration in Chat-Hooks**
   - Behebung der Import-Probleme
   - Testen mit echten Chat-Szenarien

2. ▶️ **Dokumentation erstellen**
   - Dokumentieren der Prompt-Struktur und der verfügbaren Parameter
   - Erstellen von Beispielen für verschiedene Szenarien

3. ▶️ **Entfernung der alten Implementierung**
   - Nach erfolgreicher Migration: Entfernen von `lib/build-prompt.ts`
   - Bereinigen von nicht mehr verwendeten Importen und Funktionen

## Timeline

- **Phase 1:** Integration in Hauptkomponenten ✅
- **Phase 2:** Behebung von TypeScript-Fehlern (aktuell)
- **Phase 3:** Tests und Validierung
- **Phase 4:** Dokumentation und Aufräumen 