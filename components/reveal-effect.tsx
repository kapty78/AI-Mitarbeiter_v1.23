'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MessageMarkdown } from './message-markdown';
import './reveal-effect.css'; // We will create this CSS file next

interface RevealEffectProps {
  content: string;
  wordRevealDelay?: number; // Delay between revealing each word (ms)
  onComplete?: () => void;
}

export const RevealEffect = ({
  content,
  wordRevealDelay = 8, // Base delay - will be adjusted dynamically
  onComplete
}: RevealEffectProps) => {
  const [revealedWordsCount, setRevealedWordsCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [visibleContent, setVisibleContent] = useState('');
  
  // Referenz für den vorherigen Content-Stand, um zu wissen, ob neue Inhalte hinzugekommen sind
  const prevContentRef = useRef('');
  
  // Referenz für die Gesamtanzahl der Wörter bei der letzten Verarbeitung
  const prevWordsCountRef = useRef(0);

  // Parse JSON if necessary
  let textToProcess = content;
  try {
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      const jsonContent = JSON.parse(content);
      if (jsonContent && typeof jsonContent.content === 'string') {
        textToProcess = jsonContent.content;
      }
    }
  } catch (e) {
    // Use original content if parsing fails
  }

  // Memoize the split words to avoid re-splitting on every render
  const words = useMemo(() => textToProcess.split(/(\s+)/).filter(Boolean), [textToProcess]);
  
  // Calculate adaptive reveal speed based on content length
  const adaptiveDelay = useMemo(() => {
    const contentLength = textToProcess.length;
    
    // Sehr viel schnellere Verarbeitung für Streaming
    if (contentLength > 2000) return 0.5; // Super schnell für lange Nachrichten
    if (contentLength > 1000) return 1;   // Sehr schnell für längere Nachrichten
    if (contentLength > 500) return 2;    // Schnell für mittellange Nachrichten
    return Math.max(3, wordRevealDelay * 0.5); // Normal für kurze Nachrichten
  }, [textToProcess, wordRevealDelay]);

  // Calculate batch size based on total words - viel größere Batches
  const batchSize = useMemo(() => {
    if (words.length > 1000) return 20;  // Sehr große Batches für extrem lange Texte
    if (words.length > 500) return 15;   // Große Batches für lange Texte
    if (words.length > 200) return 10;   // Mittlere Batches
    if (words.length > 100) return 5;    // Kleine Batches
    return 3;                           // Minimaler Batch für kurze Texte
  }, [words.length]);

  // Bestimmen, ob es sich um einen langen Text handelt (für CSS-Optimierung)
  const isLargeText = useMemo(() => {
    return textToProcess.length > 500;
  }, [textToProcess]);

  useEffect(() => {
    // Wenn neuer Content dazugekommen ist, nur für den neuen Teil Animation starten
    if (textToProcess.length > prevContentRef.current.length) {
      // Content ist gewachsen - streaming Fall
      const newWords = words.length - prevWordsCountRef.current;
      
      if (newWords > 0) {
        // Nur wenn wirklich neue Wörter dazugekommen sind
        
        // Alte Wörter behalten, nur für neue Wörter Animation starten
        setRevealedWordsCount(prevWordsCountRef.current);
        
        // Sichtbaren Inhalt mit den bereits bekannten Wörtern initialisieren
        if (prevWordsCountRef.current > 0) {
          setVisibleContent(words.slice(0, prevWordsCountRef.current).join(''));
        }
        
        // Log für neue Chunks
        console.log(`RevealEffect - Neuer Chunk: +${newWords} Wörter, Batch: ${batchSize}`);
      }
    } else if (textToProcess !== prevContentRef.current) {
      // Komplett neuer Content (nicht streaming)
      setRevealedWordsCount(0);
      setVisibleContent('');
      setIsComplete(false);
      
      console.log(`RevealEffect - Neuer Content: ${words.length} Wörter, Delay: ${adaptiveDelay}ms`);
    }
    
    // Aktuellen Content und Wortanzahl speichern für Vergleich beim nächsten Update
    prevContentRef.current = textToProcess;
    prevWordsCountRef.current = words.length;
  }, [textToProcess, words, batchSize, adaptiveDelay]);

  useEffect(() => {
    if (revealedWordsCount < words.length) {
      const timer = setTimeout(() => {
        // Neue Wortanzahl berechnen
        const newCount = Math.min(revealedWordsCount + batchSize, words.length);
        setRevealedWordsCount(newCount);
        
        // Update den sichtbaren Content
        setVisibleContent(words.slice(0, newCount).join(''));
      }, adaptiveDelay);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [revealedWordsCount, words, adaptiveDelay, batchSize, onComplete, isComplete]);

  return (
    <div className={`reveal-effect-container ${isLargeText ? 'large-text' : ''}`}>
      {/* Use MessageMarkdown to render the revealed content with proper formatting */}
      <div className="reveal-animation-wrapper">
        <MessageMarkdown content={visibleContent} />
      </div>
    </div>
  );
}; 