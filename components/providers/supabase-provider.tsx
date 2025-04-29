"use client"; // Wichtig! Dieser Provider MUSS eine Client-Komponente sein

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Database } from '@/supabase/types'; // Sicherstellen, dass dieser Pfad korrekt ist

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Erstellt den Client *einmalig* im State, um Re-Rendern zu vermeiden
  const [supabaseClient] = useState(() => createClientComponentClient<Database>());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
} 