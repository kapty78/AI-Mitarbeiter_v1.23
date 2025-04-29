import React, { FC } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MessageCodeBlock } from "./message-code-block"

interface MessageMarkdownProps {
  content: string
}

export const MessageMarkdown: FC<MessageMarkdownProps> = ({ content }) => {
  // Detect and wrap code blocks that aren't properly formatted with markdown backticks
  const processContent = (content: string): string => {
    // If the content already has markdown code blocks, don't modify it
    if (content.includes("```")) {
      return content;
    }
    
    // Nur vollständige HTML-Dokumente automatisch als Code-Blöcke erkennen
    // Für alle anderen Fälle soll der Benutzer die Markdown-Syntax selbst verwenden
    if (content.trim().startsWith("<!DOCTYPE") || 
        (content.trim().startsWith("<html") && content.includes("</html>"))) {
      return "```html\n" + content + "\n```";
    }
    
    return content;
  };

  const processedContent = processContent(content);
  
  return (
    <div className="message-markdown-wrapper text-base">
      <ReactMarkdown
        className="prose prose-invert max-w-none break-words text-gray-100"
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p className="mb-4 leading-relaxed last:mb-0">{children}</p>
          },
          img({ node, ...props }) {
            return <img className="my-4 max-w-full rounded-md" {...props} />
          },
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : "code"
            const value = String(children).replace(/\n$/, "")

            // Cursor-Platzhalter von TypewriterEffect erkennen (falls vorhanden)
            if (value === "▍") {
              return <span className="ml-0.5 animate-pulse cursor-default">▍</span>
            }

            // Für Inline-Code-Blöcke (ohne Zeilenumbrüche)
            if (!value.includes("\n")) {
              return (
                <code className="mx-0.5 rounded bg-gray-700 px-1.5 py-0.5 font-mono text-sm text-white">
                  {children}
                </code>
              )
            }

            // Für Multiline-Code-Blöcke
            return (
              <MessageCodeBlock
                language={language}
                value={value}
              />
            )
          },
          ul: ({ children, ...props }) => (
            <ul className="mb-4 ml-5 list-disc space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-4 ml-5 list-decimal space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed text-gray-100" {...props}>
              {children}
            </li>
          ),
          h1: ({ children, ...props }) => (
            <h1 className="mb-4 mt-6 text-2xl font-semibold text-white" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="mb-3 mt-5 text-xl font-semibold text-white" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mb-3 mt-4 text-lg font-semibold text-white" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="mb-2 mt-3 text-base font-semibold text-white" {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="mb-2 mt-3 text-sm font-semibold text-white" {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="mb-2 mt-3 text-xs font-semibold text-white" {...props}>
              {children}
            </h6>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="mb-4 border-l-4 border-gray-600 pl-4 italic text-gray-400" {...props}>
              {children}
            </blockquote>
          ),
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              className="text-blue-400 underline hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          table: ({ children, ...props }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-800" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="divide-y divide-gray-700" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-b border-gray-700" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-400" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 text-sm" {...props}>
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
} 