import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { 
  Document, 
  DocumentSearchParams, 
  DocumentSearchResult, 
  DocumentUploadInput, 
  DocumentProcessingStatus 
} from '@/types/cursor-documents'

interface UseCursorDocumentsProps {
  workspaceId?: string
}

interface UseCursorDocumentsReturn {
  // Document operations
  uploadDocument: (input: DocumentUploadInput) => Promise<string>
  getDocumentStatus: (documentId: string) => Promise<DocumentProcessingStatus>
  listDocuments: () => Promise<Document[]>
  deleteDocument: (documentId: string) => Promise<boolean>
  
  // Search operations
  searchDocuments: (params: DocumentSearchParams) => Promise<DocumentSearchResult[]>
  
  // State
  loading: boolean
  error: string | null
}

/**
 * Hook for interacting with the Cursor document APIs
 */
export function useCursorDocuments({ workspaceId }: UseCursorDocumentsProps = {}): UseCursorDocumentsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useSupabaseClient()
  // !!! NEUER DEBUG LOG !!!
  console.log("--- Supabase client in useCursorDocuments hook: ---", supabase);
  console.log("--- supabase.auth object: ---", supabase?.auth);

  
  /**
   * Upload a document and start processing
   */
  const uploadDocument = async (input: DocumentUploadInput): Promise<string> => {
    setLoading(true)
    setError(null)
    
    try {
      // Get session for auth token
      // Check if supabase and supabase.auth are defined before calling getSession
      if (!supabase || !supabase.auth) {
        console.error("!!! Supabase client or auth object is not available in uploadDocument !!!");
        throw new Error('Supabase client not initialized');
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      // Handle potential session error
      if (sessionError) {
          console.error("Error getting Supabase session:", sessionError);
          throw new Error(`Authentication failed: ${sessionError.message}`);
      }
      
      const token = sessionData?.session?.access_token
      
      if (!token) {
        console.error("!!! No access token found in session !!!");
        throw new Error('Authentication required: No access token')
      }
      
      // Create FormData
      const formData = new FormData()
      formData.append('file', input.file)
      
      if (input.title) {
        formData.append('title', input.title)
      }
      
      if (input.description) {
        formData.append('description', input.description)
      }
      
      // Add workspace ID if provided either in hook props or input
      const wsId = input.workspace_id || workspaceId
      if (wsId) {
        formData.append('workspace_id', wsId)
      }
      
      // Add knowledge base ID if provided in input
      if (input.knowledge_base_id) {
        console.log(`Adding knowledge_base_id to formData: ${input.knowledge_base_id}`);
        formData.append('knowledge_base_id', input.knowledge_base_id);
      }
      
      // Call API
      console.log("--- Calling /api/cursor/upload with token ---"); // DEBUG
      const response = await fetch('/api/cursor/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      console.log("--- /api/cursor/upload response status:", response.status); // DEBUG
      
      if (!response.ok) {
        let errorData = { error: 'Upload failed with status: ' + response.status };
        try {
             errorData = await response.json()
        } catch(e) {
            console.warn("Could not parse error response body as JSON.");
        }
        console.error("--- /api/cursor/upload error response: ---", errorData); // DEBUG
        throw new Error(errorData.error || `Upload failed (status ${response.status})`)
      }
      
      const data = await response.json()
      console.log("--- /api/cursor/upload success response: ---", data); // DEBUG
      return data.document_id
      
    } catch (err: any) {
      console.error("!!! Error in uploadDocument function:", err); // DEBUG
      setError(err.message || 'Failed to upload document')
      throw err // Re-throw to be caught by handleSubmit
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Get document processing status
   */
  const getDocumentStatus = async (documentId: string): Promise<DocumentProcessingStatus> => {
    // setLoading(true); // Optional: Decide if status check should show global loading
    // setError(null);
    
    try {
      // Get session for auth token
      if (!supabase || !supabase.auth) {
        console.error("!!! Supabase client or auth object is not available in getDocumentStatus !!!");
        throw new Error('Supabase client not initialized');
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
          console.error("Error getting Supabase session:", sessionError);
          throw new Error(`Authentication failed: ${sessionError.message}`);
      }
      
      const token = sessionData?.session?.access_token
      
      if (!token) {
         console.error("!!! No access token found in session !!!");
        throw new Error('Authentication required: No access token')
      }
      
      // Call API
      console.log(`--- Calling /api/cursor/status for docId: ${documentId} ---`); // DEBUG
      const response = await fetch(`/api/cursor/status?document_id=${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
       console.log(`--- /api/cursor/status response status: ${response.status} ---`); // DEBUG
      
      if (!response.ok) {
        let errorData = { error: 'Status check failed with status: ' + response.status };
         try {
             errorData = await response.json()
        } catch(e) {
            console.warn("Could not parse error response body as JSON.");
        }
        console.error("--- /api/cursor/status error response: ---", errorData); // DEBUG
        throw new Error(errorData.error || `Failed to get status (status ${response.status})`)
      }
      
      return await response.json()
      
    } catch (err: any) {
       console.error("!!! Error in getDocumentStatus function:", err); // DEBUG
      // setError(err.message || 'Failed to get document status') // Avoid setting global error for polling
      throw err // Re-throw to be handled by the polling logic
    } finally {
      // setLoading(false);
    }
  }
  
  /**
   * List all documents for the current user
   */
  const listDocuments = async (): Promise<Document[]> => {
    setLoading(true)
    setError(null)
    
    try {
       if (!supabase) {
        console.error("!!! Supabase client is not available in listDocuments !!!");
        throw new Error('Supabase client not initialized');
      }
      // Query direct from Supabase (needs RLS)
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Filter by workspace ID if provided
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      }
      
      const { data, error: queryError } = await query
      
      if (queryError) {
        console.error("!!! Error listing documents:", queryError); // DEBUG
        throw new Error(queryError.message)
      }
      
      return data || []
      
    } catch (err: any) {
      console.error("!!! Error in listDocuments function:", err); // DEBUG
      setError(err.message || 'Failed to list documents')
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Delete a document and its chunks
   */
  const deleteDocument = async (documentId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      if (!supabase) {
        console.error("!!! Supabase client is not available in deleteDocument !!!");
        throw new Error('Supabase client not initialized');
      }
      // Delete the document (cascade will handle chunks)
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
      
      if (deleteError) {
        console.error("!!! Error deleting document:", deleteError); // DEBUG
        throw new Error(deleteError.message)
      }
      
      return true
      
    } catch (err: any) {
      console.error("!!! Error in deleteDocument function:", err); // DEBUG
      setError(err.message || 'Failed to delete document')
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Search documents
   */
  const searchDocuments = async (params: DocumentSearchParams): Promise<DocumentSearchResult[]> => {
    setLoading(true)
    setError(null)
    
    try {
      // Get session for auth token
      if (!supabase || !supabase.auth) {
        console.error("!!! Supabase client or auth object is not available in searchDocuments !!!");
        throw new Error('Supabase client not initialized');
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

       if (sessionError) {
          console.error("Error getting Supabase session:", sessionError);
          throw new Error(`Authentication failed: ${sessionError.message}`);
      }
      
      const token = sessionData?.session?.access_token
      
      if (!token) {
         console.error("!!! No access token found in session !!!");
        throw new Error('Authentication required: No access token')
      }
      
      // Add workspace ID from hook props if not in params
      const searchParams = { ...params }
      if (!searchParams.workspace_id && workspaceId) {
        searchParams.workspace_id = workspaceId
      }
      
      // Call API
      console.log("--- Calling /api/cursor/search --- ", searchParams); // DEBUG
      const response = await fetch('/api/cursor/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      })
      console.log("--- /api/cursor/search response status:", response.status); // DEBUG
      
      if (!response.ok) {
        let errorData = { error: 'Search failed with status: ' + response.status };
         try {
             errorData = await response.json()
        } catch(e) {
            console.warn("Could not parse error response body as JSON.");
        }
        console.error("--- /api/cursor/search error response: ---", errorData); // DEBUG
        throw new Error(errorData.error || `Search failed (status ${response.status})`)
      }
      
      const data = await response.json()
      console.log(`--- /api/cursor/search success response (${data?.results?.length} results) ---`); // DEBUG
      return data.results || []
      
    } catch (err: any) {
      console.error("!!! Error in searchDocuments function:", err); // DEBUG
      setError(err.message || 'Failed to search documents')
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  return {
    uploadDocument,
    getDocumentStatus,
    listDocuments,
    deleteDocument,
    searchDocuments,
    loading,
    error
  }
} 