// Fix für die Tasks-Tabelle
// Dieses Skript fügt eine 'name'-Spalte zur tasks-Tabelle hinzu, falls sie nicht existiert

const { createClient } = require('@supabase/supabase-js');

// Supabase-Credentials - diese musst du mit deinen eigenen ersetzen
const supabaseUrl = 'https://acncbygzfvmuytjfcadk.supabase.co';
const supabaseKey = 'DEIN_SUPABASE_API_KEY'; // Ersetze durch deinen tatsächlichen API-Key

// Initialisiere Supabase-Client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTasksTable() {
  console.log('Starte Reparatur der Tasks-Tabelle...');

  try {
    // SQL-Statement zum Hinzufügen der 'name'-Spalte
    const sql = `
      -- Überprüfen, ob die Spalte 'name' bereits existiert
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'tasks' AND column_name = 'name'
          ) THEN
              -- Hinzufügen der 'name'-Spalte
              ALTER TABLE tasks ADD COLUMN name TEXT;
              
              -- Falls die Spalte 'title' existiert, kopiere die Werte von 'title' nach 'name'
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
      
      // Prüfe die aktuelle Struktur der Tabelle
      const { data: tableInfo, error: tableError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.error('Fehler beim Abrufen der Tabelleninformation:', tableError);
      } else {
        console.log('Verfügbare Spalten in der tasks-Tabelle:', tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'Keine Daten');
      }
    }

  } catch (err) {
    console.error('Unerwarteter Fehler:', err);
  }
}

// Führe die Reparatur aus
fixTasksTable(); 