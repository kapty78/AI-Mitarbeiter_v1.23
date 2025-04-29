"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User, UserPlus, X } from "lucide-react"

interface WorkspaceMember {
  user_id: string
  email: string
  full_name: string
  role: string
}

interface AvailableUser {
  user_id: string
  email: string
  full_name: string
}

interface WorkspaceMemberData {
  user_id: string
  role: string
  email: string
  full_name: string
}

interface WorkspaceMemberManagerProps {
  workspaceId: string
}

export function WorkspaceMemberManager({
  workspaceId
}: WorkspaceMemberManagerProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  // State for member context menu
  const [contextMenuMemberId, setContextMenuMemberId] = useState<string | null>(
    null
  )

  const supabase = createClientComponentClient()

  // Click handler for avatar
  const handleAvatarClick = (memberId: string) => {
    setContextMenuMemberId(prevId => (prevId === memberId ? null : memberId)) // Toggle menu
    setError(null) // Clear errors when opening/closing menu
  }

  useEffect(() => {
    console.log("WorkspaceMemberManager mounted with workspaceId:", workspaceId)
    if (workspaceId) {
      fetchMembers()
    }
  }, [workspaceId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      console.log("Fetching members via RPC:", workspaceId)

      // Call the new RPC function
      const { data: memberData, error: memberError } = await supabase
        .rpc("get_workspace_members_with_details", {
          p_workspace_id: workspaceId
        })
        // Type the result directly based on the function's return table
        .returns<WorkspaceMemberData[]>()

      console.log("Raw member data (RPC):", memberData)
      console.log("Member error (RPC):", memberError)

      if (memberError) throw memberError

      let formattedMembers: WorkspaceMember[] = []

      // Explicitly check if memberData is an array before mapping
      if (Array.isArray(memberData)) {
        // Map directly from RPC result (already formatted)
        formattedMembers = memberData.map((member: WorkspaceMemberData) => {
          const displayName = member.full_name || member.email || "Unbekannt" // Fallback logic
          return {
            user_id: member.user_id,
            email: member.email || "",
            full_name: displayName,
            role: member.role
          }
        })
        console.log("Formatted members (RPC):", formattedMembers)
        setMembers(formattedMembers)
      } else if (memberData) {
        // Handle cases where it might not be an array unexpectedly
        console.error("Unexpected RPC result format:", memberData)
        setError("Fehler beim Verarbeiten der Mitgliederdaten.")
        setMembers([]) // Set to empty array
        formattedMembers = []
      }

      setLoading(false)
      return formattedMembers // Return the formatted members for use by other functions
    } catch (err: any) {
      console.error("Error fetching members via RPC:", err)
      setError(err.message)
      setLoading(false)
      return [] // Return empty array in case of error
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      console.log("Fetching available users for workspace:", workspaceId)

      const { data, error } = await supabase.rpc(
        "get_available_workspace_users",
        { p_workspace_id: workspaceId }
      )

      console.log("Available users data:", data)
      console.log("Available users error:", error)

      if (error) throw error

      if (data) {
        setAvailableUsers(Array.isArray(data) ? data : [])
      }
    } catch (err: any) {
      console.error("Error fetching available users:", err)
      setError(err.message)
    }
  }

  const handleAddMember = async (userId: string) => {
    try {
      console.log("Adding member to workspace:", { workspaceId, userId })

      const { error } = await supabase.from("workspace_members").insert([
        {
          workspace_id: workspaceId,
          user_id: userId,
          role: "member",
          created_at: new Date().toISOString()
        }
      ])

      console.log("Add member error:", error)

      if (error) throw error

      await fetchMembers()
      setAvailableUsers(availableUsers.filter(user => user.user_id !== userId))
      setShowAddMemberDialog(false)
    } catch (err: any) {
      console.error("Error adding member:", err)
      setError(err.message)
    }
  }

  // Function to remove a member
  const handleRemoveMember = async (userIdToRemove: string) => {
    // Get current user data
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      setError("Benutzer nicht authentifiziert.")
      return
    }
    const currentUserId = user.id

    // Prevent removing self
    if (userIdToRemove === currentUserId) {
      setError("Sie können sich nicht selbst entfernen.")
      return
    }

    // Find the member being removed to check their role
    const memberToRemove = members.find(m => m.user_id === userIdToRemove)
    if (memberToRemove?.role === "owner") {
      setError("Der Workspace-Besitzer kann nicht entfernt werden.")
      return
    }

    // Find the current user's role in this specific workspace
    const currentUserMember = members.find(m => m.user_id === currentUserId)
    console.log(
      `Current user (${currentUserId}) role in this workspace:`,
      currentUserMember?.role
    )

    if (
      !currentUserMember ||
      !["owner", "admin"].includes(currentUserMember.role)
    ) {
      setError(
        "Sie haben keine Berechtigung, Mitglieder aus diesem Workspace zu entfernen (Nur Owner/Admin)."
      )
      console.error(
        "Permission denied: Current user is not owner or admin in this workspace."
      )
      return
    }

    // Confirmation dialog
    if (
      !window.confirm(
        `Möchten Sie ${memberToRemove?.full_name || memberToRemove?.email} wirklich aus dem Workspace entfernen?`
      )
    ) {
      return
    }

    try {
      console.log(
        "Removing member:",
        userIdToRemove,
        "from workspace:",
        workspaceId
      )
      setError(null) // Clear previous errors
      setLoading(true) // Show loading state

      // Use direct SQL with RPC (requires a database function to be set up)
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "force_remove_workspace_member",
        {
          p_workspace_id: workspaceId,
          p_user_id: userIdToRemove
        }
      )

      console.log("RPC removal result:", rpcResult)

      if (rpcError) {
        console.error("RPC error:", rpcError)

        // Fallback to direct deletion if RPC fails
        console.log("Falling back to direct deletion")
        const { error: deleteError } = await supabase
          .from("workspace_members")
          .delete()
          .eq("workspace_id", workspaceId)
          .eq("user_id", userIdToRemove)

        if (deleteError) {
          throw deleteError
        }
      }

      // Update local state immediately (optimistic update)
      setMembers(prevMembers =>
        prevMembers.filter(m => m.user_id !== userIdToRemove)
      )

      // Re-fetch to confirm changes were applied
      const refreshedMembers = await fetchMembers()

      // Check if user was actually removed
      const stillExists = refreshedMembers.some(
        m => m.user_id === userIdToRemove
      )

      if (stillExists) {
        setError(
          "Der Benutzer konnte nicht entfernt werden. Dies könnte auf Berechtigungsprobleme oder Datenbankeinschränkungen zurückzuführen sein."
        )
        console.error("User still exists after removal attempt")
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Error in handleRemoveMember catch block:", err)
      setError(`Fehler beim Entfernen des Mitglieds: ${err.message}`)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-2 text-center text-zinc-400">Lade...</div>
  }

  if (error) {
    return <div className="p-2 text-center text-red-400">{error}</div>
  }

  return (
    <div className="relative">
      {/* Member avatars and add button */}
      <div className="flex items-center -space-x-2">
        {members.slice(0, 3).map(member => {
          // Generate initials from full_name or email fallback
          const initials =
            (member.full_name || member.email || "?")
              .split("@")[0] // Take part before @ if it's an email
              .split(/[\s\.-]+/) // Split by space, dot, hyphen
              .map(n => n?.[0])
              .filter(Boolean) // Remove empty strings
              .slice(0, 2) // Max 2 initials
              .join("")
              .toUpperCase() || "?" // Default fallback if all else fails

          const tooltipText = `${member.full_name} (${member.role})\n${member.email || "N/A"}`

          return (
            <div key={`member-${member.user_id}`} className="group relative">
              {/* Avatar Button - Make it clickable */}
              <button
                onClick={() => handleAvatarClick(member.user_id)}
                className="relative flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 transition-colors hover:border-zinc-600"
              >
                {/* Conditionally apply pink color for admin role */}
                <span
                  className={`text-xs font-medium ${member.role === "admin" ? "text-pink-400" : "text-white"}`}
                >
                  {initials}
                </span>
              </button>

              {/* Hover Tooltip */}
              <span className="pointer-events-none invisible absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs text-gray-300 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                {member.email || "N/A"}
              </span>

              {/* Context menu on click */}
              {contextMenuMemberId === member.user_id && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-[#333333] bg-[#1e1e1e] p-2 shadow-lg">
                  <div className="mb-1 truncate text-sm font-medium text-white">
                    {member.full_name}
                  </div>
                  <div className="mb-2 truncate text-xs text-gray-400">
                    {member.email}
                  </div>
                  {member.role !== "owner" && (
                    <button
                      onClick={() => {
                        handleRemoveMember(member.user_id)
                        setContextMenuMemberId(null) // Close menu after action
                      }}
                      className="w-full rounded px-2 py-1 text-left text-xs text-red-400 transition-colors hover:bg-[#2d2d2d]"
                    >
                      Entfernen
                    </button>
                  )}
                  {member.role === "owner" && (
                    <span className="block w-full px-2 py-1 text-xs italic text-gray-500">
                      Besitzer
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {members.length > 3 && (
          <div className="relative flex size-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800">
            <span className="text-xs font-medium">+{members.length - 3}</span>
          </div>
        )}
        <button
          onClick={() => {
            console.log("WorkspaceMemberManager: Add Member Button CLICKED!")
            setShowAddMemberDialog(true)
            fetchAvailableUsers()
          }}
          className="relative flex size-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 hover:bg-zinc-700"
        >
          <UserPlus size={14} />
        </button>
      </div>

      {/* Add Member Dialog - Adjusted Styling */}
      {showAddMemberDialog && (
        // Use a semi-transparent backdrop like other modals might
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 px-4 pt-16">
          {/* Dialog Container - Use dashboard panel colors */}
          <div className="w-full max-w-sm rounded-lg border border-[var(--border-light)] bg-[var(--bg-tertiary)] shadow-xl">
            {/* Dialog Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-light)] p-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                Mitglied hinzufügen
              </h3>
              <button
                onClick={() => setShowAddMemberDialog(false)}
                className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* User List Container */}
            <div className="max-h-72 overflow-y-auto p-2">
              {" "}
              {/* Reduced max height slightly */}
              {availableUsers.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
                  Keine weiteren Benutzer verfügbar
                </p>
              ) : (
                <div className="space-y-1">
                  {availableUsers.map(user => (
                    <button
                      key={`available-${user.user_id}`}
                      className="flex w-full items-center space-x-3 rounded-md p-2 text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      onClick={() => {
                        handleAddMember(user.user_id)
                      }}
                    >
                      {/* User icon placeholder */}
                      <div className="flex size-8 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
                        <User
                          size={16}
                          className="text-[var(--text-secondary)]"
                        />
                      </div>
                      {/* User info */}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">
                          {user.full_name ||
                            user.email ||
                            "Unbekannter Benutzer"}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {user.email || "Keine E-Mail"}
                        </div>
                      </div>
                      {/* Add icon */}
                      <UserPlus
                        size={16}
                        className="text-[var(--text-secondary)]"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
