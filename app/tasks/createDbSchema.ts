import { createClient } from "@supabase/supabase-js"

// Stelle sicher, dass Umgebungsvariablen gesetzt sind
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Typ für die Rückgabe
type SetupResult = {
  success: boolean
  message: string
  error?: any
}

// Hauptfunktion zum Einrichten der Tasks-Tabelle
export async function setupTasksTable(): Promise<SetupResult> {
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      success: false,
      message: "Supabase-Konfiguration fehlt",
      error:
        "NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht gesetzt"
    }
  }

  // Erstelle einen Supabase-Client mit der Service-Rolle
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Prüfe, ob die Tabelle bereits existiert
    const { error: checkError, data: existingTables } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "tasks")

    if (checkError) {
      console.error("Fehler beim Prüfen der Tabelle:", checkError)
      return {
        success: false,
        message: "Fehler beim Prüfen der Tabelle",
        error: checkError
      }
    }

    // Wenn die Tabelle bereits existiert, breche ab oder führe ein Update durch
    if (existingTables && existingTables.length > 0) {
      return {
        success: true,
        message: "Tasks-Tabelle existiert bereits"
      }
    }

    // 2. Erstelle die Tasks-Tabelle mit SQL
    const { error: createError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE public.tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          priority VARCHAR(20) DEFAULT 'medium',
          due_date TIMESTAMP WITH TIME ZONE,
          user_id UUID REFERENCES auth.users(id),
          company_id UUID,
          department_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Index für schnellere Abfragen
        CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
        CREATE INDEX idx_tasks_company_id ON public.tasks(company_id);
        CREATE INDEX idx_tasks_status ON public.tasks(status);
        CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
        
        -- Row-Level-Security für Tasks
        ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
        
        -- Policy für Benutzer, um nur ihre eigenen Tasks oder die ihrer Firma zu sehen
        CREATE POLICY "Users can view their own tasks" 
          ON public.tasks FOR SELECT 
          USING (auth.uid() = user_id OR 
                (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())));
        
        -- Policy für Benutzer, um nur ihre eigenen Tasks zu bearbeiten
        CREATE POLICY "Users can update their own tasks" 
          ON public.tasks FOR UPDATE 
          USING (auth.uid() = user_id);
        
        -- Policy für Benutzer, um Tasks zu erstellen
        CREATE POLICY "Users can create tasks" 
          ON public.tasks FOR INSERT 
          WITH CHECK (auth.uid() IS NOT NULL);
      `
    })

    if (createError) {
      console.error("Fehler beim Erstellen der Tabelle:", createError)
      return {
        success: false,
        message: "Fehler beim Erstellen der Tasks-Tabelle",
        error: createError
      }
    }

    return {
      success: true,
      message: "Tasks-Tabelle erfolgreich erstellt"
    }
  } catch (error) {
    console.error(
      "Unerwarteter Fehler beim Einrichten der Tasks-Tabelle:",
      error
    )
    return {
      success: false,
      message: "Unerwarteter Fehler beim Einrichten der Tasks-Tabelle",
      error
    }
  }
}
