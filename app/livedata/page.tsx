"use client"

import React from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Share2,
  Database,
  FileText,
  Settings,
  HelpCircle,
  Activity,
  LogOut,
  User,
  Plus,
  BarChart2,
  MessageCircle,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  Send,
  CheckCircle,
  ZapIcon,
  Clock,
  Users,
  Shield,
  Sparkles,
  BrainCircuit,
  Home,
  Zap,
  ChevronLeft
} from "lucide-react"
import { getSavedCompany } from "@/lib/domain-manager"

// Array der unterstützten Integrationen
const INTEGRATIONS = [
  {
    name: "SAP",
    color: "#008FD3",
    angle: 0,
    logo: "/logos/apps/sap.svg",
    description:
      "ERP-Daten wie Lagerbestände, Aufträge und Produktdaten direkt verfügbar machen."
  },
  {
    name: "Outlook",
    color: "#0072C6",
    angle: 45,
    logo: "/logos/apps/outlook.svg",
    description:
      "E-Mail-Inhalte und Termine für den KI-Assistenten nutzbar machen."
  },
  {
    name: "Zendesk",
    color: "#03363D",
    angle: 90,
    logo: "/logos/apps/zendesk.svg",
    description:
      "Support-Tickets und Kundenkommunikation in die KI-Antworten integrieren."
  },
  {
    name: "Zoho",
    color: "#E42527",
    angle: 135,
    logo: "/logos/apps/zoho.svg",
    description: "CRM-Daten für personalisierten Kundenservice nutzen."
  },
  {
    name: "Weitere",
    color: "#6E6E6E",
    angle: 180,
    logo: null,
    isPlus: true,
    description: "Andere Systeme auf Anfrage anbinden lassen."
  },
  {
    name: "Google Cloud",
    color: "#4285F4",
    angle: 225,
    logo: "/logos/apps/google-cloud.svg",
    description: "Cloud-Ressourcen und -Daten in die KI-Assistenz einbinden."
  },
  {
    name: "Office",
    color: "#D83B01",
    angle: 270,
    logo: "/logos/apps/office.svg",
    description: "Dokumente, Tabellen und Präsentationen in Echtzeit abfragen."
  },
  {
    name: "SQL",
    color: "#CC2927",
    angle: 315,
    logo: "/logos/apps/sql.svg",
    description: "Direkte Datenbankabfragen für aktuelle Informationen."
  }
]

// Vorteile der Live-Datenanbindung
const BENEFITS = [
  {
    title: "Aktuelle Informationen",
    description:
      "Ihre KI liefert stets aktuelle Daten direkt aus Ihren Systemen, nicht nur vorbereitetes Wissen.",
    icon: <Clock className="size-10 text-white" />
  },
  {
    title: "Personalisierte Antworten",
    description:
      "Mitarbeiter erhalten auf ihre Rolle und ihre Daten zugeschnittene, maßgeschneiderte Antworten.",
    icon: <Users className="size-10 text-white" />
  },
  {
    title: "Verbesserte Entscheidungen",
    description:
      "Durch Zugriff auf Echtzeitdaten können Mitarbeiter fundierte Entscheidungen auf Basis aktueller Fakten treffen.",
    icon: <BrainCircuit className="size-10 text-white" />
  },
  {
    title: "Sichere Integration",
    description:
      "Alle Integrationen werden sicher und konform mit Ihren Datenschutzrichtlinien implementiert.",
    icon: <Shield className="size-10 text-white" />
  }
]

// Fallback-SVG-Komponente für den Fall, dass ein Logo nicht gefunden wird
const PlaceholderSvg = ({
  color = "#cccccc",
  label
}: {
  color?: string
  label: string
}) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={label}
  >
    <circle
      cx="20"
      cy="20"
      r="18"
      fill={color}
      stroke="#444444"
      strokeWidth="1"
    />
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fill="#1e1e1e"
      fontSize="14"
      fontWeight="bold"
    >
      {label.substring(0, 2).toUpperCase()}
    </text>
  </svg>
)

export default function LiveDataPage() {
  // Simplified state - removed loading/error/isAdmin checks that are handled by the dashboard
  const [user, setUser] = useState<any>(null)

  // Tooltip state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number
    left: number
    opacity: number
  }>({ top: 0, left: 0, opacity: 0 })
  const [tooltipContent, setTooltipContent] = useState({
    title: "",
    description: ""
  })

  // Zustand für das Anfrageformular
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null
  )
  const [requestFormData, setRequestFormData] = useState({
    integration: "",
    details: "",
    contactEmail: ""
  })
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)

  const supabase = createClientComponentClient()

  // Simplified user fetch
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)

          // Pre-fill email for contact form
          setRequestFormData(prev => ({
            ...prev,
            contactEmail: session.user.email || ""
          }))
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
      }
    }
    getUser()
  }, [supabase])

  // Handler für das Anklicken einer Integration
  const handleIntegrationClick = (integrationName: string) => {
    setSelectedIntegration(integrationName)
    setRequestFormData({
      ...requestFormData,
      integration: integrationName,
      contactEmail: user?.email || ""
    })
    setShowRequestForm(true)
  }

  // Handler für das Senden einer Integrationsanfrage
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequestLoading(true)

    try {
      // Speichere die Anfrage in der Datenbank
      const { error } = await supabase.from("integration_requests").insert({
        user_id: user?.id,
        integration_name: requestFormData.integration,
        details: requestFormData.details,
        contact_email: requestFormData.contactEmail,
        status: "pending"
      })

      if (error) throw error

      // Zeige Erfolgsmeldung
      setRequestSuccess(true)

      // Reset nach 3 Sekunden
      setTimeout(() => {
        setShowRequestForm(false)
        setRequestSuccess(false)
        setRequestFormData({
          integration: "",
          details: "",
          contactEmail: ""
        })
      }, 3000)
    } catch (err) {
      console.error("Error submitting integration request:", err)
    } finally {
      setRequestLoading(false)
    }
  }

  // Updated tooltip handler
  const handleTooltipShow = (
    name: string,
    description: string,
    event: React.MouseEvent
  ) => {
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const tooltipHeight = 80 // Approximate height
    const tooltipWidth = 250 // Approximate width

    let top = rect.bottom + window.scrollY + 10 // Position below target
    let left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2 // Center tooltip

    // Adjust if tooltip goes off-screen vertically
    if (top + tooltipHeight > window.innerHeight + window.scrollY - 20) {
      top = rect.top - tooltipHeight + window.scrollY - 10 // Position above target
    }

    // Adjust if tooltip goes off-screen horizontally
    if (left < 10) {
      left = 10
    } else if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10
    }

    setTooltipPosition({ top, left, opacity: 1 })
    setTooltipContent({ title: name, description })
    setActiveTooltip(name)
  }

  const handleTooltipHide = () => {
    setTooltipPosition(prev => ({ ...prev, opacity: 0 }))
    // Keep activeTooltip set for a short duration to allow fade-out
    setTimeout(() => {
      if (tooltipPosition.opacity === 0) {
        // Only hide if opacity is still 0 (user hasn't hovered again)
        setActiveTooltip(null)
      }
    }, 150) // Corresponds to transition duration
  }

  return (
    <div className="overflow-x-hidden bg-[#1e1e1e] text-neutral-200">
      <main className="px-4 pb-12">
        {/* Integrations Wheel Section */}
        <section className="relative mb-12 sm:mb-16">
          <div className="relative mx-auto flex h-[400px] items-center justify-center">
            {/* Das Rad und die Linien (optional, kann vereinfacht werden) */}
            <div className="absolute size-[300px] animate-spin-slow rounded-full border border-neutral-700/50 sm:size-[350px]"></div>
            <div className="absolute size-[200px] rounded-full border border-neutral-800/60 sm:size-[250px]"></div>

            {/* Central Element */}
            <div className="absolute z-10 flex flex-col items-center rounded-full border border-neutral-700/60 bg-neutral-800/50 p-4 shadow-lg backdrop-blur-sm">
              <Zap className="mb-1 size-10 text-indigo-400" />
              <span className="text-xs font-semibold text-neutral-200">
                KI-Assistent
              </span>
            </div>

            {/* Integration Icons */}
            {INTEGRATIONS.map((integration, index) => {
              const angleRad = (integration.angle * Math.PI) / 180
              // Adjust radius based on screen size if needed, using a more compact radius
              const radius = 170 // Reduced radius for more compact fit
              const x = radius * Math.cos(angleRad)
              const y = radius * Math.sin(angleRad)

              return (
                <div
                  key={integration.name}
                  className="group absolute cursor-pointer transition-transform duration-300 ease-out hover:scale-110"
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                  onMouseEnter={e =>
                    handleTooltipShow(
                      integration.name,
                      integration.description,
                      e
                    )
                  }
                  onMouseLeave={handleTooltipHide}
                  onClick={() => handleIntegrationClick(integration.name)}
                >
                  <div className="relative flex size-12 items-center justify-center rounded-full border border-neutral-700/50 bg-neutral-800/70 shadow-md backdrop-blur-sm transition-colors group-hover:border-indigo-500/70 sm:size-14">
                    {integration.isPlus ? (
                      <Plus className="size-5 text-neutral-400 sm:size-6" />
                    ) : integration.logo ? (
                      <Image
                        src={integration.logo}
                        alt={`${integration.name} Logo`}
                        width={28}
                        height={28}
                        className="object-contain sm:size-8"
                        onError={e => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <PlaceholderSvg
                        label={integration.name}
                        color={integration.color}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
        {/* Tooltip Element */}
        {activeTooltip && (
          <div
            style={{
              position: "absolute",
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              opacity: tooltipPosition.opacity,
              transition: "opacity 0.15s ease-out",
              pointerEvents: "none"
            }}
            className="z-50 max-w-xs rounded-md border border-neutral-600 bg-neutral-700 p-3 text-sm shadow-lg"
          >
            <h4 className="mb-1 font-semibold text-neutral-100">
              {tooltipContent.title}
            </h4>
            <p className="text-neutral-300">{tooltipContent.description}</p>
          </div>
        )}

        {/* Benefits Section - With elegant white icons as requested */}
        <section className="mx-auto mb-16">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-neutral-200 sm:text-3xl">
            Vorteile der Live-Datenanbindung
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(benefit => (
              <div
                key={benefit.title}
                className="rounded-xl border border-neutral-700/60 bg-neutral-800/50 p-5 text-center transition-all duration-300 hover:scale-[1.02] hover:border-neutral-600 hover:bg-neutral-700/60"
              >
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full border border-neutral-600 bg-gradient-to-br from-neutral-700 to-neutral-800 p-3">
                    {React.cloneElement(benefit.icon, {
                      className: "w-8 h-8 text-white"
                    })}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-medium text-neutral-200">
                  {benefit.title}
                </h3>
                <p className="text-sm text-neutral-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Integration Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-neutral-700 bg-neutral-800 p-6 shadow-2xl">
            <button
              onClick={() => setShowRequestForm(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-100"
              aria-label="Schließen"
            >
              <X className="size-5" />
            </button>

            {requestSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
                <h3 className="mb-2 text-xl font-semibold text-neutral-100">
                  Anfrage gesendet!
                </h3>
                <p className="text-neutral-300">
                  Vielen Dank. Wir werden uns in Kürze bei Ihnen melden.
                </p>
              </div>
            ) : (
              <>
                <h3 className="mb-6 text-xl font-semibold text-neutral-100">
                  Integrationsanfrage für: {selectedIntegration || "Allgemein"}
                </h3>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <label
                      htmlFor="integrationDetails"
                      className="mb-1 block text-sm font-medium text-neutral-300"
                    >
                      Details zur gewünschten Integration
                    </label>
                    <textarea
                      id="integrationDetails"
                      value={requestFormData.details}
                      onChange={e =>
                        setRequestFormData({
                          ...requestFormData,
                          details: e.target.value
                        })
                      }
                      rows={4}
                      className="w-full rounded-md border border-neutral-600 bg-neutral-700/50 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Beschreiben Sie kurz, welches System Sie anbinden möchten und welche Daten relevant sind."
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contactEmail"
                      className="mb-1 block text-sm font-medium text-neutral-300"
                    >
                      Ihre E-Mail-Adresse für Rückfragen
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      value={requestFormData.contactEmail}
                      onChange={e =>
                        setRequestFormData({
                          ...requestFormData,
                          contactEmail: e.target.value
                        })
                      }
                      className="w-full rounded-md border border-neutral-600 bg-neutral-700/50 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="beispiel@firma.de"
                      required
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={requestLoading}
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requestLoading ? (
                        <>
                          <svg
                            className="-ml-1 mr-3 size-5 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Sende...
                        </>
                      ) : (
                        "Anfrage senden"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
