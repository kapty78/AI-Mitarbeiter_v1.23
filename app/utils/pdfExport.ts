import jsPDF from "jspdf"
import { Message } from "../types"

interface PdfExportOptions {
  title?: string
  includeTimestamp?: boolean
  messageSelection?: number[] | "all" | "last5" | "last10"
}

/**
 * Exportiert Chat-Nachrichten als PDF mit echtem Text statt Bildern
 */
export const exportChatToPdf = async (
  messages: Message[],
  fileName: string = "chat-export.pdf",
  options: PdfExportOptions = {}
): Promise<string> => {
  try {
    // Optionen mit Standardwerten
    const {
      title = "Chat Export",
      includeTimestamp = true,
      messageSelection = "all"
    } = options

    // Nachrichten nach Auswahl filtern
    let filteredMessages: Message[] = []

    if (messageSelection === "all") {
      filteredMessages = [...messages]
    } else if (messageSelection === "last5") {
      filteredMessages = messages.slice(-5)
    } else if (messageSelection === "last10") {
      filteredMessages = messages.slice(-10)
    } else if (Array.isArray(messageSelection)) {
      filteredMessages = messages.filter((_, index) =>
        messageSelection.includes(index)
      )
    }

    // Datum für den Header formatieren
    const date = new Date().toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

    // PDF initialisieren
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    })

    // Dokumentenweite Einstellungen
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20 // Ränder in mm
    const contentWidth = pageWidth - 2 * margin

    // Textfarben definieren
    const textColor = [0, 0, 0] // Schwarz
    const secondaryColor = [100, 100, 100] // Grau

    // Schriftgröße für verschiedene Elemente
    const titleFontSize = 20
    const subtitleFontSize = 11
    const messageRoleFontSize = 11
    const messageContentFontSize = 10
    const footerFontSize = 9

    // Zeilenhöhen
    const lineHeight = 6 // in mm

    // Hilfsfunktion zum Hinzufügen von mehrzeiligen Texten
    function addWrappedText(
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number,
      fontStyle: string = "normal"
    ): number {
      pdf.setFontSize(fontSize)
      pdf.setFont("helvetica", fontStyle)

      // Teilen des Textes in Absätze
      const paragraphs = text.split("\n")
      let currentY = y

      for (const paragraph of paragraphs) {
        if (paragraph.trim() === "") {
          currentY += fontSize * 0.25
          continue
        }

        // Prüfen, ob eine neue Seite benötigt wird
        if (currentY > pageHeight - margin) {
          addFooter()
          pdf.addPage()
          currentY = margin + 10 // Oberer Seitenrand + etwas Platz
        }

        // Text mit automatischem Umbruch hinzufügen
        const textLines = pdf.splitTextToSize(paragraph, maxWidth)
        for (const line of textLines) {
          pdf.text(line, x, currentY)
          currentY += fontSize * 0.5 // Zeilenhöhe anhand der Schriftgröße
        }

        currentY += fontSize * 0.3 // Absatzabstand
      }

      return currentY
    }

    // Hilfsfunktion zum Hinzufügen von Footern
    function addFooter() {
      pdf.setFontSize(footerFontSize)
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
      pdf.text(
        "Chat-Export generiert von EcomTask AI Mitarbeiter.",
        pageWidth / 2,
        pageHeight - 10,
        {
          align: "center"
        }
      )
    }

    // Header hinzufügen
    pdf.setFontSize(titleFontSize)
    pdf.setTextColor(textColor[0], textColor[1], textColor[2])
    pdf.text(title, margin, margin + 10)

    pdf.setFontSize(subtitleFontSize)
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    pdf.text(`Exportiert am ${date}`, margin, margin + 18)

    // Trennlinie unter Header
    pdf.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    pdf.setLineWidth(0.2)
    pdf.line(margin, margin + 22, pageWidth - margin, margin + 22)

    // Startposition für Nachrichten
    let currentY = margin + 30

    // Nachrichten hinzufügen
    for (const message of filteredMessages) {
      // Rolle (User/Assistant)
      const roleDisplay =
        message.role.charAt(0).toUpperCase() + message.role.slice(1)

      // Zeitstempel
      const timestamp =
        includeTimestamp && message.timestamp
          ? new Date(message.timestamp).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit"
            })
          : ""

      // Prüfen, ob eine neue Seite benötigt wird
      if (currentY > pageHeight - margin - 40) {
        addFooter()
        pdf.addPage()
        currentY = margin + 10
      }

      // Rolle und Zeitstempel
      pdf.setFontSize(messageRoleFontSize)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      let roleText = roleDisplay + ":"
      if (timestamp) {
        roleText += " " + timestamp
      }
      pdf.text(roleText, margin, currentY)

      currentY += lineHeight

      // Nachrichteninhalt
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(messageContentFontSize)
      pdf.setTextColor(textColor[0], textColor[1], textColor[2])

      currentY = addWrappedText(
        message.content,
        margin,
        currentY,
        contentWidth,
        messageContentFontSize
      )

      // Abstand zwischen Nachrichten
      currentY += lineHeight - 1

      // Trennlinie zwischen Nachrichten
      pdf.setDrawColor(200, 200, 200) // Hellere Linie
      pdf.setLineWidth(0.1)
      pdf.line(margin, currentY - 2, pageWidth - margin, currentY - 2)

      currentY += lineHeight - 1
    }

    // Footer auf jeder Seite
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      addFooter()
    }

    // PDF speichern
    pdf.save(fileName)
    return fileName
  } catch (error) {
    console.error("Error exporting chat as PDF:", error)
    throw error
  }
}

/**
 * Funktion zum Exportieren mit Optionen
 */
export const downloadChatAsPdf = (
  messages: Message[],
  title: string = "Chat Export",
  selection: PdfExportOptions["messageSelection"] = "all"
) => {
  const fileName = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`

  return exportChatToPdf(messages, fileName, {
    title,
    messageSelection: selection,
    includeTimestamp: true
  })
}
