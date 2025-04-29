"use client"

import React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

// Import der Hilfe-Komponenten
import DashboardHelp from "../components/help/dashboard-help"

export default function HilfePage() {
  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white">
      {/* Header */}
      <header className="border-b border-[#444444] bg-[#252525] px-8 py-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-300 hover:text-white"
              >
                <ChevronLeft size={20} />
                <span>Zurück zum Dashboard</span>
              </Link>
            </div>
            <h1 className="text-2xl font-semibold">Hilfe & Dokumentation</h1>
            <div></div> {/* Empty div for flex alignment */}
          </div>
        </div>
      </header>

      {/* Main Content - Direkt Dashboard-Hilfe anzeigen */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <DashboardHelp />
        </div>
      </main>
    </div>
  )
}
