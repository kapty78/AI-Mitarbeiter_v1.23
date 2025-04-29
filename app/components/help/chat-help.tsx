"use client"

import React, { useState } from "react"
import {
  MessageCircle,
  Send,
  Paperclip,
  Settings,
  MoreVertical,
  User,
  X,
  HelpCircle,
  PlusCircle,
  Clock
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

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    right: "left-full top-0 ml-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-0 mr-2"
  }

  return (
    <div
      className={`absolute z-50 w-64 rounded-lg border border-[#555555] bg-[#333333] p-3 ${positionClasses[position]}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  )
}

interface ChatMessage {
  id: string
  sender: "user" | "assistant"
  content: string
  timestamp: string
}

const ChatHelp: React.FC = () => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const handleTooltipToggle = (id: string) => {
    setActiveTooltip(activeTooltip === id ? null : id)
  }

  const chatMessages: ChatMessage[] = [
    {
      id: "msg1",
      sender: "user",
      content: "Hallo! Kannst du mir bei der Analyse der Marktdaten helfen?",
      timestamp: "10:15"
    },
    {
      id: "msg2",
      sender: "assistant",
      content:
        "Natürlich! Welche Art von Marktdaten möchtest du analysieren? Ich kann bei Trends, Wettbewerbsanalysen oder Kundensegmentierung helfen.",
      timestamp: "10:16"
    },
    {
      id: "msg3",
      sender: "user",
      content:
        "Wir haben Daten zu Kundenverhalten der letzten 3 Monate. Kannst du mir helfen, Muster zu erkennen?",
      timestamp: "10:18"
    },
    {
      id: "msg4",
      sender: "assistant",
      content:
        "Gerne! Um Muster im Kundenverhalten zu erkennen, sollten wir uns auf folgende Aspekte konzentrieren:\n\n1. Kauffrequenz\n2. Durchschnittlicher Bestellwert\n3. Bevorzugte Produkte\n4. Tageszeit/Wochentag der Käufe\n\nMöchtest du mit einem dieser Bereiche beginnen?",
      timestamp: "10:20"
    }
  ]

  const infoSections = [
    {
      title: "Chat-Interface",
      items: [
        {
          label: "Chat-Bereich",
          description:
            "Der Hauptbereich, in dem Nachrichten zwischen Ihnen und dem KI-Assistenten oder Teammitgliedern angezeigt werden."
        },
        {
          label: "Nachrichtenverlauf",
          description:
            "Hier werden alle Nachrichten chronologisch angezeigt, mit den neuesten Nachrichten am unteren Ende."
        },
        {
          label: "Eingabefeld",
          description:
            "Hier können Sie Ihre Nachrichten eingeben und an den Chat senden."
        },
        {
          label: "Senden-Button",
          description:
            "Klicken Sie hier, um Ihre Nachricht zu senden. Sie können auch die Enter-Taste drücken."
        }
      ]
    },
    {
      title: "Chat-Funktionen",
      items: [
        {
          label: "Neuer Chat",
          description:
            "Erstellen Sie eine neue Chat-Unterhaltung, um ein neues Thema zu beginnen."
        },
        {
          label: "Dateien anhängen",
          description:
            "Fügen Sie dem Chat Dateien hinzu, um sie mit Ihrem Gesprächspartner zu teilen."
        },
        {
          label: "Chat-Einstellungen",
          description:
            "Passen Sie die Chat-Einstellungen an, wie z.B. Benachrichtigungen oder Datenschutzoptionen."
        },
        {
          label: "Chatverlauf",
          description:
            "Sehen Sie alle Ihre vergangenen Unterhaltungen und greifen Sie schnell darauf zu."
        }
      ]
    }
  ]

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Chat Hilfe</h2>
      <p className="mb-8 text-gray-300">
        Der Chat-Bereich ermöglicht Ihnen die direkte Kommunikation mit
        KI-Assistenten und Teammitgliedern. Klicken Sie auf die verschiedenen
        Elemente unten, um mehr über ihre Funktionen zu erfahren.
      </p>

      {/* Chat Interface Mockup */}
      <div className="mb-8 flex h-[600px] flex-col overflow-hidden rounded-lg border border-[#444444] bg-[#1e1e1e]">
        {/* Chat Header */}
        <div className="relative flex items-center justify-between border-b border-[#444444] bg-[#252525] p-4">
          <button
            onClick={() => handleTooltipToggle("header")}
            className="absolute right-2 top-2 text-gray-400 transition-colors hover:text-white"
            title="Info zum Chat-Header"
          >
            <HelpCircle size={14} />
          </button>

          <HelpTooltip
            title="Chat-Header"
            description="Zeigt Informationen zum aktuellen Chat an, einschließlich des Namens und Status."
            isOpen={activeTooltip === "header"}
            onClose={() => setActiveTooltip(null)}
          />

          <div className="flex items-center space-x-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-medium">Marktanalyse Projekt</h3>
              <p className="text-xs text-gray-400">KI-Assistent • Aktiv</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="relative rounded-md p-2 transition-colors hover:bg-[#333333]">
              <Clock size={18} />

              <button
                onClick={e => {
                  e.stopPropagation()
                  handleTooltipToggle("chat-history")
                }}
                className="absolute -right-1 -top-1 z-10 rounded-full bg-blue-500 p-1"
                title="Info zum Chatverlauf"
              >
                <HelpCircle size={10} />
              </button>

              <HelpTooltip
                title="Chatverlauf"
                description="Zeigt die Historie vergangener Unterhaltungen an. Hier können Sie zu früheren Gesprächen zurückkehren."
                isOpen={activeTooltip === "chat-history"}
                onClose={() => setActiveTooltip(null)}
                position="bottom"
              />
            </button>

            <button className="relative rounded-md p-2 transition-colors hover:bg-[#333333]">
              <Settings size={18} />

              <button
                onClick={e => {
                  e.stopPropagation()
                  handleTooltipToggle("chat-settings")
                }}
                className="absolute -right-1 -top-1 z-10 rounded-full bg-blue-500 p-1"
                title="Info zu Chat-Einstellungen"
              >
                <HelpCircle size={10} />
              </button>

              <HelpTooltip
                title="Chat-Einstellungen"
                description="Hier können Sie chat-spezifische Einstellungen anpassen, wie Benachrichtigungen oder Datenschutzoptionen."
                isOpen={activeTooltip === "chat-settings"}
                onClose={() => setActiveTooltip(null)}
                position="bottom"
              />
            </button>

            <button className="relative rounded-md p-2 transition-colors hover:bg-[#333333]">
              <MoreVertical size={18} />

              <button
                onClick={e => {
                  e.stopPropagation()
                  handleTooltipToggle("chat-more")
                }}
                className="absolute -right-1 -top-1 z-10 rounded-full bg-blue-500 p-1"
                title="Info zu weiteren Optionen"
              >
                <HelpCircle size={10} />
              </button>

              <HelpTooltip
                title="Weitere Optionen"
                description="Öffnet ein Menü mit zusätzlichen Aktionen wie Chat teilen, löschen oder exportieren."
                isOpen={activeTooltip === "chat-more"}
                onClose={() => setActiveTooltip(null)}
                position="bottom"
              />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="relative grow overflow-y-auto bg-[#1e1e1e] p-4">
          <button
            onClick={() => handleTooltipToggle("messages-area")}
            className="absolute right-2 top-2 z-10 rounded-full bg-blue-500 p-1.5 transition-colors hover:bg-blue-600"
            title="Info zum Nachrichtenbereich"
          >
            <HelpCircle size={14} />
          </button>

          <HelpTooltip
            title="Nachrichtenbereich"
            description="Hier werden alle Nachrichten im Verlauf angezeigt. Der Verlauf wird automatisch gespeichert und kann später durchsucht werden."
            isOpen={activeTooltip === "messages-area"}
            onClose={() => setActiveTooltip(null)}
          />

          <div className="space-y-4">
            {chatMessages.map(message => (
              <div
                key={message.id}
                className={`relative flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <button
                  onClick={() => handleTooltipToggle(`message-${message.id}`)}
                  className={`absolute ${message.sender === "user" ? "left-0" : "right-0"} top-0 z-10 rounded-full bg-blue-500 p-1 transition-colors hover:bg-blue-600`}
                  title="Info zur Nachricht"
                >
                  <HelpCircle size={12} />
                </button>

                <HelpTooltip
                  title={
                    message.sender === "user"
                      ? "Benutzernachricht"
                      : "Assistentennachricht"
                  }
                  description={
                    message.sender === "user"
                      ? "Ihre gesendeten Nachrichten werden auf der rechten Seite angezeigt."
                      : "Antworten vom KI-Assistenten oder von Teammitgliedern werden auf der linken Seite angezeigt."
                  }
                  isOpen={activeTooltip === `message-${message.id}`}
                  onClose={() => setActiveTooltip(null)}
                  position={message.sender === "user" ? "left" : "right"}
                />

                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-[#444444] bg-[#252525]"
                  }`}
                >
                  <div className="mb-1 whitespace-pre-line">
                    {message.content}
                  </div>
                  <div className="text-right text-xs opacity-70">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="relative border-t border-[#444444] bg-[#252525] p-4">
          <button
            onClick={() => handleTooltipToggle("input-area")}
            className="absolute -top-3 right-2 z-10 rounded-full bg-blue-500 p-1.5 transition-colors hover:bg-blue-600"
            title="Info zum Eingabebereich"
          >
            <HelpCircle size={14} />
          </button>

          <HelpTooltip
            title="Eingabebereich"
            description="Hier können Sie Ihre Nachrichten eingeben und an den Chat senden. Verwenden Sie die Buttons für zusätzliche Funktionen."
            isOpen={activeTooltip === "input-area"}
            onClose={() => setActiveTooltip(null)}
            position="top"
          />

          <div className="flex items-center space-x-2">
            <button className="relative rounded-full p-2 transition-colors hover:bg-[#333333]">
              <PlusCircle size={20} />

              <button
                onClick={e => {
                  e.stopPropagation()
                  handleTooltipToggle("new-chat")
                }}
                className="absolute -right-1 -top-1 z-10 rounded-full bg-blue-500 p-1"
                title="Info zu Neuer Chat"
              >
                <HelpCircle size={10} />
              </button>

              <HelpTooltip
                title="Neuer Chat"
                description="Erstellen Sie eine neue Chat-Unterhaltung für ein neues Thema oder mit einer anderen Person."
                isOpen={activeTooltip === "new-chat"}
                onClose={() => setActiveTooltip(null)}
                position="top"
              />
            </button>

            <button className="relative rounded-full p-2 transition-colors hover:bg-[#333333]">
              <Paperclip size={20} />

              <button
                onClick={e => {
                  e.stopPropagation()
                  handleTooltipToggle("attach-file")
                }}
                className="absolute -right-1 -top-1 z-10 rounded-full bg-blue-500 p-1"
                title="Info zu Datei anhängen"
              >
                <HelpCircle size={10} />
              </button>

              <HelpTooltip
                title="Datei anhängen"
                description="Fügen Sie dem Chat Dateien wie Dokumente, Bilder oder andere Medien hinzu."
                isOpen={activeTooltip === "attach-file"}
                onClose={() => setActiveTooltip(null)}
                position="top"
              />
            </button>

            <div className="relative grow rounded-full border border-[#444444] bg-[#333333] px-4 py-2">
              <input
                type="text"
                placeholder="Nachricht eingeben..."
                className="w-full bg-transparent outline-none"
              />

              <button
                onClick={e => {
                  e.stopPropagation()
                  handleTooltipToggle("message-input")
                }}
                className="absolute right-2 top-2 z-10 rounded-full bg-blue-500 p-1"
                title="Info zum Texteingabefeld"
              >
                <HelpCircle size={10} />
              </button>

              <HelpTooltip
                title="Texteingabefeld"
                description="Geben Sie hier Ihre Nachricht ein. Sie können Text formatieren, Emojis einfügen und mehr."
                isOpen={activeTooltip === "message-input"}
                onClose={() => setActiveTooltip(null)}
                position="top"
              />
            </div>

            <button className="relative rounded-full bg-blue-600 p-2 transition-colors hover:bg-blue-700">
              <Send size={20} />

              <button
                onClick={e => {
                  e.stopPropagation()
                  handleTooltipToggle("send-message")
                }}
                className="absolute -right-1 -top-1 z-10 rounded-full bg-blue-500 p-1"
                title="Info zu Nachricht senden"
              >
                <HelpCircle size={10} />
              </button>

              <HelpTooltip
                title="Nachricht senden"
                description="Klicken Sie hier, um Ihre Nachricht zu senden. Sie können auch die Enter-Taste drücken."
                isOpen={activeTooltip === "send-message"}
                onClose={() => setActiveTooltip(null)}
                position="left"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Legend/Explanation */}
      <div className="mb-8 rounded-lg border border-[#444444] bg-[#252525] p-6">
        <h3 className="mb-4 text-lg font-semibold">Navigation im Chat</h3>
        <p className="mb-4">
          Um mehr über ein Element zu erfahren, klicken Sie auf die{" "}
          <HelpCircle size={16} className="mx-1 inline" /> Icons in der
          interaktiven Ansicht oben.
        </p>
        <p>Das Chat-Interface besteht aus drei Hauptbereichen:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-300">
          <li>
            Chat-Header: Zeigt Informationen zum aktuellen Chat und
            Einstellungsoptionen
          </li>
          <li>
            Nachrichtenbereich: Hier sehen Sie den gesamten Gesprächsverlauf
          </li>
          <li>
            Eingabebereich: Hier können Sie Nachrichten eingeben und senden
          </li>
        </ul>
      </div>

      {/* Detailed Explanations */}
      {infoSections.map((section, index) => (
        <div key={index} className="mb-8">
          <h3 className="mb-3 text-lg font-semibold">{section.title}</h3>
          <div className="space-y-4">
            {section.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="rounded-lg border border-[#444444] bg-[#252525] p-4"
              >
                <h4 className="mb-2 font-medium">{item.label}</h4>
                <p className="text-sm text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatHelp
