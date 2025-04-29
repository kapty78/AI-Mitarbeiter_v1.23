// Kopiere diesen Code und führe ihn in der Browserkonsole aus (F12 -> Console)

async function fixTasksTable() {
  console.log('Starte Reparatur der Tasks-Tabelle...');
  
  try {
    // Hole den Supabase-Client, der bereits auf der Seite initialisiert ist
    // (Funktioniert nur, wenn du auf einer Seite bist, die bereits Supabase verwendet)
    const supabase = window._SUPABASE_CLIENT;
    
    if (!supabase) {
      console.error('Supabase-Client nicht gefunden! Stelle sicher, dass du auf einer Seite bist, die Supabase verwendet.');
      return;
    }

    // SQL-Statement zum Hinzufügen der 'name'-Spalte
    const sql = `
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'tasks' AND column_name = 'name'
          ) THEN
              ALTER TABLE tasks ADD COLUMN name TEXT;
              
              IF EXISTS (
                  SELECT FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'title'
              ) THEN
                  UPDATE tasks SET name = title;
              END IF;
          END IF;
      END $$;
    `;

    // SQL ausführen über die RPC-Funktion
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });

    if (error) {
      console.error('Fehler beim Ausführen des SQL:', error);
    } else {
      console.log('Reparatur erfolgreich abgeschlossen!');
      alert('Die Tasks-Tabelle wurde erfolgreich repariert. Bitte lade die Seite neu.');
    }
  } catch (err) {
    console.error('Unerwarteter Fehler:', err);
  }
}

// Führe die Funktion aus
fixTasksTable(); 