"use client"

import React, { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/supabase/types"
import { User } from "@supabase/supabase-js"
import { KnowledgeBaseList } from "@/components/knowledge/KnowledgeBaseList"
import { KnowledgeItemUpload } from "@/components/knowledge/KnowledgeItemUpload"
import {
  Database as DatabaseIcon,
  BookText,
  BrainCircuit,
  Layers,
  BarChart2,
  Sparkles,
  Server,
  FileUp,
  InfoIcon,
  Zap,
  Book,
  Upload,
  X,
  ChevronDown,
  Plus,
  Search,
  Users
} from "lucide-react"
import KnowledgeBaseUserManager from "@/components/knowledge/KnowledgeBaseUserManager"

// TODO: Define types for KnowledgeBase, KnowledgeGroup etc. if not already globally available

// Knowledge Base type
type KnowledgeBase = {
  id: string
  name: string
  user_id: string
  created_at?: string
  updated_at?: string | null
  description?: string | null
  [key: string]: any
}

// Knowledge Group type
type KnowledgeGroup = {
  id: string
  name: string
  user_id: string
  created_at?: string
  [key: string]: any
}

// GroupMember type
type GroupMember = {
  id: string
  group_id: string
  user_id: string
  created_at?: string
  [key: string]: any
}

// User profile type
type UserProfile = {
  id: string
  full_name: string
  email?: string
  [key: string]: any
}

export default function KnowledgeBasePage() {
  const supabase = createClientComponentClient<Database>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<
    string | null
  >(null)
  const [fadeIn, setFadeIn] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null)
  const [groups, setGroups] = useState<KnowledgeGroup[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([])
  const [knowledgeBaseUsers, setKnowledgeBaseUsers] = useState<UserProfile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<'upload' | 'users'>('upload')
  const [showAddUserDropdown, setShowAddUserDropdown] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        setIsAdmin(true) // Placeholder: Assume admin for now
        fetchKnowledgeBases(session.user.id)
      } else {
        console.log("User not logged in, redirecting...")
      }
      setLoading(false)

      // Trigger fade-in animation after loading
      setTimeout(() => {
        setFadeIn(true)
      }, 100)
    }
    getUser()
  }, [supabase])

  const fetchKnowledgeBases = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("knowledge_bases")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true })

      if (error) throw error
      setKnowledgeBases(data || [])
    } catch (err) {
      console.error("Error fetching knowledge bases:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectKnowledgeBase = async (kb: KnowledgeBase) => {
    setSelectedKnowledgeBase(kb)
    setSelectedKnowledgeBaseId(kb.id)
    setActiveTab('upload') // Default to upload tab when selecting
    
    // Fetch groups for this knowledge base
    fetchKnowledgeBaseGroups(kb.id)
  }

  const handleSelectKnowledgeBaseId = (id: string | null) => {
    setSelectedKnowledgeBaseId(id)
    if (id === null) {
      setSelectedKnowledgeBase(null)
    } else {
      const kb = knowledgeBases.find(kb => kb.id === id)
      if (kb) {
        setSelectedKnowledgeBase(kb)
        fetchKnowledgeBaseGroups(id)
      }
    }
  }

  const fetchKnowledgeBaseGroups = async (knowledgeBaseId: string) => {
    try {
      // Get groups associated with this knowledge base
      const { data: groupData, error: groupError } = await supabase
        .from("knowledge_base_groups")
        .select("group_id")
        .eq("knowledge_base_id", knowledgeBaseId)

      if (groupError) throw groupError
      
      if (groupData && groupData.length > 0) {
        const groupIds = groupData.map(g => g.group_id)
        
        // Get details of these groups
        const { data: groups, error: groupsError } = await supabase
          .from("knowledge_groups")
          .select("*")
          .in("id", groupIds)
          
        if (groupsError) throw groupsError
        setGroups(groups || [])
        
        // Get members of these groups
        if (groups && groups.length > 0) {
          await fetchGroupMembers(groups[0].id)
        } else {
          setMembers([])
          setKnowledgeBaseUsers([])
        }
      } else {
        setGroups([])
        setMembers([])
        setKnowledgeBaseUsers([])
      }
      
      // Get all available users that could be added
      await fetchAvailableUsers()
    } catch (err) {
      console.error("Error fetching knowledge base groups:", err)
    }
  }

  const fetchGroupMembers = async (groupId: string) => {
    try {
      // Get members of this group
      const { data: membersData, error: membersError } = await supabase
        .from("knowledge_group_members")
        .select("*")
        .eq("group_id", groupId)
        
      if (membersError) throw membersError
      setMembers(membersData || [])
      
      // Fetch user profiles for these members
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id)
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds)
          
        if (profilesError) throw profilesError
        setKnowledgeBaseUsers(profiles || [])
      } else {
        setKnowledgeBaseUsers([])
      }
    } catch (err) {
      console.error("Error fetching group members:", err)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      // Get all users in workspace/company
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true })
        
      if (profilesError) throw profilesError
      setAvailableUsers(profiles || [])
    } catch (err) {
      console.error("Error fetching available users:", err)
    }
  }

  const addUserToKnowledgeBase = async (userId: string) => {
    if (!selectedKnowledgeBase || !groups.length) return

    try {
      // Use the first group associated with this knowledge base
      const groupId = groups[0].id
      
      // Add user to group
      const { error } = await supabase
        .from("knowledge_group_members")
        .insert({
          group_id: groupId,
          user_id: userId
        })
        
      if (error) throw error
      
      // Refresh the member list
      await fetchGroupMembers(groupId)
      setShowAddUserDropdown(false)
    } catch (err) {
      console.error("Error adding user to knowledge base:", err)
    }
  }

  const removeUserFromKnowledgeBase = async (userId: string) => {
    if (!selectedKnowledgeBase || !groups.length) return
    
    try {
      // Use the first group associated with this knowledge base
      const groupId = groups[0].id
      
      // Remove user from group
      const { error } = await supabase
        .from("knowledge_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId)
        
      if (error) throw error
      
      // Refresh the member list
      await fetchGroupMembers(groupId)
    } catch (err) {
      console.error("Error removing user from knowledge base:", err)
    }
  }

  const createKnowledgeBaseGroup = async () => {
    if (!selectedKnowledgeBase || !user) return
    
    try {
      // Create a new group for this knowledge base
      const { data: group, error: groupError } = await supabase
        .from("knowledge_groups")
        .insert({
          name: `${selectedKnowledgeBase.name} Group`,
          user_id: user.id
        })
        .select()
        .single()
        
      if (groupError) throw groupError
      
      // Associate this group with the knowledge base
      const { error: associationError } = await supabase
        .from("knowledge_base_groups")
        .insert({
          knowledge_base_id: selectedKnowledgeBase.id,
          group_id: group.id
        })
        
      if (associationError) throw associationError
      
      // Refresh groups
      await fetchKnowledgeBaseGroups(selectedKnowledgeBase.id)
    } catch (err) {
      console.error("Error creating knowledge base group:", err)
    }
  }

  const filteredUsers = searchQuery 
    ? availableUsers.filter(user => 
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !knowledgeBaseUsers.some(kbu => kbu.id === user.id)
      )
    : availableUsers.filter(user => 
        !knowledgeBaseUsers.some(kbu => kbu.id === user.id)
      )

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1e1e1e]">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <BrainCircuit className="size-12 animate-bounce text-white" />
          <div className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            <p className="text-lg font-medium">Loading Knowledge Base</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1e1e1e]">
        <div className="max-w-md rounded-xl border border-[#333333] bg-gradient-to-b from-[#252525] to-[#1e1e1e] p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="mb-2 rounded-full bg-white/5 p-3">
              <DatabaseIcon className="size-10 text-white" />
            </div>
            <h2 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-xl font-medium text-transparent">
              Authentication Required
            </h2>
            <p className="text-center text-gray-400">
              Please sign in to access the knowledge database.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1e1e1e]">
        <div className="max-w-md rounded-xl border border-[#333333] bg-gradient-to-b from-[#252525] to-[#1e1e1e] p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="mb-2 rounded-full bg-white/5 p-3">
              <DatabaseIcon className="size-10 text-gray-400" />
            </div>
            <h2 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-xl font-medium text-transparent">
              Access Denied
            </h2>
            <p className="text-center text-gray-400">
              You don&apos;t have permission to manage knowledge databases.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-[#1e1e1e] p-6 transition-opacity duration-500 ${fadeIn ? "opacity-100" : "opacity-0"}`}
    >
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-r from-[#e91e63]/20 to-[#c2185b]/20 p-2">
                <BrainCircuit className="size-6 text-[#e91e63]" />
              </div>
              <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-2xl font-bold text-transparent">
                Knowledge Base
              </h1>
            </div>
            <p className="mt-1 max-w-2xl leading-relaxed text-gray-400">
              Create and manage knowledge bases for more intelligent AI
              interactions. Add documents and extract insights from your data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#333333] bg-[#252525] px-4 py-2.5 text-sm">
              <Sparkles className="size-4 text-[#e91e63]" />
              <span className="text-gray-300">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#333333] bg-gradient-to-br from-[#252525] to-[#1e1e1e] p-5 shadow-lg shadow-black/20 transition-all hover:translate-y-[-2px] hover:shadow-indigo-900/5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-[#e91e63]/10 to-[#c2185b]/10 p-2.5">
                <Server className="size-5 text-[#e91e63]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">
                  Knowledge Bases
                </h3>
                <p className="text-xl font-semibold text-white">Manage</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#333333] bg-gradient-to-br from-[#252525] to-[#1e1e1e] p-5 shadow-lg shadow-black/20 transition-all hover:translate-y-[-2px] hover:shadow-indigo-900/5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-[#e91e63]/10 to-[#c2185b]/10 p-2.5">
                <FileUp className="size-5 text-[#e91e63]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">Documents</h3>
                <p className="text-xl font-semibold text-white">Upload</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#333333] bg-gradient-to-br from-[#252525] to-[#1e1e1e] p-5 shadow-lg shadow-black/20 transition-all hover:translate-y-[-2px] hover:shadow-indigo-900/5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-[#e91e63]/10 to-[#c2185b]/10 p-2.5">
                <Zap className="size-5 text-[#e91e63]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">
                  Knowledge Analysis
                </h3>
                <p className="text-xl font-semibold text-white">Insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Knowledge Base List */}
          <div className="md:col-span-4">
            <div className="h-full rounded-xl border border-[#333333] bg-[#202020] p-5 shadow-lg shadow-black/20 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-medium text-white">
                  <Server className="size-5 text-[#e91e63]" />
                  My Knowledge Bases
                </h2>
              </div>

              {user && (
                <KnowledgeBaseList
                  userId={user.id}
                  selectedKnowledgeBaseId={selectedKnowledgeBaseId}
                  onSelectKnowledgeBase={handleSelectKnowledgeBaseId}
                />
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div className="md:col-span-8">
            <div className="h-full rounded-xl border border-[#333333] bg-[#202020] p-5 shadow-lg shadow-black/20 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-medium text-white">
                  <FileUp className="size-5 text-[#e91e63]" />
                  Upload Content
                </h2>
              </div>

              {selectedKnowledgeBase ? (
                <div>
                  {/* Make tab navigation stand out with colored background and more space */}
                  <div className="mb-6 rounded-lg bg-[#242424] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-white">
                        {selectedKnowledgeBase.name}
                      </h2>
                    </div>
                    
                    <p className="mb-4 text-sm text-gray-400">Verwalten Sie Inhalte und Zugriffsberechtigungen dieser Wissensdatenbank.</p>
                    
                    {/* Make tabs more prominent and larger */}
                    <div className="flex w-full rounded-lg border border-[#333333] bg-[#1e1e1e] p-1.5">
                      <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === 'upload'
                            ? 'bg-pink-600 text-white'
                            : 'bg-transparent text-gray-300 hover:bg-[#333333]'
                        }`}
                      >
                        <Upload size={18} className="mr-2 inline-block" />
                        Inhalt hochladen
                      </button>
                      <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === 'users'
                            ? 'bg-pink-600 text-white'
                            : 'bg-transparent text-gray-300 hover:bg-[#333333]'
                        }`}
                      >
                        <Users size={18} className="mr-2 inline-block" />
                        Benutzer-Berechtigungen
                      </button>
                    </div>
                  </div>
                  
                  {activeTab === 'upload' ? (
                    <div className="rounded-lg border border-[#333333] bg-[#1e1e1e] p-6">
                      <div className="flex justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#2a2a2a]">
                            <Upload size={24} className="text-gray-400" />
                          </div>
                          <h3 className="mb-2 text-lg font-medium text-white">Drag & drop oder klicken zum Hochladen</h3>
                          <p className="mb-4 text-sm text-gray-400">Unterstützt TXT, PDF, MD, DOCX</p>
                          
                          <button className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">
                            Datei auswählen
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <KnowledgeBaseUserManager 
                      knowledgeBase={selectedKnowledgeBase}
                      currentUserId={user?.id || ''}
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-lg border border-[#333333] bg-[#1e1e1e] p-10 text-center">
                  <div className="mb-4 rounded-full bg-[#242424] p-4">
                    <Book size={24} className="text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-white">Wählen Sie eine Wissensdatenbank</h3>
                  <p className="text-sm text-gray-400">
                    Wählen Sie eine Wissensdatenbank aus der Liste aus, um Inhalte hochzuladen oder Berechtigungen zu verwalten.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
