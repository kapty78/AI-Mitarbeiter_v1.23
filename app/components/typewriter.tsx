"use client"

import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MessageCodeBlock } from "../../components/message-code-block"

// Define a simpler interface for CodeProps
interface CodeProps {
  node?: any
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

interface TypewriterEffectProps {
  content: string
  onComplete: () => void
}

export function TypewriterEffect({
  content,
  onComplete
}: TypewriterEffectProps) {
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const contentRef = useRef(content)
  const speedRef = useRef(1) // Characters per frame

  useEffect(() => {
    contentRef.current = content
    setDisplayedContent("")
    setCurrentIndex(0)
  }, [content])

  useEffect(() => {
    if (currentIndex >= contentRef.current.length) {
      onComplete()
      return
    }

    const timeout = setTimeout(() => {
      // Add next chunk of characters
      const nextIndex = Math.min(
        currentIndex + speedRef.current,
        contentRef.current.length
      )
      setDisplayedContent(contentRef.current.substring(0, nextIndex))
      setCurrentIndex(nextIndex)

      // Speed up typing as we go (gives a more natural feel)
      if (nextIndex < contentRef.current.length) {
        speedRef.current = Math.min(speedRef.current + 0.2, 10)
      }
    }, 10) // Update every 10ms for smooth animation

    return () => clearTimeout(timeout)
  }, [currentIndex, onComplete])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        a: ({ node, ...props }) => (
          <a
            className="text-[var(--accent-primary)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        ul: ({ node, ...props }) => (
          <ul className="mb-4 list-disc pl-5" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="mb-4 list-decimal pl-5" {...props} />
        ),
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        h1: ({ node, ...props }) => (
          <h1
            className="mb-4 mt-6 border-b border-[var(--border-light)] pb-1 text-xl font-bold"
            {...props}
          />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="mb-3 mt-5 text-lg font-bold" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="mb-2 mt-4 text-base font-bold" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="mb-2 mt-3 text-sm font-bold" {...props} />
        ),
        pre: ({ node, ...props }) => (
          <pre
            className="mb-4 overflow-auto rounded-md bg-[var(--bg-tertiary)] p-4 text-sm"
            {...props}
          />
        ),
        code: ({ node, inline, className, children, ...props }: CodeProps) => {
          const match = /language-(\w+)/.exec(className || "")
          const language = match ? match[1] : "code"
          const value = String(children).replace(/\n$/, "")

          if (inline) {
            // Handle inline code with improved styling
            return (
              <code
                className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-emerald-400"
                {...props}
              >
                {children}
              </code>
            )
          }

          // For multiline code blocks
          return (
            <MessageCodeBlock
              language={language}
              value={value}
            />
          )
        },
        table: ({ node, ...props }) => (
          <div className="mb-4 overflow-x-auto">
            <table className="text-sm" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead
            className="border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]"
            {...props}
          />
        ),
        tbody: ({ node, ...props }) => (
          <tbody className="divide-y divide-[var(--border-light)]" {...props} />
        ),
        tr: ({ node, ...props }) => (
          <tr className="border-b border-[var(--border-light)]" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="px-4 py-2 text-left font-medium" {...props} />
        ),
        td: ({ node, ...props }) => <td className="px-4 py-2" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-[var(--border-light)] pl-4 italic text-[var(--text-secondary)]"
            {...props}
          />
        ),
        hr: ({ node, ...props }) => (
          <hr className="my-4 border-[var(--border-light)]" {...props} />
        )
      }}
    >
      {displayedContent}
    </ReactMarkdown>
  )
}
