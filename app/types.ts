/**
 * Zentrale Typendefinitionen für die App
 */

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isTypewriting?: boolean
}

export interface ChatSession {
  id: string
  name: string
  created_at: string
  description?: string
  last_message_timestamp?: string
}

export interface Task {
  id: string
  title: string
  description: string
  system_prompt: string
  ai_model: string
  created_at?: string
  updated_at?: string
  user_id?: string
  workspace_id?: string | null
}
