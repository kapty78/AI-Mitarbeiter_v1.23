import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { Document } from "langchain/document"
// TODO: Install and import mammoth for docx
import mammoth from "mammoth"
import { v4 as uuidv4 } from "uuid"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"

/**
 * Interface for reporting progress during PDF extraction
 */
export interface ExtractionProgress {
  currentPage: number
  totalPages: number
  percentComplete: number
  fileName: string
}

type ProgressCallback = (progress: ExtractionProgress) => void

/**
 * Extracts text content from a given file based on its extension.
 * Now supports page-by-page extraction for PDFs with progress reporting.
 *
 * @param file The file object (Blob) to process.
 * @param onProgress Optional callback for reporting extraction progress.
 * @returns A promise that resolves to the extracted text content as a string.
 * @throws If the file type is unsupported or extraction fails.
 */
export const extractTextFromFile = async (
  file: File,
  onProgress?: ProgressCallback
): Promise<string | string[]> => {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (!extension) {
    throw new Error("Could not determine file extension.")
  }

  console.log(
    `Attempting to extract text from file: ${file.name} (type: ${extension})`
  )

  try {
    switch (extension) {
      case "pdf":
        return await extractTextFromPDF(file, onProgress)

      case "txt":
      case "md": // Treat Markdown as plain text for extraction
        const text = await file.text()
        console.log(
          `Successfully extracted ${text.length} characters from text file.`
        )
        return text

      case "docx":
        return await extractTextFromDOCX(file)

      case "text/plain":
        const plainText = await file.text()
        console.log("Plain text processed, no extraction needed")
        return plainText

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        // Redirect to our docx handler
        return extractTextFromFile(
          new File([await file.arrayBuffer()], "document.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          })
        )

      // TODO: Add cases for other supported types (e.g., csv, json) if needed

      default:
        console.warn(`Unsupported file type: ${extension}`)
        throw new Error(`Unsupported file type: ${extension}`)
    }
  } catch (error: any) {
    console.error(`Error extracting text from ${file.name}:`, error)
    throw new Error(
      `Failed to extract text from ${file.name}: ${error.message}`
    )
  }
}

/**
 * Enhanced PDF extraction that processes each page individually and reports progress.
 *
 * @param file The PDF file to process
 * @param onProgress Optional callback for reporting extraction progress
 * @returns A string containing the extracted text
 */
async function extractTextFromPDF(
  file: File,
  onProgress?: ProgressCallback
): Promise<string[]> {
  try {
    // Use the PDFLoader from LangChain to get individual pages
    const loader = new PDFLoader(file, {
      splitPages: true // Ensure we get one Document per page
    })

    // Extract page documents
    const docs = await loader.load()
    const totalPages = docs.length
    console.log(`PDF has ${totalPages} pages`)

    // Process each page and report progress
    const processedPages: string[] = []
    let pageIndex = 0

    for (const doc of docs) {
      // Extract page content
      const pageContent = doc.pageContent
      processedPages.push(pageContent)

      // Update progress
      pageIndex++
      if (onProgress) {
        onProgress({
          currentPage: pageIndex,
          totalPages,
          percentComplete: Math.round((pageIndex / totalPages) * 100),
          fileName: file.name
        })
      }

      // Log progress
      console.log(
        `Processed page ${pageIndex}/${totalPages} with ${pageContent.length} characters`
      )

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Return the array of page contents directly
    console.log(
      `Successfully extracted ${processedPages.length} pages from PDF.`
    )

    return processedPages
  } catch (error) {
    console.error("Error during PDF extraction:", error)
    throw error
  }
}

/**
 * Extracts text from a DOCX file using mammoth
 *
 * @param file The DOCX file to process
 * @returns A string containing the extracted text
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  console.log("Extracting text from DOCX file")
  console.log(`Received file size: ${file.size} bytes`)

  try {
    const arrayBuffer = await file.arrayBuffer()
    console.log(
      `Received array buffer of size: ${arrayBuffer.byteLength} bytes`
    )

    // Try multiple approaches to extract text using mammoth
    // This handles differences between browser and server environments
    let result

    // First try with arrayBuffer (generally works in browser)
    try {
      result = await mammoth.extractRawText({
        arrayBuffer: arrayBuffer
      })
      console.log("arrayBuffer approach succeeded")
    } catch (err) {
      console.log("arrayBuffer approach failed:", err)

      // Second try with buffer (may work in some Node.js environments)
      try {
        const buffer = Buffer.from(arrayBuffer)
        result = await mammoth.extractRawText({
          buffer: buffer
        })
        console.log("buffer approach succeeded")
      } catch (err2) {
        console.log("buffer approach failed:", err2)

        // Third approach - write to temporary file and use path
        // This should work in a server environment
        try {
          // Create a temporary file path
          const tempDir = os.tmpdir()
          const tempFilePath = path.join(tempDir, `docx-${uuidv4()}.docx`)

          console.log(`Writing temp file to: ${tempFilePath}`)

          // Write the buffer to a temporary file
          await fs.promises.writeFile(tempFilePath, Buffer.from(arrayBuffer))

          // Use the path approach
          result = await mammoth.extractRawText({
            path: tempFilePath
          })

          console.log("path approach succeeded")

          // Clean up the temporary file
          try {
            await fs.promises.unlink(tempFilePath)
            console.log("Temporary file removed")
          } catch (cleanupErr) {
            console.warn("Failed to clean up temporary file:", cleanupErr)
          }
        } catch (err3) {
          console.error("All approaches failed:", err3)
          throw new Error(
            "Could not extract DOCX content with any available method"
          )
        }
      }
    }

    if (!result || !result.value) {
      console.error("Mammoth returned no text content")
      throw new Error("No text content could be extracted from DOCX")
    }

    const text = result.value.trim()
    console.log(`Extracted ${text.length} characters from DOCX`)

    if (result.messages && result.messages.length > 0) {
      console.log("Mammoth warnings:", result.messages)
    }

    return text
  } catch (error: any) {
    console.error("Error extracting text from DOCX:", error)
    throw new Error(`Failed to extract text from DOCX: ${error.message}`)
  }
}
