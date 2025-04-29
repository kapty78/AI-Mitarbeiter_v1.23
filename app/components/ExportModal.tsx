import React, { useState } from "react"
import { X, FileText, Check } from "lucide-react"
import { Message } from "../types"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  onExport: (selectedMessages: "all" | "last5" | "last10" | number[]) => void
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  messages,
  onExport
}) => {
  const [exportOption, setExportOption] = useState<
    "all" | "last5" | "last10" | "custom"
  >("all")
  const [selectedMessages, setSelectedMessages] = useState<number[]>([])

  if (!isOpen) return null

  const handleOptionChange = (
    option: "all" | "last5" | "last10" | "custom"
  ) => {
    setExportOption(option)
    if (option === "custom") {
      setSelectedMessages([])
    }
  }

  const toggleMessageSelection = (index: number) => {
    if (selectedMessages.includes(index)) {
      setSelectedMessages(selectedMessages.filter(i => i !== index))
    } else {
      setSelectedMessages([...selectedMessages, index])
    }
  }

  const handleExport = () => {
    if (exportOption === "custom") {
      onExport(selectedMessages)
    } else {
      onExport(exportOption)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg border border-[#333333] bg-[#1e1e1e] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Chat exportieren</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#cccccc] transition-all hover:bg-[#333333] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="mb-4 text-[#cccccc]">
            Wähle aus, welche Nachrichten du als PDF exportieren möchtest:
          </p>

          <div className="space-y-2">
            <div
              className={`flex cursor-pointer items-center rounded-lg p-3 ${
                exportOption === "all"
                  ? "border border-[#444444] bg-[#333333]"
                  : "hover:bg-[#2d2d2d]"
              }`}
              onClick={() => handleOptionChange("all")}
            >
              <div
                className={`mr-2 flex size-5 items-center justify-center rounded-full border${
                  exportOption === "all"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-[#666666]"
                }`}
              >
                {exportOption === "all" && <Check size={12} />}
              </div>
              <span className="text-white">
                Alle Nachrichten ({messages.length})
              </span>
            </div>

            <div
              className={`flex cursor-pointer items-center rounded-lg p-3 ${
                exportOption === "last10"
                  ? "border border-[#444444] bg-[#333333]"
                  : "hover:bg-[#2d2d2d]"
              }`}
              onClick={() => handleOptionChange("last10")}
            >
              <div
                className={`mr-2 flex size-5 items-center justify-center rounded-full border${
                  exportOption === "last10"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-[#666666]"
                }`}
              >
                {exportOption === "last10" && <Check size={12} />}
              </div>
              <span className="text-white">
                Letzten 10 Nachrichten{" "}
                {messages.length > 10 ? `(von ${messages.length})` : ""}
              </span>
            </div>

            <div
              className={`flex cursor-pointer items-center rounded-lg p-3 ${
                exportOption === "last5"
                  ? "border border-[#444444] bg-[#333333]"
                  : "hover:bg-[#2d2d2d]"
              }`}
              onClick={() => handleOptionChange("last5")}
            >
              <div
                className={`mr-2 flex size-5 items-center justify-center rounded-full border${
                  exportOption === "last5"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-[#666666]"
                }`}
              >
                {exportOption === "last5" && <Check size={12} />}
              </div>
              <span className="text-white">
                Letzten 5 Nachrichten{" "}
                {messages.length > 5 ? `(von ${messages.length})` : ""}
              </span>
            </div>

            <div
              className={`flex cursor-pointer items-center rounded-lg p-3 ${
                exportOption === "custom"
                  ? "border border-[#444444] bg-[#333333]"
                  : "hover:bg-[#2d2d2d]"
              }`}
              onClick={() => handleOptionChange("custom")}
            >
              <div
                className={`mr-2 flex size-5 items-center justify-center rounded-full border${
                  exportOption === "custom"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-[#666666]"
                }`}
              >
                {exportOption === "custom" && <Check size={12} />}
              </div>
              <span className="text-white">Benutzerdefinierte Auswahl</span>
            </div>
          </div>
        </div>

        {exportOption === "custom" && (
          <div className="mb-6 max-h-60 overflow-y-auto rounded-lg border border-[#333333] bg-[#2d2d2d] p-2">
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex cursor-pointer items-center rounded-md p-2 ${
                    selectedMessages.includes(index)
                      ? "bg-[#3b3b3b]"
                      : "hover:bg-[#333333]"
                  }`}
                  onClick={() => toggleMessageSelection(index)}
                >
                  <div
                    className={`mr-2 flex size-5 items-center justify-center rounded-sm border${
                      selectedMessages.includes(index)
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-[#666666]"
                    }`}
                  >
                    {selectedMessages.includes(index) && <Check size={12} />}
                  </div>
                  <div className="flex-1 truncate">
                    <span className="mr-2 font-semibold text-[#cccccc]">
                      {message.role === "user" ? "Du:" : "KI:"}
                    </span>
                    <span className="truncate text-sm text-[#aaaaaa]">
                      {message.content.substring(0, 50)}
                      {message.content.length > 50 ? "..." : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#333333] px-4 py-2 text-sm text-[#cccccc] transition-all hover:border-[#444444] hover:text-white"
          >
            Abbrechen
          </button>
          <button
            onClick={handleExport}
            disabled={
              exportOption === "custom" && selectedMessages.length === 0
            }
            className={`flex items-center rounded-lg px-4 py-2 text-sm ${
              exportOption === "custom" && selectedMessages.length === 0
                ? "cursor-not-allowed bg-blue-600/50 text-white/70"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <FileText size={16} className="mr-2" />
            Als PDF exportieren
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
