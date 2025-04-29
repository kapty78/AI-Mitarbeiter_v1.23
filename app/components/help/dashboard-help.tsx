"use client"

import React, { useState, useRef, useEffect, ReactNode } from "react"
import {
  BarChart2,
  MessageCircle,
  FileText,
  Layers,
  Database,
  BookOpen,
  HelpCircle,
  Calendar,
  Award,
  ArrowRightCircle,
  X,
  User,
  LogOut,
  Settings,
  ChevronDown
} from "lucide-react"

interface HelpTooltipProps {
  title: string
  description: string
  isOpen: boolean
  onClose: () => void
  position?: "top" | "right" | "bottom" | "left"
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  description,
  isOpen,
  onClose,
  position = "right"
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative z-[1000] w-80 max-w-[90%] rounded-lg border border-[#555555] bg-[#333333] p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-300">{description}</p>
      </div>
    </div>
  )
}

interface InfoAreaProps {
  title: string
  items: {
    label: string
    description: string
  }[]
}

export default function DashboardHelp() {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const handleTooltipToggle = (tooltipId: string) => {
    setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId)
  }

  // Stats data
  const stats = [
    { label: "Nachrichten", value: "0", change: "+0%", increased: false },
    {
      label: "Aufgaben",
      value: "2",
      change: "+0% vs. letzte Periode",
      increased: false
    },
    {
      label: "Dateien",
      value: "0",
      change: "+0% vs. letzte Periode",
      increased: false
    },
    {
      label: "Nutzungszeit",
      value: "0h",
      change: "+100% vs. letzte Periode",
      increased: true
    }
  ]

  // Interface for quick access buttons
  interface QuickAccessButton {
    label: string
    description: string
    icon: ReactNode
  }

  // Quick access buttons data
  const quickAccessButtons: QuickAccessButton[] = [
    {
      label: "Dokumentation",
      description:
        "Zugriff auf die umfassende Dokumentation der Plattform mit detaillierten Anleitungen.",
      icon: <BookOpen size={32} className="text-gray-300" />
    },
    {
      label: "Support kontaktieren",
      description:
        "Hier können Sie direkt mit dem Support-Team Kontakt aufnehmen bei Fragen oder Problemen.",
      icon: <HelpCircle size={32} className="text-gray-300" />
    },
    {
      label: "Neuerungen",
      description:
        "Informationen zu den neuesten Updates, Funktionen und Verbesserungen der Plattform.",
      icon: <Calendar size={32} className="text-gray-300" />
    },
    {
      label: "Upgrade Plan",
      description:
        "Informationen zu verfügbaren Upgrade-Optionen und Premium-Funktionen der Plattform.",
      icon: <Award size={32} className="text-gray-300" />
    }
  ]

  interface ActivityItem {
    id: string
    name: string
    type: string
    date: string
    icon: React.ReactNode
  }

  const recentActivities: ActivityItem[] = []

  const infoAreas: InfoAreaProps[] = [
    {
      title: "Statistik-Bereich",
      items: [
        {
          label: "Statistik-Karten",
          description:
            "Zeigen Kennzahlen und Trends zu Ihrer Nutzung an. Die Prozentwerte vergleichen den aktuellen Zeitraum mit dem vorherigen."
        },
        {
          label: "Nachrichten",
          description:
            "Zeigt die Anzahl der Nachrichten und Chat-Interaktionen in Ihrem Workspace."
        },
        {
          label: "Aufgaben",
          description:
            "Zeigt die Anzahl der Aufgaben, die Ihnen zugewiesen sind oder die Sie erstellt haben."
        },
        {
          label: "Dateien",
          description:
            "Zeigt die Anzahl der Dateien, die in Ihrem Workspace gespeichert sind."
        },
        {
          label: "Nutzungszeit",
          description:
            "Zeigt Ihre gesamte Nutzungszeit der Plattform im aktuellen Zeitraum."
        }
      ]
    },
    {
      title: "Aktivitäten-Bereich",
      items: [
        {
          label: "Aktivitätsliste",
          description:
            "Zeigt Ihre letzten Aktivitäten und Änderungen in chronologischer Reihenfolge."
        },
        {
          label: "Aktivitätstypen",
          description:
            "Verschiedene Icons zeigen den Typ der Aktivität an (Nachricht, Datei, Projekt, etc.)."
        },
        {
          label: "Zeitstempel",
          description: "Zeigt an, wann die Aktivität stattgefunden hat."
        },
        {
          label: "Detailansicht",
          description:
            "Klicken Sie auf den Pfeil, um mehr Details zur Aktivität anzuzeigen."
        }
      ]
    },
    {
      title: "Schnellzugriff-Bereich",
      items: [
        {
          label: "Dokumentation",
          description:
            "Schneller Zugriff auf ausführliche Dokumentation zur Plattform."
        },
        {
          label: "Support",
          description:
            "Direkter Kontakt zum Support-Team bei Fragen oder Problemen."
        },
        {
          label: "Neuerungen",
          description:
            "Informationen zu neuen Funktionen und Updates der Plattform."
        },
        {
          label: "Upgrade",
          description:
            "Informationen zu verfügbaren Plänen und Upgrade-Optionen."
        }
      ]
    },
    {
      title: "Workspace-Bereich",
      items: [
        {
          label: "Workspace-Auswahl",
          description:
            "Hier sehen Sie den aktuellen Workspace und können zwischen verschiedenen Workspaces wechseln."
        },
        {
          label: "Workspace-Mitglieder",
          description:
            "Verwalten Sie die Mitglieder Ihres Workspaces, laden Sie neue Benutzer ein und bearbeiten Sie Berechtigungen."
        },
        {
          label: "Neuer Workspace",
          description:
            "Erstellen Sie einen neuen Workspace für verschiedene Projekte oder Teams."
        },
        {
          label: "Workspace-Einstellungen",
          description:
            "Bearbeiten Sie die Einstellungen des aktuellen Workspaces, wie Name und Beschreibung."
        }
      ]
    },
    {
      title: "Navigations-Bereich",
      items: [
        {
          label: "Übersicht",
          description:
            "Zeigt das Dashboard mit allen wichtigen Informationen und Kennzahlen."
        },
        {
          label: "Chat",
          description:
            "Öffnet den Chat-Bereich für Konversationen mit KI-Assistenten und Teammitgliedern."
        },
        {
          label: "Tasks",
          description:
            "Zeigt Ihre Aufgabenliste und ermöglicht die Verwaltung von To-Dos."
        },
        {
          label: "Projekte",
          description: "Zugriff auf alle Ihre Projekte und deren Verwaltung."
        },
        {
          label: "Workspaces",
          description:
            "Zeigt eine Liste aller Workspaces, in denen Sie Mitglied sind."
        },
        {
          label: "Live Daten",
          description:
            "Zeigt Echtzeit-Daten und -Analysen zu Ihren Projekten und Aktivitäten."
        },
        {
          label: "Wissensdatenbank",
          description:
            "Bietet Zugriff auf die zentrale Wissensdatenbank für Ihr Team."
        },
        {
          label: "Hilfe",
          description:
            "Öffnet diese Hilfesektion mit Erklärungen zu allen Funktionen der Plattform."
        },
        {
          label: "Aktivität",
          description:
            "Zeigt eine Übersicht aller Aktivitäten in Ihren Workspaces."
        },
        {
          label: "Admin",
          description:
            "Zugriff auf Admin-Funktionen (nur für Administratoren sichtbar)."
        }
      ]
    },
    {
      title: "Benutzer-Bereich",
      items: [
        {
          label: "Benutzer-Profil",
          description:
            "Zeigt Ihre E-Mail-Adresse und ermöglicht den Zugriff auf Ihre persönlichen Einstellungen."
        },
        {
          label: "Abmelden",
          description:
            "Beendet Ihre aktuelle Sitzung und meldet Sie vom System ab."
        }
      ]
    }
  ]

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Dashboard Hilfe</h2>
      <p className="mb-8 text-gray-300">
        Das Dashboard bietet Ihnen einen umfassenden Überblick über alle
        wichtigen Informationen und Aktivitäten. Klicken Sie auf die
        verschiedenen Elemente unten, um mehr über ihre Funktionen zu erfahren.
      </p>

      {/* Complete Dashboard Mockup */}
      <div className="mb-8 flex overflow-hidden rounded-lg border border-[#444444] bg-[#1e1e1e]">
        {/* Sidebar */}
        <div className="relative flex h-[600px] w-56 flex-col border-r border-[#444444] bg-[#121212]">
          <button
            onClick={() => handleTooltipToggle("sidebar")}
            className="absolute right-4 top-4 z-10 rounded-full bg-[#444444] p-1 transition-colors hover:bg-[#555555]"
            title="Info zur Seitenleiste"
          >
            <HelpCircle size={12} className="text-white" />
          </button>

          <HelpTooltip
            title="Seitenleiste"
            description="Hier finden Sie die Navigation zu allen Bereichen der Plattform sowie Ihre Workspace-Übersicht."
            isOpen={activeTooltip === "sidebar"}
            onClose={() => setActiveTooltip(null)}
            position="right"
          />

          {/* Logo/Brand */}
          <div className="relative border-b border-[#333333] p-4">
            <button
              onClick={() => handleTooltipToggle("logo")}
              className="absolute right-4 top-4 z-10 rounded-full bg-[#444444] p-1 transition-colors hover:bg-[#555555]"
              title="Info zum Logo"
            >
              <HelpCircle size={12} className="text-white" />
            </button>

            <HelpTooltip
              title="Logo/Marke"
              description="Das Logo und der Markenname Ihrer Organisation oder des Systems."
              isOpen={activeTooltip === "logo"}
              onClose={() => setActiveTooltip(null)}
              position="right"
            />

            <div className="flex items-center space-x-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-purple-600 font-bold text-white">
                A
              </div>
              <span className="text-sm font-semibold text-white">
                MITARBEITER
              </span>
            </div>
          </div>

          {/* Workspace Selector */}
          <div className="relative border-b border-[#333333] p-4">
            <button
              onClick={() => handleTooltipToggle("workspace-selector")}
              className="absolute right-4 top-4 z-10 rounded-full bg-[#444444] p-1 transition-colors hover:bg-[#555555]"
              title="Info zur Workspace-Auswahl"
            >
              <HelpCircle size={12} className="text-white" />
            </button>

            <HelpTooltip
              title="Workspace-Auswahl"
              description="Hier können Sie Ihre Workspaces verwalten und zwischen ihnen wechseln."
              isOpen={activeTooltip === "workspace-selector"}
              onClose={() => setActiveTooltip(null)}
              position="right"
            />

            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              WORKSPACES
            </h3>
            <div className="mb-2 flex items-center justify-between rounded-md bg-[#252525] p-2">
              <span className="text-sm">Workspace Tom</span>
            </div>
            <button className="flex w-full items-center justify-center space-x-2 rounded-md py-1 text-sm transition-colors hover:bg-[#252525]">
              <span>+</span>
              <span>Neuer Workspace</span>
            </button>
          </div>

          {/* Navigation */}
          <div className="relative grow overflow-y-auto p-4">
            <button
              onClick={() => handleTooltipToggle("navigation")}
              className="absolute right-4 top-4 z-10 rounded-full bg-[#444444] p-1 transition-colors hover:bg-[#555555]"
              title="Info zur Navigation"
            >
              <HelpCircle size={12} className="text-white" />
            </button>

            <HelpTooltip
              title="Navigation"
              description="Die Hauptnavigation, über die Sie auf alle Bereiche der Anwendung zugreifen können."
              isOpen={activeTooltip === "navigation"}
              onClose={() => setActiveTooltip(null)}
              position="bottom"
            />

            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              NAVIGATION
            </h3>
            <nav className="space-y-1">
              <div className="flex items-center rounded-md bg-white/10 px-3 py-2 text-sm text-white">
                <BarChart2 size={16} className="mr-3" /> Übersicht
              </div>
              <div className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                <MessageCircle size={16} className="mr-3" /> Chat
              </div>
              <div className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                <FileText size={16} className="mr-3" /> Tasks
              </div>
              <div className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                <Layers size={16} className="mr-3" /> Projekte
              </div>
              <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                <div className="flex items-center">
                  <Layers size={16} className="mr-3" /> Workspaces
                </div>
                <ChevronDown size={16} />
              </div>
              <div className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                <FileText size={16} className="mr-3" /> Live Daten
              </div>
              <div className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                <Database size={16} className="mr-3" /> Wissensdatenbank
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="relative border-t border-[#333333] p-4">
            <button
              onClick={() => handleTooltipToggle("sidebar-footer")}
              className="absolute right-4 top-4 z-10 rounded-full bg-[#444444] p-1 transition-colors hover:bg-[#555555]"
              title="Info zum Seitenleistenfuß"
            >
              <HelpCircle size={12} className="text-white" />
            </button>

            <HelpTooltip
              title="Seitenleistenfuß"
              description="Hier finden Sie Hilfefunktionen, Ihr Benutzerprofil und die Abmelden-Option."
              isOpen={activeTooltip === "sidebar-footer"}
              onClose={() => setActiveTooltip(null)}
              position="right"
            />

            <nav className="mb-4 space-y-1">
              <div className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                <HelpCircle size={16} className="mr-3" /> Hilfe
              </div>
              <div className="flex items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                <Settings size={16} className="mr-3" /> Admin
              </div>
            </nav>
            <div className="border-t border-[#444444] pt-4">
              <div className="mb-3 flex items-center">
                <User size={20} className="mr-2 text-gray-400" />
                <span className="truncate text-sm">tom.pierce@ecomtask.de</span>
              </div>
              <button className="flex w-full items-center justify-center rounded-md border border-[#444444] bg-transparent px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
                <LogOut size={16} className="mr-2" /> Abmelden
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex grow flex-col">
          {/* Header */}
          <div className="relative border-b border-[#444444] p-6">
            <button
              onClick={() => handleTooltipToggle("dashboard-header")}
              className="absolute right-6 top-6 z-10 rounded-full bg-[#444444] p-1.5 transition-colors hover:bg-[#555555]"
              title="Info zum Dashboard-Header"
            >
              <HelpCircle size={14} className="text-white" />
            </button>

            <HelpTooltip
              title="Dashboard-Header"
              description="Hier sehen Sie den Namen des aktuellen Workspaces und weitere Informationen."
              isOpen={activeTooltip === "dashboard-header"}
              onClose={() => setActiveTooltip(null)}
              position="bottom"
            />

            <div className="flex items-start justify-between">
              <div>
                <h1 className="mb-1 text-2xl font-semibold text-white">
                  Willkommen zurück!
                </h1>
                <p className="text-sm text-gray-400">
                  Hier ist deine Übersicht für Workspace Tom.
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={() => handleTooltipToggle("member-manager")}
                  className="absolute -left-6 -top-2 z-10 rounded-full bg-[#444444] p-1.5 transition-colors hover:bg-[#555555]"
                  title="Info zur Mitgliederverwaltung"
                >
                  <HelpCircle size={14} className="text-white" />
                </button>

                <HelpTooltip
                  title="Workspace-Mitgliederverwaltung"
                  description="Hier können Sie Mitglieder zu Ihrem Workspace einladen und Berechtigungen verwalten."
                  isOpen={activeTooltip === "member-manager"}
                  onClose={() => setActiveTooltip(null)}
                  position="left"
                />

                <button className="flex items-center rounded-md border border-[#444444] bg-[#252525] px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-[#333333]">
                  <div className="mr-2 flex -space-x-2">
                    <div className="flex size-6 items-center justify-center rounded-full border-2 border-[#252525] bg-blue-500 text-xs text-white">
                      T
                    </div>
                    <div className="flex size-6 items-center justify-center rounded-full border-2 border-[#252525] bg-green-500 text-xs text-white">
                      A
                    </div>
                  </div>
                  Mitglieder verwalten
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grow overflow-y-auto p-6">
            {/* Stats Grid Section */}
            <div className="relative mb-6">
              <button
                onClick={() => handleTooltipToggle("stats")}
                className="absolute right-2 top-0 z-10 rounded-full bg-[#444444] p-1.5 transition-colors hover:bg-[#555555]"
                title="Info zum Statistik-Bereich"
              >
                <HelpCircle size={14} className="text-white" />
              </button>

              <HelpTooltip
                title="Statistik-Bereich"
                description="Hier sehen Sie verschiedene Kennzahlen und Statistiken zu Ihrer Nutzung der Plattform."
                isOpen={activeTooltip === "stats"}
                onClose={() => setActiveTooltip(null)}
                position="top"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg border border-[#444444] bg-[#252525] p-5"
                  >
                    <button
                      onClick={() => handleTooltipToggle(`stat-${index}`)}
                      className="absolute right-2 top-2 rounded-full bg-[#333333] p-1 text-gray-400 transition-colors hover:text-white"
                      title={`Info zu ${stat.label}`}
                    >
                      <HelpCircle size={12} className="text-white" />
                    </button>

                    <HelpTooltip
                      title={stat.label}
                      description={
                        infoAreas[0].items.find(
                          item => item.label === stat.label
                        )?.description || ""
                      }
                      isOpen={activeTooltip === `stat-${index}`}
                      onClose={() => setActiveTooltip(null)}
                    />

                    <p className="mb-1 text-sm text-gray-400">{stat.label}</p>
                    <p className="mb-2 text-2xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-gray-400">
                      <span
                        className={
                          stat.increased ? "text-green-400" : "text-gray-400"
                        }
                      >
                        {stat.change}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities and Quick Access Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Recent Activity */}
              <div className="relative rounded-lg border border-[#444444] bg-[#252525] p-6 lg:col-span-2">
                <button
                  onClick={() => handleTooltipToggle("activities")}
                  className="absolute right-2 top-2 rounded-full bg-[#333333] p-1 text-gray-400 transition-colors hover:text-white"
                  title="Info zum Aktivitäten-Bereich"
                >
                  <HelpCircle size={14} className="text-white" />
                </button>

                <HelpTooltip
                  title="Aktivitäten-Bereich"
                  description="Hier sehen Sie Ihre letzten Aktivitäten und Änderungen in chronologischer Reihenfolge."
                  isOpen={activeTooltip === "activities"}
                  onClose={() => setActiveTooltip(null)}
                />

                <h2 className="mb-4 text-xl font-semibold">
                  Letzte Aktivitäten
                </h2>
                {recentActivities.length > 0 ? (
                  <ul className="space-y-4">
                    {recentActivities.map(activity => (
                      <li
                        key={activity.id}
                        className="relative flex items-center space-x-3 text-sm"
                      >
                        <button
                          onClick={() =>
                            handleTooltipToggle(`activity-${activity.id}`)
                          }
                          className="absolute right-0 top-0 text-gray-400 transition-colors hover:text-white"
                          title="Info zur Aktivität"
                        >
                          <HelpCircle size={14} className="text-white" />
                        </button>

                        <HelpTooltip
                          title="Aktivitätseintrag"
                          description="Ein Eintrag zeigt Ihnen, welche Aktion wann durchgeführt wurde. Der Pfeil rechts führt zu den Details."
                          isOpen={activeTooltip === `activity-${activity.id}`}
                          onClose={() => setActiveTooltip(null)}
                        />

                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#444444] bg-[#2d2d2d] text-gray-300">
                          {activity.icon}
                        </span>
                        <div className="grow">
                          <p className="text-white">
                            <span className="font-medium">{activity.name}</span>{" "}
                            wurde {activity.type}.
                          </p>
                          <p className="text-xs text-gray-400">
                            {activity.date}
                          </p>
                        </div>
                        <ArrowRightCircle
                          size={18}
                          className="text-gray-500 transition-colors hover:text-white"
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-gray-400">
                    Keine kürzlichen Aktivitäten gefunden.
                  </p>
                )}
              </div>

              {/* Quick Access */}
              <div className="relative rounded-lg border border-[#444444] bg-[#252525] p-6">
                <button
                  onClick={() => handleTooltipToggle("quick-access")}
                  className="absolute right-2 top-2 rounded-full bg-[#333333] p-1 text-gray-400 transition-colors hover:text-white"
                  title="Info zum Schnellzugriff"
                >
                  <HelpCircle size={14} className="text-white" />
                </button>

                <HelpTooltip
                  title="Schnellzugriff"
                  description="Greifen Sie schnell auf wichtige Funktionen und Ressourcen zu."
                  isOpen={activeTooltip === "quick-access"}
                  onClose={() => setActiveTooltip(null)}
                />

                <h2 className="mb-4 text-xl font-semibold">Schnellzugriff</h2>
                <div className="grid grid-cols-2 gap-4">
                  {quickAccessButtons.map(
                    (button: QuickAccessButton, index: number) => (
                      <div
                        key={button.label}
                        className="relative flex h-[70px] flex-col items-center justify-center rounded-lg bg-[#333333] p-3 text-center transition-colors hover:bg-[#444444]"
                      >
                        <button
                          onClick={() => handleTooltipToggle(`quick-${index}`)}
                          className="absolute right-1 top-1 z-10 rounded-full p-1 text-gray-400 transition-colors hover:text-white"
                          title={button.label}
                        >
                          <HelpCircle size={12} className="text-white" />
                        </button>

                        <HelpTooltip
                          title={button.label}
                          description={button.description}
                          isOpen={activeTooltip === `quick-${index}`}
                          onClose={() => setActiveTooltip(null)}
                          position="top"
                        />

                        {button.icon}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
