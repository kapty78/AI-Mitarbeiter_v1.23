"use client"

import { useState } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export const DirectWorkspaceLink = ({
  workspaceId
}: {
  workspaceId: string
}) => {
  const [loading, setLoading] = useState(false)

  const handleDirectAccess = () => {
    setLoading(true)
    try {
      window.location.href = `/${workspaceId}/chat`
    } catch (error) {
      console.error("Failed to navigate:", error)
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 text-center">
      <p>Having trouble accessing your workspace?</p>
      <button
        onClick={handleDirectAccess}
        className="mt-2 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">Accessing workspace...</span>
          </div>
        ) : (
          "Direct Workspace Access"
        )}
      </button>
    </div>
  )
}
