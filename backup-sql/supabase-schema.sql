-- Tabelle für Chat-Sitzungen
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabelle für Chat-Nachrichten
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indizes für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_session_id ON public.chat_messages(chat_session_id);

-- RLS (Row Level Security) Policies
-- Nur eigene Chat-Sitzungen anzeigen/bearbeiten
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_sessions_user_policy ON public.chat_sessions
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Nur Nachrichten zu eigenen Chat-Sitzungen anzeigen/bearbeiten
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_messages_user_policy ON public.chat_messages
    USING (chat_session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()))
    WITH CHECK (chat_session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()));

-- Trigger für updated_at Aktualisierung
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 