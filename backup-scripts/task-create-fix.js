/**
 * FIX FÜR DAS "COULD NOT FIND THE 'NAME' COLUMN OF 'TASKS'" PROBLEM
 * 
 * ANLEITUNG:
 * 
 * 1. Finde die Datei, in der du Tasks erstellst. 
 *    Meistens ist diese unter app/tasks/page.tsx oder app/chat/page.tsx zu finden.
 * 
 * 2. Suche nach dem Code, der ähnlich wie folgt aussieht:
 * 
 *    const newTask = {
 *      name: taskName,  // <-- Dies ist das Problem
 *      description: taskDescription,
 *      system_prompt: taskSystemPrompt,
 *      preferred_model: selectedModel,
 *      user_id: user.id
 *    }
 * 
 * 3. Ändere 'name' zu 'title':
 * 
 *    const newTask = {
 *      title: taskName,  // <-- Hier 'name' zu 'title' ändern
 *      description: taskDescription,
 *      system_prompt: taskSystemPrompt,
 *      preferred_model: selectedModel,
 *      user_id: user.id
 *    }
 * 
 * 4. Speichere die Datei und lade die Anwendung neu.
 * 
 * Alternative Lösung: Datenbankschema anpassen
 * 
 * Wenn du direkten Zugriff auf die Supabase-Datenbank hast, führe folgendes SQL aus:
 * 
 * ALTER TABLE tasks ADD COLUMN IF NOT EXISTS name TEXT;
 * 
 * Dies fügt eine 'name'-Spalte hinzu, ohne bestehende Daten zu beeinträchtigen.
 */ 