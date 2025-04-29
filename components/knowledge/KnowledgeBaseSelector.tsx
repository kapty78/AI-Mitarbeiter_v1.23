"use client"

import React, { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/supabase/types"
import { Book, X, DatabaseIcon, ChevronDown } from "lucide-react"

// Define KnowledgeBase type generically since it's not in the Database type
type KnowledgeBase = {
  id: string
  name: string
  user_id: string
  created_at?: string
  updated_at?: string | null
  description?: string | null
  [key: string]: any // For any other properties
}

// Extended type with access information
type KnowledgeBaseWithAccess = KnowledgeBase & {
  hasAccess: boolean
}

interface KnowledgeBaseSelectorProps {
  userId: string
  selectedKnowledgeBaseId: string[] | null
  onSelectKnowledgeBase: (ids: string[] | null) => void
  isCompact?: boolean
}

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
  userId,
  selectedKnowledgeBaseId,
  onSelectKnowledgeBase,
  isCompact = false
}) => {
  // console.log("🔄 KBSelector: Component rendering with userId:", userId); // REMOVE
  
  // Stable supabase client reference
  const supabaseRef = useRef(createClientComponentClient<Database>());
  const supabase = supabaseRef.current;
  
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseWithAccess[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // console.log("🧪 DIRECT TEST: About to manually fetch knowledge bases"); // REMOVE

  // Fetch knowledge bases function
    const fetchKnowledgeBases = async () => {
    // console.log("🔍 KBSelector: Starting to fetch knowledge bases (including shared) for userId:", userId); // REMOVE
    
    if (!userId) {
      // console.log("❌ KBSelector: No userId provided, aborting fetch"); // REMOVE
      setLoading(false); // Ensure loading stops if no user ID
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch ALL knowledge bases initially
      // console.log("🔍 KBSelector: Fetching ALL knowledge bases"); // REMOVE
      const { data: allKBs, error: kbError } = await supabase
          .from("knowledge_bases")
          .select("*")
        .order("name", { ascending: true });

      if (kbError) {
        // console.error("❌ KBSelector: Error fetching all KBs:", kbError); // REMOVE
        throw kbError;
      }
      // console.log("📦 KBSelector: All KBs fetched:", allKBs?.length ?? 0); // REMOVE
      if (!allKBs || allKBs.length === 0) {
          // console.log("🤷 KBSelector: No knowledge bases found in the system."); // REMOVE
          setKnowledgeBases([]);
          setLoading(false);
          return;
      }


      // 2. Fetch the user's group memberships
      // console.log("🔍 KBSelector: Fetching user group memberships for userId:", userId); // REMOVE
      const { data: groupMembers, error: groupMembersError } = await supabase
        .from("knowledge_group_members")
        .select("group_id")
        .eq("user_id", userId);

      if (groupMembersError) {
        // console.error("❌ KBSelector: Error fetching group memberships:", groupMembersError); // REMOVE
        // Decide how to handle this - maybe show all KBs as inaccessible?
        // For now, let's assume no access if groups can't be fetched.
        throw groupMembersError;
      }

      const userGroupIds = groupMembers?.map(member => member.group_id) || [];
      // console.log("👥 KBSelector: User belongs to groups:", userGroupIds); // REMOVE

      if (userGroupIds.length === 0) {
          // console.log("👤 KBSelector: User is not in any groups. Marking all KBs as inaccessible."); // REMOVE
          setKnowledgeBases(allKBs.map(kb => ({ ...kb, hasAccess: false })));
          setLoading(false);
          return;
      }

      // 3. Fetch which knowledge bases are linked to the user's groups
      // console.log("🔍 KBSelector: Fetching knowledge bases linked to groups:", userGroupIds); // REMOVE
      const { data: accessibleKBsLinks, error: accessibleError } = await supabase
        .from("knowledge_base_groups")
        .select("knowledge_base_id")
        .in("group_id", userGroupIds);

      if (accessibleError) {
        // console.error("❌ KBSelector: Error fetching KB-group links:", accessibleError); // REMOVE
         // Again, decide handling. Throwing for now.
        throw accessibleError;
      }

      const accessibleKbIds = new Set(accessibleKBsLinks?.map(link => link.knowledge_base_id) || []);
      // console.log("🔑 KBSelector: Accessible KB IDs based on groups:", Array.from(accessibleKbIds)); // REMOVE

      // 4. Combine the data: Mark each KB with access status
      const kbsWithAccess = allKBs.map(kb => ({
        ...kb,
        hasAccess: accessibleKbIds.has(kb.id)
      }));

      /* // REMOVE Block
      console.log("✅ KBSelector: Final KBs with access status calculated:", {
          total: kbsWithAccess.length,
          accessibleCount: kbsWithAccess.filter(kb => kb.hasAccess).length,
          accessibleNames: kbsWithAccess.filter(kb => kb.hasAccess).map(kb => kb.name)
      });
      */

      setKnowledgeBases(kbsWithAccess);
      
    } catch (err: any) {
      // console.error("❌ KBSelector: Error during fetchKnowledgeBases execution:", err); // REMOVE
      // More specific error message based on step?
      setError(`Failed to load knowledge bases: ${err.message}`);
      setKnowledgeBases([]); // Clear any partial state
    } finally {
      setLoading(false);
      // console.log("🏁 KBSelector: Finished fetchKnowledgeBases attempt."); // REMOVE
    }
  };

  // Simple useEffect without useCallback - Keep this simple
  useEffect(() => {
    // console.log("🔄 KBSelector: useEffect triggered. Checking userId:", userId); // REMOVE
    // setEffectExecuted(true); // REMOVE

    // console.log("🚀 KBSelector: useEffect async IIFE starting..."); // REMOVE

    (async () => {
      try {
        // console.log("📞 KBSelector: Calling fetchKnowledgeBases from useEffect..."); // REMOVE
        await fetchKnowledgeBases();
        // console.log("✅ KBSelector: fetchKnowledgeBases call completed in useEffect."); // REMOVE
      } catch (e) {
        console.error("❌ KBSelector: Error within useEffect async IIFE:", e); // Keep this one general error log maybe? Or remove too? Let's remove for now.
      }
    })();

    /* // REMOVE Block
    return () => {
      console.log("🧹 KBSelector: Component unmounting or userId changed");
    };
    */
  }, [userId]); // Only re-run if userId changes

  // Listen for clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle selecting a knowledge base
  const handleSelect = (kb: KnowledgeBaseWithAccess) => {
    // console.log("🖱️ KBSelector: Handling selection of KB:", kb.name, kb.id, "hasAccess:", kb.hasAccess) // REMOVE
    
    // Prevent selection if user doesn't have access
    if (!kb.hasAccess) {
      // console.log("🚫 KBSelector: Selection prevented - no access to KB:", kb.id) // REMOVE
      return;
    }
    
    // If it's already selected, deselect it
    if (selectedKnowledgeBaseId && selectedKnowledgeBaseId.includes(kb.id)) {
      // console.log("🔄 KBSelector: Deselecting KB:", kb.id) // REMOVE
      onSelectKnowledgeBase(selectedKnowledgeBaseId.filter(id => id !== kb.id));
    } else {
      // console.log("✅ KBSelector: Selecting KB:", kb.id) // REMOVE
      onSelectKnowledgeBase([...(selectedKnowledgeBaseId || []), kb.id]);
    }
  }

  // Toggle database icon click - select all or none
  const toggleAllSelection = () => {
    const accessibleKbs = knowledgeBases.filter(kb => kb.hasAccess);
    
    // If all accessible KBs are selected, deselect all, otherwise select all
    const allSelected = accessibleKbs.every(kb => 
      selectedKnowledgeBaseId && selectedKnowledgeBaseId.includes(kb.id)
    );

    if (allSelected) {
      // Deselect all
      onSelectKnowledgeBase(null);
    } else {
      // Select all accessible KBs
      onSelectKnowledgeBase(accessibleKbs.map(kb => kb.id));
    }
  };

  // Clear the selection
  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    // console.log("🧹 KBSelector: Clearing selection") // REMOVE
    onSelectKnowledgeBase(null);
  }

  /* // REMOVE Block
  // Manual trigger button for testing
  const manualFetch = () => {
    console.log("🔄 KBSelector: Manual fetch triggered");
    fetchKnowledgeBases();
  };
  */

  /* // REMOVE Block
  console.log("🖥️ KBSelector: Rendering with state:", {
    loading,
    error,
    knowledgeBasesCount: knowledgeBases.length,
    hasAccessibleKBs: knowledgeBases.some(kb => kb.hasAccess),
    effectExecuted // Remove this line if effectExecuted state is removed
  })
  */

  const accessibleKnowledgeBases = knowledgeBases.filter(kb => kb.hasAccess);
  const allSelected = accessibleKnowledgeBases.length > 0 && 
    accessibleKnowledgeBases.every(kb => 
      selectedKnowledgeBaseId && selectedKnowledgeBaseId.includes(kb.id)
    );

  // Display active knowledge bases as a dropdown
  return (
    <div
      id="knowledge-base-display"
      ref={dropdownRef}
      className={`relative flex items-center rounded-lg border border-[#333333] bg-gradient-to-b from-[#252525]/70 to-[#1e1e1e]/70 px-3 py-1.5 text-sm text-[#cccccc] ${
        isCompact ? "min-w-[200px] max-w-[300px]" : "w-full md:w-[300px]"
      }`}
    >
      <button 
        onClick={toggleAllSelection}
        className="mr-2 shrink-0 transition-all duration-200 hover:text-[#f056c1]"
        title={allSelected ? "Alle Wissensdatenbanken abwählen" : "Alle Wissensdatenbanken auswählen"}
      >
        <DatabaseIcon size={16} className={allSelected ? "text-[#f056c1]" : ""} />
      </button>

      <div className="grow overflow-hidden">
        {loading ? (
          <div className="py-1 text-xs text-gray-400">Wird geladen...</div>
        ) : error ? (
          <div className="py-1 text-xs text-red-400">{error}</div>
        ) : knowledgeBases.filter(kb => kb.hasAccess).length === 0 ? (
          <div className="py-1 text-xs text-gray-400">
            Keine verfügbar
          </div>
        ) : (
          <div 
            className="flex cursor-pointer items-center justify-between"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="truncate">
              {selectedKnowledgeBaseId && selectedKnowledgeBaseId.length > 0 ? (
                <div className="flex items-center">
                  <span className="truncate">
                    {selectedKnowledgeBaseId.length === 1 
                      ? knowledgeBases.find(kb => kb.id === selectedKnowledgeBaseId[0])?.name 
                      : `${selectedKnowledgeBaseId.length} ausgewählt`}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400">Wissensdatenbank auswählen</span>
              )}
            </div>
            <ChevronDown size={16} className="ml-2 shrink-0 transition-all duration-200" />
          </div>
        )}
      </div>

      {/* Clear Selection Button */}
      {selectedKnowledgeBaseId && selectedKnowledgeBaseId.length > 0 && (
        <button
          onClick={clearSelection}
          className="ml-2 shrink-0 rounded-full p-1 transition-all duration-200 hover:bg-[#444444] hover:text-[#f056c1]"
          title="Alle Wissensdatenbanken abwählen"
        >
          <X size={12} />
        </button>
      )}

      {/* Dropdown Menu */}
      {showDropdown && accessibleKnowledgeBases.length > 0 && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#333333] bg-[#1e1e1e] py-1 shadow-lg">
          {/* "Alles" Button */}
          <button
            onClick={toggleAllSelection}
            className={`flex w-full items-center px-4 py-2 text-sm transition-all duration-200 hover:bg-[#2d2d2d] ${
              allSelected ? "bg-gradient-to-r from-[#f056c1]/20 to-[#c2185b]/20 text-[#f056c1]" : "text-[#cccccc]"
            }`}
          >
            <span className="font-medium">Alles</span>
          </button>
          
          <div className="my-1 border-t border-[#333333]"></div>
          
          {/* Individual Knowledge Base Options */}
          {accessibleKnowledgeBases.map(kb => (
            <button
              key={kb.id}
              onClick={() => handleSelect(kb)}
              className={`flex w-full items-center px-4 py-2 text-sm transition-all duration-200 hover:bg-[#2d2d2d] ${
                selectedKnowledgeBaseId && selectedKnowledgeBaseId.includes(kb.id)
                  ? "bg-gradient-to-r from-[#f056c1]/20 to-[#c2185b]/20 text-[#f056c1]"
                  : "text-[#cccccc]"
              }`}
            >
              {kb.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}