"use client"

import { useEffect, useState } from 'react'
import { MessageMarkdown } from './message-markdown'

interface TypewriterEffectProps {
  content: string
  speed?: number
  onComplete?: () => void
}

export const TypewriterEffect = ({
  content,
  speed,
  onComplete
}: TypewriterEffectProps) => {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  // Parse JSON if necessary
  let textToDisplay = content
  try {
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      const jsonContent = JSON.parse(content)
      if (jsonContent && typeof jsonContent.content === 'string') {
        textToDisplay = jsonContent.content
      }
    }
  } catch (e) {
    // Use original content if parsing fails
  }

  useEffect(() => {
    // Reset animation when content changes
    setDisplayedContent('')
    setCurrentIndex(0)
  }, [content])

  useEffect(() => {
    if (currentIndex < textToDisplay.length) {
      // Dynamic speed that gets faster as more characters are typed
      const baseDelay = speed ?? 30 // Use provided speed or default to 30 milliseconds
      const minDelay = 8 // minimum delay in milliseconds
      const progress = currentIndex / textToDisplay.length
      const dynamicDelay = Math.max(minDelay, baseDelay * (1 - progress * 0.7))
      
      const timer = setTimeout(() => {
        setDisplayedContent(textToDisplay.substring(0, currentIndex + 1))
        setCurrentIndex(prevIndex => prevIndex + 1)
      }, dynamicDelay)

      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, textToDisplay, onComplete, speed])

  return (
    <div className="prose prose-invert max-w-none">
      <MessageMarkdown content={displayedContent} />
      {currentIndex < textToDisplay.length && (
        <span className="mt-1 animate-pulse cursor-default">▍</span>
      )}
    </div>
  )
} 