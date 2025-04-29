"use client"

import React, { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/supabase/types"
import { User } from "@supabase/supabase-js"
import { KnowledgeBaseList } from "@/components/knowledge/KnowledgeBaseList"
import { KnowledgeItemUpload } from "@/components/knowledge/KnowledgeItemUpload"
import KnowledgeBaseUserManager from "@/components/knowledge/KnowledgeBaseUserManager"
import { getSavedCompany } from "@/lib/domain-manager"
import {
  Database as DatabaseIcon,
  BookText,
  BrainCircuit,
  PlusCircle,
  BarChart2,
  Sparkles,
  Users,
  Upload
} from "lucide-react"

// NEU: Props Interface hinzufügen, um workspaceId zu akzeptieren
interface KnowledgeComponentDashboardProps {
  selectedWorkspaceId: string | null;
}

// Diese Komponente ist eine Variante der KnowledgeBasePage, die direkt im Dashboard verwendet werden kann
export default function KnowledgeComponentDashboard({
  selectedWorkspaceId // NEU: Prop hier entgegennehmen
}: KnowledgeComponentDashboardProps) {
  const supabase = createClientComponentClient<Database>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<
    string | null
  >(null)
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<any | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [activeTab, setActiveTab] = useState<'upload' | 'users'>('upload')

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        setIsAdmin(true) // Placeholder: Assume admin for now
        
        // Get company name from saved company info
        const company = getSavedCompany()
        if (company && company.name) {
          setCompanyName(company.name)
        }
      } else {
        console.log("User not logged in in KnowledgeComponentDashboard")
      }
      setLoading(false)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    // Fetch the selected knowledge base details when the ID changes
    const fetchKnowledgeBaseDetails = async () => {
      if (!selectedKnowledgeBaseId || !user) return;
      
      try {
        const { data, error } = await supabase
          .from("knowledge_bases")
          .select("*")
          .eq("id", selectedKnowledgeBaseId)
          .single();
          
        if (error) throw error;
        setSelectedKnowledgeBase(data);
      } catch (err) {
        console.error("Error fetching knowledge base details:", err);
      }
    };
    
    fetchKnowledgeBaseDetails();
  }, [selectedKnowledgeBaseId, user, supabase]);

  if (loading) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <BrainCircuit className="size-12 text-white" />
          <p className="text-sm text-gray-400">
            Wissensdatenbank wird geladen...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="max-w-md rounded-xl border border-[#333333] bg-[#252525] p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <DatabaseIcon className="size-12 text-white" />
            <h2 className="text-xl font-medium text-white">
              Anmeldung erforderlich
            </h2>
            <p className="text-center text-gray-400">
              Bitte melden Sie sich an, um auf die Wissensdatenbank zuzugreifen.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="max-w-md rounded-xl border border-[#333333] bg-[#252525] p-8 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <DatabaseIcon className="size-12 text-gray-400" />
            <h2 className="text-xl font-medium text-white">
              Zugriff verweigert
            </h2>
            <p className="text-center text-gray-400">
              Sie haben keine Berechtigung, Wissensdatenbanken zu verwalten.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleSelectKnowledgeBase = (id: string | null) => {
    console.log("Selected Knowledge Base ID in Dashboard Component:", id)
    setSelectedKnowledgeBaseId(id)
    // HINWEIS: Das neue System verwendet workspaceId, nicht knowledgeBaseId.
    // Aktuell wird die ausgewählte KnowledgeBaseId *nicht* an KnowledgeItemUpload übergeben.
    // Das neue System lädt Dokumente in den Kontext des *aktuellen Workspace* hoch.
  }

  const handleKnowledgeBaseDeleted = (deletedKbId: string) => {
    console.log(`Knowledge base deleted: ${deletedKbId}. Updating Dashboard state.`);
    // If the deleted KB was the selected one, reset the selection
    if (selectedKnowledgeBaseId === deletedKbId) {
      setSelectedKnowledgeBaseId(null);
      setSelectedKnowledgeBase(null); // Also clear the detailed KB data
      // Optionally switch the active tab back to upload or a default view
      // setActiveTab('upload'); 
    }
    // The list component already updated its internal state, 
    // so no need to force a re-fetch here unless absolutely necessary.
  };

  // Tab Navigation Buttons
  const renderTabButtons = () => {
    // Tabs nur anzeigen, wenn eine Knowledge Base *und* ein Workspace ausgewählt sind?
    // Für das neue System ist eigentlich nur die workspaceId relevant.
    // Wir könnten die Tabs auch anzeigen, wenn nur selectedWorkspaceId gesetzt ist.
    if (!selectedKnowledgeBaseId) return null; // Behalten wir vorerst bei, um die alte Logik nicht zu brechen
    
    return (
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'upload' 
              ? 'bg-[#f056c1] text-white' 
              : 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
          }`}
        >
          <Upload className="size-4" />
          Inhalt hochladen
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'users' 
              ? 'bg-[#f056c1] text-white' 
              : 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
          }`}
        >
          <Users className="size-4" />
          Benutzer verwalten
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-full p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="mt-2 max-w-2xl text-gray-400">
              Verwalten Sie Ihre eigenen Datensätze für präzise und personalisierte KI-Assistenz.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#333333] px-4 py-2 text-sm">
              <Sparkles className="size-4 text-[#f056c1]" />
              <span className="text-gray-400">{companyName || "Unternehmen"}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Knowledge Base List (bleibt vorerst, steuert aber nicht mehr den Upload-Kontext) */}
          <div className="md:col-span-4">
            <div className="h-full rounded-xl border border-[#333333] p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-medium text-white">
                  <DatabaseIcon className="size-5 text-[#f056c1]" />
                  Meine Datenbanken
                </h2>
              </div>

              {user && (
                <KnowledgeBaseList
                  userId={user.id}
                  selectedKnowledgeBaseId={selectedKnowledgeBaseId}
                  onSelectKnowledgeBase={handleSelectKnowledgeBase}
                  onKnowledgeBaseDeleted={handleKnowledgeBaseDeleted}
                />
              )}
            </div>
          </div>

          {/* Content Section - Right Panel */}
          <div className="md:col-span-8">
            <div className="h-full rounded-xl border border-[#333333] p-5 shadow-sm">
              {/* Tab Navigation */}
              {renderTabButtons()}
              
              {/* Tab Content */}
              {/* Zeige Upload/Management nur wenn Workspace ausgewählt ist */} 
              {selectedWorkspaceId ? (
                <>
                  {activeTab === 'upload' && (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-medium text-white">
                          <PlusCircle className="size-5 text-[#f056c1]" />
                          Dokumente in Workspace hochladen
                        </h2>
                      </div>
                    
                      <KnowledgeItemUpload
                        userId={user.id} // Bleibt für Konsistenz, Hook holt User selbst
                        knowledgeBaseId={selectedKnowledgeBaseId || ''} // Vorerst beibehalten, falls intern noch benötigt
                        workspaceId={selectedWorkspaceId} // NEU: Hier die workspaceId übergeben
                      />
                    </>
                  )}
                
                  {activeTab === 'users' && selectedKnowledgeBaseId && (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-medium text-white">
                          <Users className="size-5 text-[#f056c1]" />
                          Benutzer der Wissensdatenbank verwalten
                        </h2>
                      </div>
                      
                      {selectedKnowledgeBase && (
                        <KnowledgeBaseUserManager 
                          knowledgeBase={selectedKnowledgeBase}
                          user={user}
                        />
                      )}
                    </>
                  )}
                   {activeTab === 'users' && !selectedKnowledgeBaseId && (
                     <p className="text-gray-400">Bitte wählen Sie links eine Wissensdatenbank aus, um Benutzer zu verwalten.</p>
                   )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#333333] p-8">
                  <DatabaseIcon className="mb-4 size-12 text-gray-400" />
                  <p className="mb-2 text-center text-gray-400">
                    Wählen Sie einen Workspace im Hauptdashboard,
                    um Dokumente hochzuladen oder zu verwalten.
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
