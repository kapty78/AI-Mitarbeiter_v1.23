-- Drop table if it exists (optional, wenn du einen sauberen Neustart wünschst)
-- DROP TABLE IF EXISTS public.tasks;

-- Erstelle oder erweitere die tasks Tabelle mit allen benötigten Spalten
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    
    -- Basisfelder für Zeitsteuerung
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    due_date TIMESTAMPTZ, -- Einfaches Fälligkeitsdatum für einmalige Aufgaben
    
    -- Felder für wiederkehrende Aufgaben
    recurrence_type TEXT CHECK (recurrence_type IN ('once', 'daily', 'weekly', 'monthly', 'yearly', 'seasonal')),
    recurrence_interval INTEGER DEFAULT 1, -- z.B. alle 2 Wochen, alle 3 Tage usw.
    
    -- Spezifische Felder für wiederkehrende Zeitsteuerung
    recurrence_time TIME, -- Uhrzeit für die Fälligkeit
    recurrence_weekday INTEGER, -- 0-6 (Sonntag-Samstag) für wöchentliche Aufgaben
    recurrence_monthday INTEGER, -- 1-31 für monatliche Aufgaben
    recurrence_start_date DATE, -- Startdatum der Wiederholung
    recurrence_end_date DATE, -- Optionales Enddatum der Wiederholung
    
    -- Für saisonale Aufgaben
    season_start TEXT, -- Format: 'MM-DD'
    season_end TEXT, -- Format: 'MM-DD'
    
    -- Für Benachrichtigungen
    reminder_before_minutes INTEGER, -- Erinnerung X Minuten vor Fälligkeit
    
    -- Weitere Metadaten
    tags TEXT[],
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id),
    
    -- AI-Integration
    system_prompt TEXT,
    ai_model TEXT,
    
    -- Tracking
    completion_date TIMESTAMPTZ,
    completion_count INTEGER DEFAULT 0, -- Wie oft wurde die Aufgabe abgeschlossen (für wiederkehrende)
    next_due_date TIMESTAMPTZ -- Berechnetes nächstes Fälligkeitsdatum
);

-- Indizes für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_next_due_date ON public.tasks(next_due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_type ON public.tasks(recurrence_type);

-- Funktion zum Aktualisieren des updated_at Felds
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für die Aktualisierung des updated_at Felds
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Funktion zum Berechnen des nächsten Fälligkeitsdatums
CREATE OR REPLACE FUNCTION calculate_next_due_date()
RETURNS TRIGGER AS $$
DECLARE
    base_date TIMESTAMPTZ;
BEGIN
    -- Wenn die Aufgabe erledigt ist, berechne das nächste Fälligkeitsdatum basierend auf dem Wiederholungstyp
    IF NEW.status = 'done' AND NEW.recurrence_type != 'once' THEN
        -- Basisberechnung abhängig vom Typ
        CASE NEW.recurrence_type
            WHEN 'daily' THEN
                -- Tägliche Wiederholung basierend auf dem Intervall
                NEW.next_due_date := (CURRENT_DATE + (NEW.recurrence_interval || ' days')::INTERVAL)::DATE;
                
                -- Füge Uhrzeit hinzu, falls vorhanden
                IF NEW.recurrence_time IS NOT NULL THEN
                    NEW.next_due_date := NEW.next_due_date + NEW.recurrence_time;
                END IF;

            WHEN 'weekly' THEN
                -- Wöchentlich an bestimmten Wochentagen
                IF NEW.recurrence_weekday IS NOT NULL THEN
                    -- Finde den nächsten passenden Wochentag
                    base_date := CURRENT_DATE;
                    WHILE EXTRACT(DOW FROM base_date) != NEW.recurrence_weekday LOOP
                        base_date := base_date + INTERVAL '1 day';
                    END LOOP;
                    
                    -- Füge Intervall hinzu
                    NEW.next_due_date := base_date + ((NEW.recurrence_interval - 1) || ' weeks')::INTERVAL;
                ELSE
                    -- Wenn kein Wochentag angegeben ist, einfach X Wochen ab heute
                    NEW.next_due_date := CURRENT_DATE + (NEW.recurrence_interval || ' weeks')::INTERVAL;
                END IF;
                
                -- Füge Uhrzeit hinzu, falls vorhanden
                IF NEW.recurrence_time IS NOT NULL THEN
                    NEW.next_due_date := NEW.next_due_date + NEW.recurrence_time;
                END IF;

            WHEN 'monthly' THEN
                -- Monatlich am gleichen Tag
                IF NEW.recurrence_monthday IS NOT NULL THEN
                    -- Versuche, das Datum mit dem angegebenen Tag im Monat zu erstellen
                    BEGIN
                        -- Setze das Datum auf den gewünschten Tag im nächsten Monat
                        NEW.next_due_date := make_date(
                            EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
                            EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER + NEW.recurrence_interval,
                            LEAST(NEW.recurrence_monthday, EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'))::INTEGER)
                        );
                    EXCEPTION WHEN OTHERS THEN
                        -- Fallback: Verwende den letzten Tag des Monats, wenn der Tag ungültig ist
                        NEW.next_due_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
                    END;
                ELSE
                    -- Wenn kein bestimmter Tag angegeben ist, einfach X Monate ab heute
                    NEW.next_due_date := CURRENT_DATE + (NEW.recurrence_interval || ' months')::INTERVAL;
                END IF;
                
                -- Füge Uhrzeit hinzu, falls vorhanden
                IF NEW.recurrence_time IS NOT NULL THEN
                    NEW.next_due_date := NEW.next_due_date + NEW.recurrence_time;
                END IF;

            WHEN 'yearly' THEN
                -- Jährlich am gleichen Datum
                NEW.next_due_date := (CURRENT_DATE + (NEW.recurrence_interval || ' years')::INTERVAL)::DATE;
                
                -- Füge Uhrzeit hinzu, falls vorhanden
                IF NEW.recurrence_time IS NOT NULL THEN
                    NEW.next_due_date := NEW.next_due_date + NEW.recurrence_time;
                END IF;

            WHEN 'seasonal' THEN
                -- Saisonale Wiederholung basierend auf season_start und season_end
                IF NEW.season_start IS NOT NULL THEN
                    DECLARE
                        month_start INTEGER;
                        day_start INTEGER;
                        current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
                        start_date DATE;
                    BEGIN
                        -- Parse MM-DD Format
                        month_start := SPLIT_PART(NEW.season_start, '-', 1)::INTEGER;
                        day_start := SPLIT_PART(NEW.season_start, '-', 2)::INTEGER;
                        
                        -- Erstelle Datum für dieses Jahr
                        start_date := make_date(current_year, month_start, day_start);
                        
                        -- Wenn das Startdatum in der Zukunft liegt, verwende es
                        IF start_date > CURRENT_DATE THEN
                            NEW.next_due_date := start_date;
                        ELSE
                            -- Sonst nächstes Jahr
                            NEW.next_due_date := make_date(current_year + 1, month_start, day_start);
                        END IF;
                        
                        -- Füge Uhrzeit hinzu, falls vorhanden
                        IF NEW.recurrence_time IS NOT NULL THEN
                            NEW.next_due_date := NEW.next_due_date + NEW.recurrence_time;
                        END IF;
                    END;
                END IF;
        END CASE;
        
        -- Erhöhe den Zähler für Abschlüsse
        NEW.completion_count := COALESCE(NEW.completion_count, 0) + 1;
        -- Setze Abschlussdatum
        NEW.completion_date := now();
        -- Setze Status zurück auf 'todo' für die nächste Wiederholung
        NEW.status := 'todo';
    ELSIF NEW.recurrence_type = 'once' AND NEW.status = 'done' THEN
        -- Für einmalige Aufgaben, setze das Abschlussdatum
        NEW.completion_date := now();
        NEW.completion_count := 1;
        -- Kein next_due_date für einmalige Aufgaben
        NEW.next_due_date := NULL;
    ELSIF NEW.recurrence_type != 'once' AND NEW.status != 'done' AND NEW.next_due_date IS NULL THEN
        -- Initialisiere next_due_date für neue wiederkehrende Aufgaben
        NEW.next_due_date := COALESCE(NEW.due_date, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für die Berechnung des nächsten Fälligkeitsdatums
DROP TRIGGER IF EXISTS calculate_task_next_due_date ON public.tasks;
CREATE TRIGGER calculate_task_next_due_date
BEFORE INSERT OR UPDATE OF status, recurrence_type, recurrence_interval, 
                           recurrence_weekday, recurrence_monthday, recurrence_time
ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION calculate_next_due_date();

-- Spalten hinzufügen, falls die Tabelle bereits existiert
DO $$
BEGIN
    -- Prüfen und hinzufügen: recurrence_time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'recurrence_time') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence_time TIME;
    END IF;
    
    -- Prüfen und hinzufügen: recurrence_weekday
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'recurrence_weekday') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence_weekday INTEGER;
    END IF;
    
    -- Prüfen und hinzufügen: recurrence_monthday
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'recurrence_monthday') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence_monthday INTEGER;
    END IF;
    
    -- Prüfen und hinzufügen: recurrence_start_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'recurrence_start_date') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence_start_date DATE;
    END IF;
    
    -- Prüfen und hinzufügen: recurrence_end_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'recurrence_end_date') THEN
        ALTER TABLE public.tasks ADD COLUMN recurrence_end_date DATE;
    END IF;
    
    -- Prüfen und hinzufügen: reminder_before_minutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'reminder_before_minutes') THEN
        ALTER TABLE public.tasks ADD COLUMN reminder_before_minutes INTEGER;
    END IF;
    
    -- Prüfen und hinzufügen: completion_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'completion_date') THEN
        ALTER TABLE public.tasks ADD COLUMN completion_date TIMESTAMPTZ;
    END IF;
    
    -- Prüfen und hinzufügen: completion_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'completion_count') THEN
        ALTER TABLE public.tasks ADD COLUMN completion_count INTEGER DEFAULT 0;
    END IF;
    
    -- Prüfen und hinzufügen: next_due_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'next_due_date') THEN
        ALTER TABLE public.tasks ADD COLUMN next_due_date TIMESTAMPTZ;
    END IF;
    
    -- Ändere den Check-Constraint für recurrence_type, falls nötig
    EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_recurrence_type_check';
    EXECUTE 'ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_type_check 
             CHECK (recurrence_type IN (''once'', ''daily'', ''weekly'', ''monthly'', ''yearly'', ''seasonal''))';
END$$;

-- RLS-Policies für Sicherheit
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy für Lesen: Benutzer können nur ihre eigenen Aufgaben sehen
DROP POLICY IF EXISTS tasks_select_policy ON public.tasks;
CREATE POLICY tasks_select_policy ON public.tasks 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy für Einfügen: Benutzer können nur Aufgaben für sich selbst erstellen
DROP POLICY IF EXISTS tasks_insert_policy ON public.tasks;
CREATE POLICY tasks_insert_policy ON public.tasks 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy für Aktualisieren: Benutzer können nur ihre eigenen Aufgaben aktualisieren
DROP POLICY IF EXISTS tasks_update_policy ON public.tasks;
CREATE POLICY tasks_update_policy ON public.tasks 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy für Löschen: Benutzer können nur ihre eigenen Aufgaben löschen
DROP POLICY IF EXISTS tasks_delete_policy ON public.tasks;
CREATE POLICY tasks_delete_policy ON public.tasks 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Kommentar für die Tabelle
COMMENT ON TABLE public.tasks IS 'Aufgabenverwaltung mit Unterstützung für wiederkehrende Aufgaben und AI-Integration'; 