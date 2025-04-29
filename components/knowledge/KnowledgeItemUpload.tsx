"use client"

import React, { useState, FC, useRef, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/supabase/types"
import {
  ArrowUpCircle,
  AlertCircle,
  FileUp,
  Upload,
  X,
  Check,
  Clock,
  FileText,
  Settings,
  Loader2
} from "lucide-react"
import { useCursorDocuments } from "@/hooks/use-cursor-documents"
import { DocumentProcessingStatus } from "@/types/cursor-documents";

interface KnowledgeItemUploadProps {
  userId: string
  knowledgeBaseId: string
  workspaceId: string | null
}

export const KnowledgeItemUpload: FC<KnowledgeItemUploadProps> = ({
  userId,
  knowledgeBaseId,
  workspaceId,
}) => {
  console.log("--- RENDERING KnowledgeItemUpload Component (NEW SYSTEM) ---", { userId, knowledgeBaseId, workspaceId });
  
  const supabase = createClientComponentClient<Database>()
  const [sourceType, setSourceType] = useState<"file" | "text">("file")
  const [sourceName, setSourceName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState("")
  const [embeddingsProvider, setEmbeddingsProvider] = useState<
    "openai" | "local"
  >("openai")

  const { uploadDocument, getDocumentStatus, loading, error: hookError } = 
    useCursorDocuments({ workspaceId: workspaceId ?? undefined });

  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] =
    useState<DocumentProcessingStatus | null>(null);
  const [uploadInitiated, setUploadInitiated] = useState(false); 

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayError, setDisplayError] = useState<string | null>(null);
  useEffect(() => {
    if (hookError && !file && sourceType === 'file') {
        // Don't show hook error if user cleared the file
    } else {
       setDisplayError(hookError); 
    }
  }, [hookError, file, sourceType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setFile(files[0])
      setSourceName(files[0].name)
      setCurrentDocumentId(null)
      setProcessingStatus(null)
      setUploadInitiated(false)
      setDisplayError(null)
    }
  }

  const clearFile = () => {
    setFile(null)
    setSourceName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setCurrentDocumentId(null)
    setProcessingStatus(null)
    setUploadInitiated(false)
    setDisplayError(null)
  }

  const clearTextContent = () => {
    setTextContent("")
    setSourceName("")
    setCurrentDocumentId(null)
    setProcessingStatus(null)
    setUploadInitiated(false)
    setDisplayError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentDocumentId(null);
    setProcessingStatus(null);
    setUploadInitiated(false);
    setDisplayError(null);

    if (!workspaceId) {
       setDisplayError("Keine Workspace ID ausgewählt. Upload nicht möglich.");
       return;
    }

    if (sourceType === "file" && !file) {
      setDisplayError("Please select a file to upload.");
      return;
    }
    if (sourceType === "text" && !textContent.trim()) {
      setDisplayError("Please enter some text content.");
      return;
    }

    // Set initial status for UI feedback
    setProcessingStatus({
       document_id: '', 
       status: 'uploading',
       progress: 5,
       error: undefined
    });

    try {
        let docId = '';
        if (sourceType === 'file' && file) {
            console.log("--- Calling uploadDocument from hook --- "); // DEBUG
            docId = await uploadDocument({
                file: file,
                title: sourceName || file.name,
                workspace_id: workspaceId,
                knowledge_base_id: knowledgeBaseId
            });
            console.log("--- uploadDocument hook returned ID: ---", docId); // DEBUG
        } 
        else if (sourceType === 'text' && textContent) {
            console.log("--- Calling uploadDocument with text content --- ", { 
              textLength: textContent.length,
              workspaceId,
              knowledgeBaseId
            }); // DEBUG
            
            // Stelle sicher, dass der Dateiname immer mit .txt endet
            let fileName = sourceName || "text-content";
            if (!fileName.toLowerCase().endsWith('.txt')) {
                fileName += '.txt';
            }
            
            // Log für Debugging
            console.log("--- Creating text file with name: ", fileName);
            
            // Prüfe, ob eine knowledgeBaseId gesetzt ist
            if (!knowledgeBaseId) {
                setDisplayError("Bitte wählen Sie zuerst eine Wissensdatenbank aus, bevor Sie Text hochladen.");
                setProcessingStatus(null);
                throw new Error("Keine Wissensdatenbank ID ausgewählt");
            }
            
            // Erstelle einen Text-Blob aus dem eingegebenen Text
            const textBlob = new Blob([textContent], { type: 'text/plain' });
            
            // Erstelle eine File aus dem Blob mit korrekter Dateiendung
            const textFile = new File([textBlob], fileName, { type: 'text/plain' });
            
            try {
                docId = await uploadDocument({
                    file: textFile,
                    title: sourceName || "Text Content",
                    workspace_id: workspaceId,
                    knowledge_base_id: knowledgeBaseId
                });
                console.log("--- uploadDocument hook returned ID for text: ---", docId); // DEBUG
            } catch (uploadError: any) {
                console.error("--- Text upload failed: ---", uploadError);
                setDisplayError(uploadError.message || "Text-Upload fehlgeschlagen");
                setProcessingStatus(null);
                throw uploadError;
            }
        }

        if (docId) { // Prüfen ob eine ID zurückkam
            console.log("Document upload initiated via API. Document ID:", docId);
            setCurrentDocumentId(docId); // Setzt die ID
            setUploadInitiated(true); // Startet das Polling jetzt
        } else {
             // Fehlerfall, wenn keine docId zurückkommt, obwohl kein Error geworfen wurde
             throw new Error("Failed to initiate upload: No document ID received.");
        }

    } catch (err: any) {
      console.error("!!! Error calling uploadDocument hook or during initiation:", err); // DEBUG
      setDisplayError(err.message || "Failed to start document upload.");
      setProcessingStatus(null); // Reset status bei Fehler
      setUploadInitiated(false);
    }
  };

  useEffect(() => {
    if (!uploadInitiated || !currentDocumentId) {
      return; 
    }
    
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const checkStatus = async () => {
        if (!currentDocumentId || !isMounted) return true;

      try {
        console.log("--- Polling status for documentId:", currentDocumentId);
        const status = await getDocumentStatus(currentDocumentId);
        console.log("--- Received status:", status);
        
        if (isMounted) {
          setProcessingStatus(status);
          
          if (status.status === 'completed' || status.status === 'failed' ||
              status.status === 'facts_completed' || status.status === 'facts_failed') {
            setUploadInitiated(false); 
            if ((status.status === 'completed' || status.status === 'facts_completed') && sourceType === 'file') {
              setTimeout(() => { if(isMounted) clearFile(); }, 1500);
            }
            if ((status.status === 'completed' || status.status === 'facts_completed') && sourceType === 'text') {
              setTimeout(() => { if(isMounted) clearTextContent(); }, 1500);
            }
            return true;
          }
        }
      } catch (err: any) {
        console.error("Error polling document status:", err);
        if (isMounted) {
            // Display error within the status component? Or use displayError?
            // For now, just log it.
            // setDisplayError(err.message || "Failed to poll status");
        }
      }
      return false;
    };

    let pollingEnded = false;
    checkStatus().then(ended => pollingEnded = ended);

    intervalId = setInterval(async () => {
       if (pollingEnded || !isMounted) {
         if(intervalId) clearInterval(intervalId);
         return;
       }
      pollingEnded = await checkStatus();
       if (pollingEnded) {
         if(intervalId) clearInterval(intervalId);
       }
    }, 3000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentDocumentId, uploadInitiated, getDocumentStatus, sourceType]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex w-fit rounded-lg border border-[#333333] bg-[#252525]/50 p-1">
        <button
          type="button"
          onClick={() => setSourceType("file")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            sourceType === "file"
              ? "bg-gradient-to-r from-[#f056c1]/80 to-[#c2185b]/80 text-white shadow-lg"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
          }`}
          disabled={loading || uploadInitiated}
        >
          <div className="flex items-center space-x-2">
            <FileUp className="size-4" />
            <span>Upload File</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setSourceType("text")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
            sourceType === "text"
              ? "bg-gradient-to-r from-[#f056c1]/80 to-[#c2185b]/80 text-white shadow-lg"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
          }`}
          disabled={loading || uploadInitiated}
        >
          <div className="flex items-center space-x-2">
            <FileText className="size-4" />
            <span>Enter Text</span>
          </div>
        </button>
      </div>

      {sourceType === "file" && (
        <div className="space-y-3">
          <label
            htmlFor="kb-file"
            className="mb-1 block text-sm font-medium text-gray-200"
          >
            Select File (.txt, .pdf, .md, .docx)
          </label>
          <div className="relative">
            <input
              type="file"
              id="kb-file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.pdf,.md,.docx"
              className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
              disabled={loading || uploadInitiated}
            />
            <div
              className={`w-full border ${file ? "border-[#f056c1]/30" : "border-[#333333]"} flex items-center justify-center rounded-lg bg-gradient-to-b from-[#252525]/70 to-[#1e1e1e]/70 p-4 transition-all duration-200 hover:from-[#252525] hover:to-[#1e1e1e] ${ (loading || uploadInitiated) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`mb-2 rounded-full p-2 ${file ? "bg-[#f056c1]/10" : "bg-white/5"}`}
                >
                  <Upload
                    className={`size-5 ${file ? "text-[#f056c1]" : "text-gray-400"}`}
                  />
                </div>
                <span className="mb-1 text-sm font-medium text-white">
                  {file ? "File selected" : "Drag & drop or click to browse"}
                </span>
                <span className="text-xs text-gray-400">
                  Supports TXT, PDF, MD, DOCX
                </span>
              </div>
            </div>
          </div>

          {file && !processingStatus && (
            <div className="flex items-center justify-between rounded-md border border-[#f056c1]/20 bg-[#f056c1]/10 px-3 py-2">
              <div className="flex items-center space-x-2">
                <FileText className="size-4 text-[#f056c1]" />
                <div>
                  <p className="max-w-[250px] truncate text-sm font-medium text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="rounded-full p-1 hover:bg-white/10"
                disabled={loading || uploadInitiated}
              >
                <X className="size-4 text-gray-300" />
              </button>
            </div>
          )}
        </div>
      )}

      {sourceType === "text" && (
        <div className="space-y-3">
          <label
            htmlFor="kb-text"
            className="mb-1 block text-sm font-medium text-gray-200"
          >
            Enter Text Content
          </label>
          <div className="relative">
            <textarea
              id="kb-text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste or type text content here..."
              className="h-40 w-full rounded-md border border-[#333333] bg-[#252525]/30 p-3 text-sm text-white transition-all duration-200 focus:border-[#f056c1]/50 focus:outline-none focus:ring-1 focus:ring-[#f056c1]/50"
              disabled={loading || uploadInitiated}
            />
          </div>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Give your text a title (optional)"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="w-full rounded-md border border-[#333333] bg-[#252525]/30 p-2.5 text-sm text-white transition-all duration-200 focus:border-[#f056c1]/50 focus:outline-none focus:ring-1 focus:ring-[#f056c1]/50"
              disabled={loading || uploadInitiated}
            />
          </div>
          
          {textContent && !processingStatus && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearTextContent}
                className="flex items-center space-x-2 rounded-md border border-[#333333] bg-[#252525]/50 px-3 py-1.5 text-sm text-gray-300 transition-all duration-200 hover:bg-[#333333] hover:text-white"
                disabled={loading || uploadInitiated}
              >
                <X className="size-4" />
                <span>Clear Text</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <label
          htmlFor="kb-embedding-provider"
          className="mb-1 flex items-center space-x-2 text-sm font-medium text-gray-200"
        >
          <Settings className="size-4 text-gray-400" />
          <span>Embedding Provider</span>
        </label>
        <select
          id="kb-embedding-provider"
          value={embeddingsProvider}
          onChange={(e) =>
            setEmbeddingsProvider(e.target.value as "openai" | "local")
          }
          className="w-full rounded-md border border-[#333333] bg-[#252525]/30 p-2.5 text-sm text-white transition-all duration-200 focus:border-[#f056c1]/50 focus:outline-none focus:ring-1 focus:ring-[#f056c1]/50"
        >
          <option value="openai">AI (text-embedding-3-small)</option>
          <option value="local">Local (faster, may be less accurate)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
            Embedding Provider beeinflusst die Qualität der Suche.
        </p>
      </div>

      {processingStatus && (
        <div className="mt-4 space-y-3 rounded-md border border-[#333333] bg-gradient-to-b from-[#252525]/70 to-[#1e1e1e]/70 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-2 text-sm font-medium text-white">
               {processingStatus.status === 'uploading' && <FileUp className="mr-2 size-4 text-[#f056c1]" />} 
               {(processingStatus.status === 'processing' || processingStatus.status === 'embedding') && <Loader2 className="mr-2 size-4 animate-spin text-[#f056c1]" />}
               {processingStatus.status === 'completed' && <Check className="mr-2 size-4 text-green-400" />}
               {processingStatus.status === 'failed' && <AlertCircle className="mr-2 size-4 text-red-400" />}
               <span>{processingStatus.status.charAt(0).toUpperCase() + processingStatus.status.slice(1)}</span>
              </span>
          </div>

          <div className="relative pt-1">
            <div className="mb-1.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-300">
                      Progress
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-300">
                      {processingStatus.progress}%
                </span>
              </div>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-[#1e1e1e] text-xs">
              <div
                    className={`flex h-full items-center justify-center rounded-full transition-all duration-300 ${processingStatus.status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-[#f056c1] to-[#c2185b]'}`}
                    style={{ width: `${processingStatus.progress}%` }}
                  ></div>
            </div>
          </div>

           {processingStatus.error && (
              <p className="text-xs text-red-400">Error: {processingStatus.error}</p>
           )}
           
            {processingStatus.status === 'completed' && (
              <div className="flex items-center justify-between rounded-md bg-[#1e1e1e]/50 px-3 py-1.5 text-xs text-gray-400">
                  <span>Processing Complete!</span>
                  {processingStatus.chunks_count !== undefined && ( 
                     <span className="font-mono text-white">{processingStatus.chunks_count} Chunks Saved</span>
                  )}
               </div>
            )}
            
            {/* Faktengenerierung Status */}
            {processingStatus.status === 'facts_extracting' && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-[#1e1e1e]/50 px-3 py-1.5 text-xs text-gray-400">
                <span className="flex items-center">
                  <Loader2 className="mr-2 size-3 animate-spin text-[#f056c1]" />
                  Extrahiere Fakten...
                </span>
              </div>
            )}
            
            {processingStatus.status === 'facts_saving' && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-[#1e1e1e]/50 px-3 py-1.5 text-xs text-gray-400">
                <span className="flex items-center">
                  <Loader2 className="mr-2 size-3 animate-spin text-[#f056c1]" />
                  Speichere Fakten in Wissensdatenbank...
                </span>
              </div>
            )}

            {processingStatus.status === 'facts_completed' && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-[#1e1e1e]/50 px-3 py-1.5 text-xs text-gray-400">
                <span className="flex items-center">
                  <Check className="mr-2 size-3 text-green-400" />
                  Fakten generiert und gespeichert
              </span>
              </div>
            )}
            
            {processingStatus.status === 'facts_failed' && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-[#1e1e1e]/50 px-3 py-1.5 text-xs text-gray-400">
                <span className="flex items-center text-red-400">
                  <AlertCircle className="mr-2 size-3" />
                  Faktengenerierung fehlgeschlagen
                </span>
        </div>
            )}
        </div>
      )}

      {displayError && !processingStatus?.error && ( 
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <p className="flex items-center text-sm text-red-300">
            <AlertCircle className="mr-2 size-4 text-red-400" />
            {displayError}
          </p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={
            loading ||
            uploadInitiated ||
            (sourceType === "file" && !file) ||
            !knowledgeBaseId
          }
          className="flex w-full items-center justify-center space-x-2 rounded-md bg-gradient-to-r from-[#f056c1] to-[#c2185b] px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-[#f056c1] hover:to-[#ad1457] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
           {loading || uploadInitiated ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <ArrowUpCircle className="size-4" />
              <span>Upload Content</span>
            </>
          )}
        </button>
        
        {!knowledgeBaseId && (
          <div className="mt-2 rounded-md border border-[#333333] bg-[#252525]/50 p-3">
            <p className="flex items-center text-xs text-white">
              <AlertCircle className="mr-2 size-4 text-gray-400" />
              Bitte wählen Sie zuerst eine Wissensdatenbank aus, bevor Sie ein Dokument hochladen.
            </p>
          </div>
        )}
      </div>
    </form>
  )
}
