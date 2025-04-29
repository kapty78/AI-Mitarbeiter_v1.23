import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Handles document status check requests
 * Returns the processing status of a document
 */
export async function GET(req: NextRequest) {
  try {
    console.log('Cursor document status API called')
    
    // Extract document ID from URL
    const url = new URL(req.url)
    const documentId = url.searchParams.get('document_id')
    
    if (!documentId) {
      console.log('No document_id provided')
      return NextResponse.json(
        { error: 'No document_id provided' },
        { status: 400 }
      )
    }
    
    // Extract auth token from request
    const authHeader = req.headers.get('authorization')
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null
    
    if (!authToken) {
      console.log('No authentication token provided')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Initialize Supabase client with auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      }
    )
    
    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('Unauthorized - User error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log(`User authenticated: ${user.id}, checking document: ${documentId}`)
    
    // Check if the document exists and belongs to the user
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, user_id, file_name, file_type, created_at')
      .eq('id', documentId)
      .single()
    
    if (documentError || !document) {
      console.log('Document not found or error:', documentError)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Verify the document belongs to the user
    if (document.user_id !== user.id) {
      console.log('Document does not belong to user')
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get the processing status
    const { data: statusData, error: statusError } = await supabase
      .from('document_processing_status')
      .select('status, progress, error, updated_at')
      .eq('document_id', documentId)
      .single()
    
    if (statusError) {
      console.log('Status not found or error:', statusError)
      
      // If no status found, check if there are any chunks
      const { count, error: chunksError } = await supabase
        .from('document_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId)
      
      if (!chunksError && count !== null) {
        // If there are chunks but no status, assume processing is complete
        if (count > 0) {
          return NextResponse.json({
            document_id: documentId,
            status: 'completed',
            progress: 100,
            chunks_count: count,
            document: {
              file_name: document.file_name,
              file_type: document.file_type,
              created_at: document.created_at
            }
          })
        }
        
        // If no chunks and no status, assume processing failed
        return NextResponse.json({
          document_id: documentId,
          status: 'processing',
          progress: 10,
          chunks_count: 0,
          document: {
            file_name: document.file_name,
            file_type: document.file_type,
            created_at: document.created_at
          }
        })
      }
      
      // If error checking chunks, return generic status
      return NextResponse.json({
        document_id: documentId,
        status: 'unknown',
        progress: 0,
        document: {
          file_name: document.file_name,
          file_type: document.file_type,
          created_at: document.created_at
        }
      })
    }
    
    // Get chunk count
    const { count: chunksCount, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('document_id', documentId)
    
    // Return the status
    return NextResponse.json({
      document_id: documentId,
      status: statusData.status,
      progress: statusData.progress,
      error: statusData.error,
      updated_at: statusData.updated_at,
      chunks_count: chunksError ? 0 : chunksCount,
      document: {
        file_name: document.file_name,
        file_type: document.file_type,
        created_at: document.created_at
      }
    })
    
  } catch (error: any) {
    console.error('General status API error:', error)
    return NextResponse.json(
      { error: `Status check failed: ${error.message}` },
      { status: 500 }
    )
  }
} 