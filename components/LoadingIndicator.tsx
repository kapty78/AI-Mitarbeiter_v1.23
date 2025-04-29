"use client"

import React from 'react';

interface LoadingIndicatorProps {
  color?: string;
}

export default function LoadingIndicator({ color }: LoadingIndicatorProps) {
  return (
    <div className="mb-10 flex h-full items-center justify-center">
      <div 
        className="animate-pulse-custom size-5 rounded-full bg-white"
        style={{
          animation: 'pulseCustom 1.5s ease-in-out infinite'
        }}
      />
      <style jsx global>{`
        @keyframes pulseCustom {
          0% {
            transform: scale(0.7);
            opacity: 0.4;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.2);
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.9);
          }
          100% {
            transform: scale(0.7);
            opacity: 0.4;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.2);
          }
        }
      `}</style>
    </div>
  );
}
