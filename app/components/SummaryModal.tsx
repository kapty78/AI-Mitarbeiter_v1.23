import React, { useState, useEffect } from "react"
import { X, FileText, ClipboardCopy, Check } from "lucide-react"

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  summary: string
  loading: boolean
}

const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  loading
}) => {
  const [copied, setCopied] = useState(false)

  // Reset copied state when modal opens/closes
  useEffect(() => {
    setCopied(false)
  }, [isOpen])

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg border border-[#333333] bg-[#1e1e1e] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Chat-Zusammenfassung
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#cccccc] transition-all hover:bg-[#333333] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 max-h-96 overflow-y-auto rounded-lg border border-[#333333] bg-[#2d2d2d] p-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-y-2 border-blue-500"></div>
              <span className="ml-3 text-[#cccccc]">
                Zusammenfassung wird erstellt...
              </span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              {summary.split("\n").map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#333333] px-4 py-2 text-sm text-[#cccccc] transition-all hover:border-[#444444] hover:text-white"
          >
            Schließen
          </button>
          <button
            onClick={handleCopy}
            disabled={loading}
            className={`flex items-center rounded-lg px-4 py-2 text-sm ${
              loading
                ? "cursor-not-allowed bg-blue-600/50 text-white/70"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-2" />
                Kopiert!
              </>
            ) : (
              <>
                <ClipboardCopy size={16} className="mr-2" />
                In Zwischenablage kopieren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SummaryModal
