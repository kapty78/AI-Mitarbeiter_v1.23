export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      archived_chat_messages: {
        Row: {
          archived_at: string
          archived_by: string | null
          chat_id: string
          content: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          chat_id: string
          content?: string | null
          created_at?: string | null
          id: string
          metadata?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          chat_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      archived_chats: {
        Row: {
          archived_at: string
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          name: string
          sharing: string
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string
          created_at: string
          description?: string | null
          folder_id?: string | null
          id: string
          name: string
          sharing: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          archived_at?: string
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          name?: string
          sharing?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      archived_profiles: {
        Row: {
          archived_at: string
          archived_by: string | null
          avatar_url: string | null
          company_id: string | null
          email: string | null
          full_name: string | null
          id: string
          metadata: Json | null
          role: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          avatar_url?: string | null
          company_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          metadata?: Json | null
          role?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          avatar_url?: string | null
          company_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      archived_project_responsibilities: {
        Row: {
          archived_at: string
          archived_by: string | null
          created_at: string | null
          id: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string | null
          id: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      archived_projects: {
        Row: {
          archived_at: string
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string
          created_at: string
          description?: string | null
          id: string
          name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          archived_at?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      archived_tasks: {
        Row: {
          ai_model: string | null
          archived_at: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          system_prompt: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          ai_model?: string | null
          archived_at?: string
          created_at: string
          description?: string | null
          due_date?: string | null
          id: string
          priority?: string | null
          status?: string | null
          system_prompt?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          ai_model?: string | null
          archived_at?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          system_prompt?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      archived_workspace_members: {
        Row: {
          archived_at: string
          archived_by: string | null
          created_at: string | null
          id: string
          role: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string | null
          id: string
          role?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      archived_workspaces: {
        Row: {
          archived_at: string
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_home: boolean
          is_team: boolean | null
          name: string
          settings: Json | null
          sharing: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string
          created_at: string
          description?: string | null
          id: string
          image_path?: string | null
          is_home: boolean
          is_team?: boolean | null
          name: string
          settings?: Json | null
          sharing: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_home?: boolean
          is_team?: boolean | null
          name?: string
          settings?: Json | null
          sharing?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          facts_extracted: boolean
          id: string
          metadata: Json | null
          role: string
          sentfrom: string | null
          tokens: number | null
          user_id: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          facts_extracted?: boolean
          id?: string
          metadata?: Json | null
          role: string
          sentfrom?: string | null
          tokens?: number | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          facts_extracted?: boolean
          id?: string
          metadata?: Json | null
          role?: string
          sentfrom?: string | null
          tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          ai_model: string | null
          created_at: string | null
          description: string | null
          id: string
          last_message_at: string | null
          last_message_timestamp: string | null
          name: string
          project_id: string | null
          system_prompt: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          last_message_timestamp?: string | null
          name: string
          project_id?: string | null
          system_prompt?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          last_message_timestamp?: string | null
          name?: string
          project_id?: string | null
          system_prompt?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_admins: {
        Row: {
          company_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_size: number | null
          chunk_type: string | null
          content: string
          content_position: number | null
          content_tsv: unknown | null
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          local_embedding: string | null
        }
        Insert: {
          chunk_size?: number | null
          chunk_type?: string | null
          content: string
          content_position?: number | null
          content_tsv?: unknown | null
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          local_embedding?: string | null
        }
        Update: {
          chunk_size?: number | null
          chunk_type?: string | null
          content?: string
          content_position?: number | null
          content_tsv?: unknown | null
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          local_embedding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_processing_status: {
        Row: {
          document_id: string
          error: string | null
          message: string | null
          progress: number
          status: string
          updated_at: string | null
        }
        Insert: {
          document_id: string
          error?: string | null
          message?: string | null
          progress?: number
          status: string
          updated_at?: string | null
        }
        Update: {
          document_id?: string
          error?: string | null
          message?: string | null
          progress?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_processing_status_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          storage_url: string
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          storage_url: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          storage_url?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          chat_id: string | null
          created_at: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          name: string
          path: string
          size: number
          task_id: string | null
          type: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          name: string
          path: string
          size: number
          task_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          name?: string
          path?: string
          size?: number
          task_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_groups: {
        Row: {
          created_at: string
          group_id: string
          id: string
          knowledge_base_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          knowledge_base_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          knowledge_base_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "knowledge_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_groups_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          sharing: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sharing?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sharing?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "knowledge_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          content: string
          created_at: string | null
          document_id: string | null
          id: string
          knowledge_base_id: string
          linked_context_id: string | null
          local_embedding: string | null
          openai_embedding: string | null
          segment_index: number | null
          source_chunk: string | null
          source_name: string
          source_type: string
          tokens: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          knowledge_base_id: string
          linked_context_id?: string | null
          local_embedding?: string | null
          openai_embedding?: string | null
          segment_index?: number | null
          source_chunk?: string | null
          source_name: string
          source_type: string
          tokens: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          knowledge_base_id?: string
          linked_context_id?: string | null
          local_embedding?: string | null
          openai_embedding?: string | null
          segment_index?: number | null
          source_chunk?: string | null
          source_name?: string
          source_type?: string
          tokens?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_linked_context_id_fkey"
            columns: ["linked_context_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_source_chunk_fkey"
            columns: ["source_chunk"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      message_embeddings: {
        Row: {
          chat_id: string
          company_id: string | null
          created_at: string | null
          embedding: string | null
          fact_source: string
          id: string
          message_id: string | null
          role: string
          source_content: string | null
          workspace_id: string | null
        }
        Insert: {
          chat_id: string
          company_id?: string | null
          created_at?: string | null
          embedding?: string | null
          fact_source?: string
          id?: string
          message_id?: string | null
          role: string
          source_content?: string | null
          workspace_id?: string | null
        }
        Update: {
          chat_id?: string
          company_id?: string | null
          created_at?: string | null
          embedding?: string | null
          fact_source?: string
          id?: string
          message_id?: string | null
          role?: string
          source_content?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_embeddings_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_embeddings_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_embeddings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          communication_style: string | null
          company_id: string | null
          company_name: string | null
          email: string | null
          expertise: string | null
          full_name: string | null
          id: string
          pending_archive: boolean | null
          preferred_language: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          communication_style?: string | null
          company_id?: string | null
          company_name?: string | null
          email?: string | null
          expertise?: string | null
          full_name?: string | null
          id: string
          pending_archive?: boolean | null
          preferred_language?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          communication_style?: string | null
          company_id?: string | null
          company_name?: string | null
          email?: string | null
          expertise?: string | null
          full_name?: string | null
          id?: string
          pending_archive?: boolean | null
          preferred_language?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_responsibilities: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_responsibilities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          metadata: Json | null
          name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_model: string | null
          archived_at: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          knowledge_base_ids: string[] | null
          next_due_date: string | null
          priority: string | null
          project_id: string | null
          recurrence_interval: number | null
          recurrence_monthday: number | null
          recurrence_time: string | null
          recurrence_type: string | null
          recurrence_weekday: number | null
          season_end: string | null
          season_start: string | null
          status: string | null
          system_prompt: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          ai_model?: string | null
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          knowledge_base_ids?: string[] | null
          next_due_date?: string | null
          priority?: string | null
          project_id?: string | null
          recurrence_interval?: number | null
          recurrence_monthday?: number | null
          recurrence_time?: string | null
          recurrence_type?: string | null
          recurrence_weekday?: number | null
          season_end?: string | null
          season_start?: string | null
          status?: string | null
          system_prompt?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          ai_model?: string | null
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          knowledge_base_ids?: string[] | null
          next_due_date?: string | null
          priority?: string | null
          project_id?: string | null
          recurrence_interval?: number | null
          recurrence_monthday?: number | null
          recurrence_time?: string | null
          recurrence_type?: string | null
          recurrence_weekday?: number | null
          season_end?: string | null
          season_start?: string | null
          status?: string | null
          system_prompt?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string | null
          created_at: string
          details: Json | null
          duration: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          details?: Json | null
          duration?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          details?: Json | null
          duration?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_archive_requests: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_by: string
          status: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_by: string
          status?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_by?: string
          status?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          default_ai_model: string | null
          language: string | null
          notifications: boolean | null
          preferences: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_ai_model?: string | null
          language?: string | null
          notifications?: boolean | null
          preferences?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_ai_model?: string | null
          language?: string | null
          notifications?: boolean | null
          preferences?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string | null
          joined_at: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          joined_at?: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          joined_at?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_home: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_home?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_home?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      project_responsibilities_with_users: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          project_id: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_responsibilities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_workspace_member: {
        Args: { invitee_user_id: string; target_workspace_id: string }
        Returns: undefined
      }
      admin_delete_profile: {
        Args: { profile_id: string }
        Returns: undefined
      }
      archive_and_delete_workspace: {
        Args: { workspace_id_param: string }
        Returns: undefined
      }
      archive_company_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_kb_group_access: {
        Args: { kb_id: string }
        Returns: boolean
      }
      complete_archive_user: {
        Args: { target_user_id: string; admin_user_id?: string }
        Returns: Json
      }
      create_company_admin: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: undefined
      }
      create_project: {
        Args: {
          p_name: string
          p_description: string
          p_user_id: string
          p_workspace_id: string
          p_color?: string
          p_status?: string
        }
        Returns: Json
      }
      cursor_local_vector_search: {
        Args: {
          p_user_id: string
          p_query_embedding: string
          p_match_threshold?: number
          p_match_count?: number
          p_workspace_id?: string
        }
        Returns: {
          id: string
          document_id: string
          content: string
          similarity: number
          document_title: string
          document_url: string
        }[]
      }
      cursor_text_search: {
        Args: {
          p_user_id: string
          p_query: string
          p_match_count?: number
          p_workspace_id?: string
        }
        Returns: {
          id: string
          document_id: string
          content: string
          rank: number
          document_title: string
          document_url: string
        }[]
      }
      cursor_vector_search: {
        Args: {
          p_user_id: string
          p_query_embedding: string
          p_match_threshold?: number
          p_match_count?: number
          p_workspace_id?: string
        }
        Returns: {
          id: string
          document_id: string
          content: string
          similarity: number
          document_title: string
          document_url: string
        }[]
      }
      delete_knowledge_base_and_related_data: {
        Args: { kb_id: string; user_id_check: string }
        Returns: undefined
      }
      find_knowledge_facts_with_chunks: {
        Args: {
          p_query_text: string
          p_knowledge_base_id: string
          p_match_threshold?: number
          p_match_count?: number
        }
        Returns: {
          fact_id: string
          fact_content: string
          fact_source_name: string
          chunk_id: string
          chunk_content: string
          similarity: number
        }[]
      }
      force_delete_messages: {
        Args: { message_ids: string[] }
        Returns: undefined
      }
      force_delete_profile: {
        Args: { target_id: string }
        Returns: Json
      }
      force_remove_workspace_member: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: boolean
      }
      get_assignable_users: {
        Args: { input_project_id: string }
        Returns: {
          user_id: string
          full_name: string
          email: string
        }[]
      }
      get_available_workspace_users: {
        Args: { p_workspace_id: string }
        Returns: {
          user_id: string
          email: string
          full_name: string
        }[]
      }
      get_project_assignable_users: {
        Args: { p_project_id: string }
        Returns: {
          user_id: string
          email: string
          full_name: string
        }[]
      }
      get_workspace_members_with_details: {
        Args: { p_workspace_id: string }
        Returns: {
          user_id: string
          role: string
          email: string
          full_name: string
        }[]
      }
      get_workspace_projects: {
        Args: { p_workspace_id: string }
        Returns: {
          archived_at: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          metadata: Json | null
          name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string
        }[]
      }
      get_workspace_tasks: {
        Args: { p_workspace_id: string }
        Returns: {
          ai_model: string | null
          archived_at: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          knowledge_base_ids: string[] | null
          next_due_date: string | null
          priority: string | null
          project_id: string | null
          recurrence_interval: number | null
          recurrence_monthday: number | null
          recurrence_time: string | null
          recurrence_type: string | null
          recurrence_weekday: number | null
          season_end: string | null
          season_start: string | null
          status: string | null
          system_prompt: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_workspace_access: {
        Args: { workspace_uuid: string }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      kb_find_facts_with_chunks: {
        Args: {
          p_query_embedding: string
          p_knowledge_base_id: string
          p_match_threshold?: number
          p_match_count?: number
        }
        Returns: {
          fact_id: string
          fact_content: string
          fact_source_name: string
          chunk_id: string
          chunk_content: string
          similarity: number
        }[]
      }
      kb_vector_search: {
        Args:
          | {
              p_user_id: string
              p_query_embedding: string
              p_match_threshold: number
              p_match_count: number
            }
          | {
              p_user_id: string
              p_query_embedding: string
              p_match_threshold: number
              p_match_count: number
              p_knowledge_base_id: string
            }
        Returns: {
          id: string
          content: string
          source_name: string
          source_type: string
          knowledge_base_id: string
          similarity: number
        }[]
      }
      kb_vector_search_local: {
        Args: {
          p_user_id: string
          p_query_embedding: string
          p_match_threshold: number
          p_match_count: number
        }
        Returns: {
          id: string
          content: string
          source_name: string
          source_type: string
          knowledge_base_id: string
          similarity: number
        }[]
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_knowledge_items: {
        Args:
          | {
              p_user_id: string
              p_query_embedding: string
              p_match_threshold: number
              p_match_count: number
            }
          | {
              p_user_id: string
              p_query_embedding: string
              p_match_threshold: number
              p_match_count: number
            }
        Returns: {
          id: string
          knowledge_base_id: string
          content: string
          source_type: string
          source_name: string
          similarity: number
        }[]
      }
      match_knowledge_items_simple: {
        Args: {
          p_user_id: string
          p_query_embedding: string
          p_match_threshold: number
          p_match_count: number
        }
        Returns: {
          id: string
          knowledge_base_id: string
          content: string
          source_type: string
          source_name: string
          similarity: number
        }[]
      }
      match_knowledge_items_v2: {
        Args: {
          p_user_id: string
          p_query_embedding: string
          p_match_threshold: number
          p_match_count: number
        }
        Returns: {
          id: string
          knowledge_base_id: string
          content: string
          source_type: string
          source_name: string
          similarity: number
        }[]
      }
      rag_atomic_fact_search: {
        Args: {
          p_query_embedding: string
          p_match_threshold: number
          p_match_count: number
          p_knowledge_base_id: string
        }
        Returns: {
          fact_id: string
          fact_source_name: string
          similarity: number
          linked_context_id: string
        }[]
      }
      remove_workspace_member_with_permissions: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: boolean
      }
      search_chat_facts: {
        Args: {
          query_embedding: string
          p_user_id: string
          similarity_threshold?: number
          max_results?: number
        }
        Returns: {
          content: string
          similarity: number
        }[]
      }
      search_similar_messages: {
        Args: {
          query_embedding: string
          p_user_id: string
          similarity_threshold?: number
          max_results?: number
        }
        Returns: {
          message_id: string
          chat_id: string
          role: string
          content: string
          similarity: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_kb_columns: {
        Args: Record<PropertyKey, never>
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
