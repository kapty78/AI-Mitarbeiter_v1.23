import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
      error: authError
    } = await supabase.auth.exchangeCodeForSession(code)

    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.redirect(
        requestUrl.origin + "/login?error=Could not verify email"
      )
    }

    // Get user metadata
    const { username, display_name, registration_type, company_name } =
      user.user_metadata

    try {
      if (registration_type === "company") {
        // Create new company
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: company_name,
            domain: user.email?.split("@")[1]
          })
          .select()
          .single()

        if (companyError) throw new Error(companyError.message)

        // Add user as company admin
        const { error: adminError } = await supabase
          .from("company_admins")
          .insert({
            company_id: companyData.id,
            user_id: user.id
          })

        if (adminError) throw new Error(adminError.message)

        // Create profile with company association
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: user.id,
          username,
          display_name,
          company_id: companyData.id,
          role: "admin",
          has_onboarded: true,
          bio: "",
          image_path: "",
          image_url: "",
          profile_context: ""
        })

        if (profileError) throw new Error(profileError.message)
      } else {
        // Find company by domain
        const domain = user.email?.split("@")[1]
        const { data: existingCompany, error: searchError } = await supabase
          .from("companies")
          .select("id")
          .eq("domain", domain)
          .single()

        if (!existingCompany) {
          return NextResponse.redirect(
            requestUrl.origin +
              "/login?error=No company found for this email domain. Please register as a Company Admin instead."
          )
        }

        // Create profile with existing company
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: user.id,
          username,
          display_name,
          company_id: existingCompany.id,
          role: "employee",
          has_onboarded: true,
          bio: "",
          image_path: "",
          image_url: "",
          profile_context: ""
        })

        if (profileError) throw new Error(profileError.message)
      }

      // Create home workspace
      const { error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          user_id: user.id,
          name: "Home",
          description: "My personal workspace",
          is_home: true
        })

      if (workspaceError) throw new Error(workspaceError.message)
    } catch (error: any) {
      console.error("Error in callback:", error)
      return NextResponse.redirect(
        requestUrl.origin + `/login?error=${error.message}`
      )
    }
  }

  if (next) {
    return NextResponse.redirect(requestUrl.origin + next)
  } else {
    return NextResponse.redirect(requestUrl.origin)
  }
}
