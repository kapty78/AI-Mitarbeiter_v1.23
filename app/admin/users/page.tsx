"use client"

import { getSavedCompany } from "@/lib/domain-manager"
import { UserManagement } from "@/components/admin/UserManagement"
import { useEffect, useState } from "react"

export default function AdminUsersPage() {
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Bei Seitenaufbau Company-ID laden
  useEffect(() => {
    const company = getSavedCompany()
    setCompanyId(company?.id || null)
  }, [])

  // Die UserManagement-Komponente mit einer wichtigen key-Prop versehen,
  // damit sie bei jedem Rendervorgang neu initialisiert wird
  return (
    <UserManagement
      companyId={companyId}
      key={`user-management-${Date.now()}`}
    />
  )
}
