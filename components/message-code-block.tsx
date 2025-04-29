import { Copy, Check, Download } from "lucide-react"
import { FC, memo, useState } from "react"
import SyntaxHighlighter from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface MessageCodeBlockProps {
  language: string
  value: string
}

// Get a friendly language name for display
const getLanguageDisplayName = (language: string): string => {
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    html: "html",
    css: "css",
    json: "json",
    py: "python",
    ruby: "ruby",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    php: "php",
    sql: "sql",
    bash: "bash",
    sh: "shell",
    powershell: "powershell",
    yaml: "yaml",
    markdown: "markdown",
    md: "markdown",
    swift: "swift",
    kotlin: "kotlin",
    rust: "rust",
    // Add more languages as needed
  }
  
  return languageMap[language.toLowerCase()] || language
}

// Generate a random filename for downloads
const generateRandomFilename = (language: string): string => {
  const timestamp = new Date().getTime().toString().slice(-6)
  const fileExtensions: Record<string, string> = {
    js: ".js",
    jsx: ".jsx",
    ts: ".ts",
    tsx: ".tsx",
    html: ".html",
    css: ".css",
    json: ".json",
    py: ".py",
    ruby: ".rb",
    go: ".go",
    java: ".java",
    c: ".c",
    cpp: ".cpp",
    cs: ".cs",
    php: ".php",
    sql: ".sql",
    bash: ".sh",
    sh: ".sh",
    powershell: ".ps1",
    yaml: ".yaml",
    markdown: ".md",
    md: ".md",
    swift: ".swift",
    kotlin: ".kt",
    rust: ".rs",
    // Add more extensions as needed
  }
  
  const extension = fileExtensions[language.toLowerCase()] || ".txt"
  return `code-${timestamp}${extension}`
}

export const MessageCodeBlock: FC<MessageCodeBlockProps> = memo(
  ({ language, value }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const handleCopy = () => {
      navigator.clipboard.writeText(value)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          console.error("Failed to copy code: ", err)
        })
    }
    
    const handleDownload = () => {
      const filename = generateRandomFilename(language)
      const blob = new Blob([value], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    return (
      <div className="relative my-4 overflow-hidden rounded-md border border-gray-700 bg-[#1e1e1e]">
        <div className="flex items-center justify-between border-b border-gray-700 bg-[#1e1e1e] px-4 py-2">
          <span className="text-xs text-gray-400">
            {getLanguageDisplayName(language)}
          </span>
          <div className="flex items-center space-x-2">
            {isCopied ? (
              <button
                className="text-sm text-gray-400 hover:text-white"
                disabled
              >
                <span className="flex items-center">
                  <Check size={16} className="mr-1" />
                  Kopiert
                </span>
              </button>
            ) : (
              <button
                onClick={handleCopy}
                className="text-sm text-gray-400 hover:text-white"
                title="Code in die Zwischenablage kopieren"
              >
                <span className="flex items-center">
                  <Copy size={16} className="mr-1" />
                  Kopieren
                </span>
              </button>
            )}
          </div>
        </div>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          showLineNumbers={true}
          wrapLines={true}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: '#1e1e1e',
            fontSize: '12px',
            overflow: 'auto',
            borderRadius: '4px',
            border: '1px solid #333',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    )
  }
)

MessageCodeBlock.displayName = "MessageCodeBlock" 