import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { knowledgeBaseId } = await request.json();

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "Missing knowledgeBaseId" },
        { status: 400 }
      );
    }

    console.log(
      `[KB Delete API] User ${user.id} attempting to delete KB: ${knowledgeBaseId}`
    );

    // 1. Verify ownership
    const { data: kbData, error: ownerError } = await supabase
      .from("knowledge_bases")
      .select("id")
      .eq("id", knowledgeBaseId)
      .eq("user_id", user.id)
      .single();

    if (ownerError || !kbData) {
      console.error(
        `[KB Delete API] Ownership check failed or KB not found for user ${user.id}, KB: ${knowledgeBaseId}`, ownerError
      );
      return NextResponse.json(
        { error: "Knowledge base not found or access denied" },
        { status: 404 } // Or 403, but 404 hides existence
      );
    }

    // 2. Perform deletion using the SQL function via RPC
    console.log(`[KB Delete API] Calling RPC delete_knowledge_base_and_related_data for KB: ${knowledgeBaseId}`);
    const { error: rpcError } = await supabase
      .rpc('delete_knowledge_base_and_related_data', {
        kb_id: knowledgeBaseId,
        user_id_check: user.id // Pass user ID for ownership check within the function
      });

    if (rpcError) {
      console.error(
        `[KB Delete API] Error calling RPC delete_knowledge_base_and_related_data for KB ${knowledgeBaseId}:`,
        rpcError
      );
      // Handle specific errors if needed (e.g., function not found, permission error)
      if (rpcError.message.includes("does not exist")) {
         throw new Error(`Database function 'delete_knowledge_base_and_related_data' not found. Please create it.`);
      } else if (rpcError.message.includes("permission denied")) {
         throw new Error(`Permission denied for function 'delete_knowledge_base_and_related_data'. Check grants.`);
      } else if (rpcError.message.includes("Knowledge base not found or user does not have permission")) {
        // Error raised from within the function due to ownership check
        return NextResponse.json(
          { error: "Knowledge base not found or access denied" },
          { status: 404 } 
        );
      }
      throw new Error(`Database RPC failed: ${rpcError.message}`);
    }

    console.log(
      `[KB Delete API] Successfully deleted KB: ${knowledgeBaseId} by user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: "Knowledge base deleted successfully.",
    });

  } catch (error: any) {
    console.error("[KB Delete API] General error:", error);
    return NextResponse.json(
      { error: `Failed to delete knowledge base: ${error.message}` },
      { status: 500 }
    );
  }
} 