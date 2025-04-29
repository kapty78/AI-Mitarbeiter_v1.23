const { createClient } = require('@supabase/supabase-js');

// Supabase-Konfiguration aus env-Variablen
const supabaseUrl = 'https://zdqelbwhfkfiuzodosri.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkcWVsYndoZmtmaXV6b2Rvc3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NjMyOTYsImV4cCI6MjA1OTIzOTI5Nn0.95--C-y51vDmzjEh2nugMdpYd3o5BCSHuPZNkf_mHZ0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hilfsfunktion zum Extrahieren von Fehlermeldungen
function getErrorMessage(error) {
  if (!error) return 'Unbekannter Fehler';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error.message) return error.message;
  if (error.error) return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
  if (error.code) return `Fehlercode: ${error.code}${error.details ? ` - ${error.details}` : ''}`;
  return JSON.stringify(error);
}

// Führe Tests nacheinander aus
async function runTests() {
  console.log('🔄 Starte Datenbank-Verbindungstests...');

  try {
    // Test 0: Überprüfe Supabase-Verbindung
    console.log('🔌 Test 0: Supabase-Verbindung prüfen');
    const { data: connectionTest, error: connectionError } = await supabase.from('workspaces').select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) {
      console.log('❌ Fehler bei der Supabase-Verbindung:', getErrorMessage(connectionError));
      console.log('Details:', JSON.stringify(connectionError, null, 2));
    } else {
      console.log('✅ Supabase-Verbindung erfolgreich hergestellt');
    }

    // Test 1: Tabellen auflisten
    console.log('📋 Test 1: Tabellen überprüfen');
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .limit(5);

    if (workspacesError) {
      console.log('❌ Fehler beim Abrufen von Workspaces:', getErrorMessage(workspacesError));
      console.log('Details:', JSON.stringify(workspacesError, null, 2));
    } else {
      console.log(`✅ Workspaces-Tabelle gefunden mit ${workspaces.length} Einträgen`);
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);

    if (tasksError) {
      console.log('❌ Fehler beim Abrufen von Tasks:', getErrorMessage(tasksError));
      console.log('Details:', JSON.stringify(tasksError, null, 2));
    } else {
      console.log(`✅ Tasks-Tabelle gefunden mit ${tasks.length} Einträgen`);
    }

    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .limit(5);

    if (chatsError) {
      console.log('❌ Fehler beim Abrufen von Chats:', getErrorMessage(chatsError));
      console.log('Details:', JSON.stringify(chatsError, null, 2));
    } else {
      console.log(`✅ Chats-Tabelle gefunden mit ${chats.length} Einträgen`);
    }

    const { data: chatMessages, error: chatMessagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(5);

    if (chatMessagesError) {
      console.log('❌ Fehler beim Abrufen von Chat-Nachrichten:', getErrorMessage(chatMessagesError));
      console.log('Details:', JSON.stringify(chatMessagesError, null, 2));
    } else {
      console.log(`✅ Chat-Messages-Tabelle gefunden mit ${chatMessages.length} Einträgen`);
    }

    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .limit(5);

    if (filesError) {
      console.log('❌ Fehler beim Abrufen von Dateien:', getErrorMessage(filesError));
      console.log('Details:', JSON.stringify(filesError, null, 2));
    } else {
      console.log(`✅ Files-Tabelle gefunden mit ${files.length} Einträgen`);
    }

    const { data: userPrefs, error: userPrefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(5);

    if (userPrefsError) {
      console.log('❌ Fehler beim Abrufen von User-Preferences:', getErrorMessage(userPrefsError));
      console.log('Details:', JSON.stringify(userPrefsError, null, 2));
    } else {
      console.log(`✅ User-Preferences-Tabelle gefunden mit ${userPrefs.length} Einträgen`);
    }

    console.log('🎉 Datenbankverbindungstests abgeschlossen!');

  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', getErrorMessage(error));
    console.error('Details:', JSON.stringify(error, null, 2));
  }
}

// Tests ausführen
runTests(); 