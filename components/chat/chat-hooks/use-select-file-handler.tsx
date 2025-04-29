import { ChatbotUIContext } from "@/context/context"
import { createDocXFile, createFile } from "@/db/files"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import mammoth from "mammoth"
import { useContext, useEffect, useState } from "react"
import { toast } from "sonner"

export const ACCEPTED_FILE_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
  "text/markdown",
  "application/pdf",
  "text/plain"
].join(",")

export const useSelectFileHandler = () => {
  const {
    selectedWorkspace,
    profile,
    chatSettings,
    setNewMessageImages,
    setNewMessageFiles,
    setShowFilesDisplay,
    setFiles,
    setUseRetrieval
  } = useContext(ChatbotUIContext)

  const [filesToAccept, setFilesToAccept] = useState(ACCEPTED_FILE_TYPES)

  useEffect(() => {
    handleFilesToAccept()
  }, [chatSettings?.model])

  const handleFilesToAccept = () => {
    const model = chatSettings?.model
    const FULL_MODEL = LLM_LIST.find(llm => llm.modelId === model)

    if (!FULL_MODEL) return

    setFilesToAccept(
      FULL_MODEL.imageInput
        ? `${ACCEPTED_FILE_TYPES},image/*`
        : ACCEPTED_FILE_TYPES
    )
  }

  const handleSelectDeviceFile = async (file: File) => {
    if (!profile || !selectedWorkspace || !chatSettings) return

    setShowFilesDisplay(true)
    setUseRetrieval(true)

    if (file) {
      let simplifiedFileType = file.type.split("/")[1]

      let reader = new FileReader()

      if (file.type.includes("image")) {
        reader.readAsDataURL(file)
      } else if (ACCEPTED_FILE_TYPES.split(",").includes(file.type)) {
        if (simplifiedFileType.includes("vnd.adobe.pdf")) {
          simplifiedFileType = "pdf"
        } else if (
          simplifiedFileType.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) ||
          simplifiedFileType.includes("docx")
        ) {
          simplifiedFileType = "docx"
        }

        setNewMessageFiles(prev => [
          ...prev,
          {
            id: "loading",
            name: file.name,
            type: simplifiedFileType,
            file: file
          }
        ])

        // Handle docx files
        if (
          file.type.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) ||
          file.type.includes("docx")
        ) {
          try {
            const arrayBuffer = await file.arrayBuffer()
            console.log(`Got arrayBuffer of size: ${arrayBuffer.byteLength}`)

            // Try multiple approaches for extracting DOCX text
            let result
            try {
              // Try arrayBuffer approach first (works in most browsers)
              result = await mammoth.extractRawText({
                arrayBuffer: arrayBuffer
              })
              console.log("Browser: arrayBuffer approach succeeded")
            } catch (mammothError: any) {
              console.error(
                "Browser: arrayBuffer approach failed:",
                mammothError.message
              )

              // If that fails, try falling back to a simple extraction
              try {
                // Last resort: Fall back to a different method or show error
                toast.error(
                  "DOCX extraction failed. Please try a different file format like PDF, TXT, or MD.",
                  {
                    duration: 10000
                  }
                )
                setNewMessageFiles(prev => prev.filter(f => f.id !== "loading"))
                return
              } catch (fallbackError: any) {
                console.error("Browser: all DOCX extraction methods failed")
                throw new Error(
                  `DOCX extraction failed: ${fallbackError.message}`
                )
              }
            }

            if (!result || !result.value) {
              console.error("Mammoth returned no text content")
              throw new Error("No text content could be extracted from DOCX")
            }

            console.log(`Extracted ${result.value.length} characters from DOCX`)

            if (result.messages && result.messages.length > 0) {
              console.log("Mammoth warnings:", result.messages)
            }

            const createdFile = await createDocXFile(
              result.value,
              file,
              {
                user_id: profile.id,
                name: file.name,
                path: "",
                size: file.size,
                type: simplifiedFileType
              },
              selectedWorkspace.id,
              chatSettings.embeddingsProvider
            )

            setFiles(prev => [...prev, createdFile])

            setNewMessageFiles(prev =>
              prev.map(item =>
                item.id === "loading"
                  ? {
                      id: createdFile.id,
                      name: createdFile.name,
                      type: createdFile.type,
                      file: file
                    }
                  : item
              )
            )

            reader.onloadend = null

            return
          } catch (error: any) {
            console.error("Error processing DOCX:", error)
            toast.error(`Failed to process DOCX: ${error.message}`, {
              duration: 10000
            })
            setNewMessageFiles(prev => prev.filter(f => f.id !== "loading"))
            return
          }
        } else {
          // Use readAsArrayBuffer for PDFs and readAsText for other types
          file.type.includes("pdf")
            ? reader.readAsArrayBuffer(file)
            : reader.readAsText(file)
        }
      } else {
        throw new Error("Unsupported file type")
      }

      reader.onloadend = async function () {
        try {
          if (file.type.includes("image")) {
            // Create a temp url for the image file
            const imageUrl = URL.createObjectURL(file)

            // This is a temporary image for display purposes in the chat input
            setNewMessageImages(prev => [
              ...prev,
              {
                messageId: "temp",
                path: "",
                base64: reader.result, // base64 image
                url: imageUrl,
                file
              }
            ])
          } else {
            const createdFile = await createFile(
              file,
              {
                user_id: profile.id,
                name: file.name,
                path: "",
                size: file.size,
                type: simplifiedFileType
              },
              selectedWorkspace.id,
              chatSettings.embeddingsProvider
            )

            setFiles(prev => [...prev, createdFile])

            setNewMessageFiles(prev =>
              prev.map(item =>
                item.id === "loading"
                  ? {
                      id: createdFile.id,
                      name: createdFile.name,
                      type: createdFile.type,
                      file: file
                    }
                  : item
              )
            )
          }
        } catch (error: any) {
          toast.error("Failed to upload. " + error?.message, {
            duration: 10000
          })
          setNewMessageImages(prev =>
            prev.filter(img => img.messageId !== "temp")
          )
          setNewMessageFiles(prev => prev.filter(file => file.id !== "loading"))
        }
      }
    }
  }

  return {
    handleSelectDeviceFile,
    filesToAccept
  }
}
