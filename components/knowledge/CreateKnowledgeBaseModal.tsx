"use client"

import React, { useState, FC } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/supabase/types"
import { Tables } from "@/supabase/types"
import {
  X,
  Database as DatabaseIcon,
  AlertCircle,
  Loader2,
  Plus
} from "lucide-react"

type KnowledgeBase = Tables<"knowledge_bases">

interface CreateKnowledgeBaseModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onKnowledgeBaseCreated: (newKb: KnowledgeBase) => void
}

export const CreateKnowledgeBaseModal: FC<CreateKnowledgeBaseModalProps> = ({
  userId,
  isOpen,
  onClose,
  onKnowledgeBaseCreated
}) => {
  const supabase = createClientComponentClient<Database>()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Name is required.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from("knowledge_bases")
        .insert({
          user_id: userId,
          name: name.trim(),
          description: description.trim() || null // Set to null if empty
          // sharing defaults to 'private' in DB schema
        })
        .select() // Select the newly created row
        .single() // Expect a single row back

      if (insertError) {
        throw insertError
      }

      if (data) {
        console.log("Successfully created knowledge base:", data)
        onKnowledgeBaseCreated(data) // Pass the new KB back to the list
        handleClose() // Close modal on success
      } else {
        throw new Error("Failed to retrieve created knowledge base data.")
      }
    } catch (err: any) {
      console.error("Error creating knowledge base:", err)
      setError(`Failed to create knowledge base: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form state on close
    setName("")
    setDescription("")
    setError(null)
    setLoading(false)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  // Modal Structure with updated design
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-all duration-200">
      <div className="w-full max-w-md rounded-xl border border-[#333333] bg-gradient-to-b from-[#252525] to-[#1e1e1e] p-6 shadow-xl transition-all duration-200">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-r from-[#f056c1]/20 to-[#c2185b]/20 p-2">
              <DatabaseIcon className="size-5 text-[#f056c1]" />
            </div>
            <h2 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-lg font-bold text-transparent">
              Create New Knowledge Base
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 transition-colors hover:bg-white/10"
          >
            <X className="size-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="kb-name"
              className="mb-1.5 block text-sm font-medium text-gray-200"
            >
              Name <span className="text-[#f056c1]">*</span>
            </label>
            <input
              type="text"
              id="kb-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Product Documentation"
              className="w-full rounded-md border border-[#333333] bg-[#252525]/30 p-2.5 text-sm text-white transition-all placeholder:text-gray-500 focus:border-[#f056c1]/50 focus:outline-none focus:ring-1 focus:ring-[#f056c1]/50"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="kb-description"
              className="mb-1.5 block text-sm font-medium text-gray-200"
            >
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              id="kb-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description of what this knowledge base contains."
              rows={3}
              className="w-full rounded-md border border-[#333333] bg-[#252525]/30 p-2.5 text-sm text-white transition-all placeholder:text-gray-500 focus:border-[#f056c1]/50 focus:outline-none focus:ring-1 focus:ring-[#f056c1]/50"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3">
              <p className="flex items-center text-sm text-red-300">
                <AlertCircle className="mr-2 size-4 text-red-400" />
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-md border border-[#333333] px-4 py-2.5 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center rounded-md bg-gradient-to-r from-[#f056c1] to-[#c2185b] px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-[#f056c1] hover:to-[#ad1457] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  <span>Create Knowledge Base</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
