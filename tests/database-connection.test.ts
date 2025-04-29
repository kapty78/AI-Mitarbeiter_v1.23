import { createClient } from '@supabase/supabase-js';

// Supabase-Konfiguration aus env-Variablen
const supabaseUrl = 'https://zdqelbwhfkfiuzodosri.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkcWVsYndoZmtmaXV6b2Rvc3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NjMyOTYsImV4cCI6MjA1OTIzOTI5Nn0.95--C-y51vDmzjEh2nugMdpYd3o5BCSHuPZNkf_mHZ0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Variablen für Test-IDs
let testUserId: string;
let testWorkspaceId: string;
let testChatId: string;
let testTaskId: string;
let testMessageId: string;

// Führe Tests nacheinander aus
async function runTests() {
  console.log('🔄 Starte Datenbank-Verbindungstests...');

  try {
    // Test 0: Überprüfe Supabase-Verbindung
    console.log('🔌 Test 0: Supabase-Verbindung prüfen');
    const { data: connectionTest, error: connectionError } = await supabase.from('workspaces').select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) throw connectionError;
    console.log('✅ Supabase-Verbindung erfolgreich hergestellt');

    // Test 1a: Testbenutzer erstellen
    console.log('🔑 Test 1a: Testbenutzer erstellen (falls noch nicht vorhanden)');
    const testEmail = 'test@example.com';
    const testPassword = 'Test1234!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError && signUpError.message !== 'User already registered') {
      throw signUpError;
    }
    
    console.log('✅ Registrierung überprüft, jetzt einloggen');
    
    // Test 1b: Benutzerauthentifizierung
    console.log('🔑 Test 1b: Benutzerauthentifizierung');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError) throw authError;
    testUserId = authData.user!.id;
    console.log('✅ Benutzer authentifiziert:', testUserId);

    // Test 2: Workspace-Daten lesen
    console.log('📂 Test 2: Workspace-Daten lesen');
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .limit(1);

    if (workspacesError) throw workspacesError;
    console.log('✅ Workspaces abgerufen:', workspaces.length);
    
    if (workspaces.length > 0) {
      testWorkspaceId = workspaces[0].id;
      console.log('✅ Bestehenden Workspace gefunden:', testWorkspaceId);
    } else {
      // Test 3: Neuen Workspace erstellen
      console.log('🆕 Test 3: Neuen Workspace erstellen');
      const { data: newWorkspace, error: createWorkspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: 'Test Workspace',
          description: 'Ein Testworkspace',
          user_id: testUserId,
          is_home: false,
        })
        .select()
        .single();

      if (createWorkspaceError) throw createWorkspaceError;
      testWorkspaceId = newWorkspace.id;
      console.log('✅ Workspace erstellt:', testWorkspaceId);
    }

    // Test 4: Chat erstellen
    console.log('💬 Test 4: Chat erstellen');
    const { data: newChat, error: createChatError } = await supabase
      .from('chats')
      .insert({
        name: 'Test Chat',
        title: 'Ein Testchat',
        workspace_id: testWorkspaceId,
        user_id: testUserId,
      })
      .select()
      .single();

    if (createChatError) throw createChatError;
    testChatId = newChat.id;
    console.log('✅ Chat erstellt:', testChatId);

    // Test 5: Nachricht erstellen
    console.log('📝 Test 5: Nachricht erstellen');
    const { data: newMessage, error: createMessageError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: testChatId,
        role: 'user',
        content: 'Dies ist eine Testnachricht',
        user_id: testUserId,
      })
      .select()
      .single();

    if (createMessageError) throw createMessageError;
    testMessageId = newMessage.id;
    console.log('✅ Nachricht erstellt:', testMessageId);

    // Test 6: Task erstellen
    console.log('📋 Test 6: Task erstellen');
    const { data: newTask, error: createTaskError } = await supabase
      .from('tasks')
      .insert({
        title: 'Test Task',
        description: 'Eine Testaufgabe',
        status: 'todo',
        priority: 'medium',
        user_id: testUserId,
        workspace_id: testWorkspaceId,
      })
      .select()
      .single();

    if (createTaskError) throw createTaskError;
    testTaskId = newTask.id;
    console.log('✅ Task erstellt:', testTaskId);

    // Test 7: User Preferences lesen oder erstellen
    console.log('⚙️ Test 7: User Preferences testen');
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .maybeSingle();

    if (prefsError) throw prefsError;
    if (userPrefs) {
      console.log('✅ User Preferences gelesen:', userPrefs.theme);
    } else {
      const { data: newPrefs, error: createPrefsError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: testUserId,
          theme: 'dark',
          language: 'de',
        })
        .select()
        .single();

      if (createPrefsError) throw createPrefsError;
      console.log('✅ User Preferences erstellt:', newPrefs.theme);
    }

    // Test 8: Datenzusammenhang testen (Nachrichten eines Chats abrufen)
    console.log('🔄 Test 8: Datenzusammenhang testen');
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', testChatId);

    if (messagesError) throw messagesError;
    console.log(`✅ ${messages.length} Nachrichten für Chat abgerufen`);

    // Test 9: Task aktualisieren
    console.log('🔄 Test 9: Task aktualisieren');
    const { data: updatedTask, error: updateTaskError } = await supabase
      .from('tasks')
      .update({ status: 'in_progress' })
      .eq('id', testTaskId)
      .select()
      .single();

    if (updateTaskError) throw updateTaskError;
    console.log('✅ Task aktualisiert:', updatedTask.status);

    // Test 10: Chat-Abfrage mit Join
    console.log('🔄 Test 10: Komplexere Abfrage mit Join');
    const { data: chatWithMessages, error: joinQueryError } = await supabase
      .from('chats')
      .select(`
        id, 
        name, 
        chat_messages (id, content, role)
      `)
      .eq('id', testChatId);

    if (joinQueryError) throw joinQueryError;
    console.log('✅ Chat mit Nachrichten abgerufen:', 
      chatWithMessages[0].name, 
      `(${chatWithMessages[0].chat_messages?.length || 0} Nachrichten)`
    );

    console.log('🎉 Alle Tests erfolgreich abgeschlossen!');

  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error);
  }
}

// Tests ausführen
runTests(); 