"use client"

import React, { useState, useEffect, FC } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/supabase/types"
import type { Tables } from "@/supabase/types"; // Import Tables from the correct path
import { CreateKnowledgeBaseModal } from "./CreateKnowledgeBaseModal" // Import the modal component
import {
  Database as DatabaseIcon,
  FolderPlus,
  FileText,
  Sparkles,
  Plus,
  Loader2,
  AlertCircle,
  Trash2
} from "lucide-react"

// Define the type for a knowledge base item based on your DB schema
type KnowledgeBase = Tables<"knowledge_bases">

interface KnowledgeBaseListProps {
  userId: string
  selectedKnowledgeBaseId: string | null // Add prop to receive selected ID
  onSelectKnowledgeBase: (id: string | null) => void // Add callback prop
  onKnowledgeBaseDeleted: (id: string) => void // Callback after successful deletion
}

export const KnowledgeBaseList: FC<KnowledgeBaseListProps> = ({
  userId,
  selectedKnowledgeBaseId, // Destructure the new prop
  onSelectKnowledgeBase, // Destructure the new prop
  onKnowledgeBaseDeleted // Destructure new prop
}) => {
  const supabase = createClientComponentClient<Database>()
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false) // State for modal visibility
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kbToDeleteId, setKbToDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      if (!userId) return // Don't fetch if userId is not available yet

      setLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from("knowledge_bases")
          .select("*")
          .eq("user_id", userId) // Fetch only KBs owned by the current user
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setKnowledgeBases(data || [])
      } catch (err: any) {
        console.error("Error fetching knowledge bases:", err)
        setError(`Failed to load knowledge bases: ${err.message}`)
        setKnowledgeBases([]) // Clear data on error
      } finally {
        setLoading(false)
      }
    }

    fetchKnowledgeBases()
  }, [userId, supabase])

  const handleCreateNew = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleKnowledgeBaseCreated = (newKb: KnowledgeBase) => {
    setKnowledgeBases(prevKbs => [newKb, ...prevKbs])
  }

  const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent item click
    console.log(`Initiating delete for KB: ${name} (${id})`);
    setKbToDeleteId(id);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!kbToDeleteId) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const response = await fetch("/api/knowledge/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ knowledgeBaseId: kbToDeleteId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete knowledge base");
      }

      console.log(`Successfully deleted KB: ${kbToDeleteId}`);
      // Remove from local state & trigger parent update
      setKnowledgeBases(prev => prev.filter(kb => kb.id !== kbToDeleteId));
      onKnowledgeBaseDeleted(kbToDeleteId); // Inform parent

    } catch (err: any) {
      console.error("Error deleting knowledge base:", err);
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setKbToDeleteId(null);
    }
  };

  // Handle clicking on a list item
  const handleItemClick = (id: string) => {
    // If the clicked item is already selected, deselect it
    if (id === selectedKnowledgeBaseId) {
      onSelectKnowledgeBase(null)
    } else {
      onSelectKnowledgeBase(id)
    }
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center p-6">
          <div className="flex animate-pulse flex-col items-center">
            <Loader2 className="mb-2 size-8 animate-spin text-white" />
            <p className="text-sm text-gray-300">Loading databases...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800/30 bg-red-900/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-red-400" />
            <p className="text-sm text-red-300">Error: {error}</p>
          </div>
        </div>
      )}

      {!loading && !error && knowledgeBases.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#333333] bg-[#1e1e1e]/30 p-8">
          <DatabaseIcon className="mb-3 size-12 text-gray-400 opacity-50" />
          <p className="text-center text-sm text-gray-300">
            No databases found
          </p>
        </div>
      )}

      {!loading && !error && knowledgeBases.length > 0 && (
        <div className="space-y-2.5">
          {knowledgeBases.map(kb => {
            // Determine if the current item is selected
            const isSelected = kb.id === selectedKnowledgeBaseId
            return (
              <div
                key={kb.id}
                onClick={() => handleItemClick(kb.id)}
                className={`group flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors duration-150 ease-in-out ${
                  selectedKnowledgeBaseId === kb.id
                    ? "bg-[#f056c1]/20 ring-1 ring-[#f056c1]"
                    : "hover:bg-[#333333]/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <DatabaseIcon className="size-5 text-gray-400" />
                  <span className="text-sm font-medium text-white">{kb.name}</span>
                </div>
                {/* Delete Button - appears on hover or when selected */}
                <button 
                  onClick={(e) => handleDeleteClick(kb.id, kb.name, e)}
                  className={`ml-2 rounded p-1 text-gray-500 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 ${selectedKnowledgeBaseId === kb.id ? 'opacity-100' : ''}`}
                  title="Wissensdatenbank löschen"
                  disabled={deleteLoading}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={handleCreateNew}
        className="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#f056c1]/80 to-[#c2185b]/80
         px-4 py-3 text-sm font-medium text-white transition-all
         duration-200 hover:from-[#f056c1] hover:to-[#c2185b] hover:shadow-lg hover:shadow-[#f056c1]/10"
        disabled={loading}
      >
        <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
        <span>Create New Knowledge Base</span>
      </button>

      <CreateKnowledgeBaseModal
        userId={userId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onKnowledgeBaseCreated={handleKnowledgeBaseCreated}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && kbToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[#444444] bg-[#2a2a2a] p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-white">Löschen bestätigen</h3>
            <p className="mb-5 text-sm text-gray-300">
              Sind Sie sicher, dass Sie die Wissensdatenbank "<span className="font-medium text-white">{knowledgeBases.find(kb => kb.id === kbToDeleteId)?.name}</span>" löschen möchten? Alle zugehörigen Daten (hochgeladene Dokumente, extrahierte Abschnitte/Fakten) werden **permanent** entfernt.
            </p>
            {deleteError && (
              <p className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-300">
                Fehler: {deleteError}
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-[#444444] px-4 py-2 text-sm text-gray-300 hover:bg-[#3a3a3a] disabled:opacity-50"
                disabled={deleteLoading}
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> Lösche...</>
                ) : (
                  <><Trash2 className="mr-2 size-4" /> Endgültig löschen</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
