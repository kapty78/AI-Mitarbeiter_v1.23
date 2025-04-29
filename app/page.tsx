"use client"

import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#111111] p-4 text-white">
      {/* Placeholder for subtle background lines/particles if desired */}
      {/* <div className="absolute inset-0 z-0 opacity-10"> ... background elements ... </div> */}

      {/* Logo */}
      <div className="absolute left-8 top-8 z-10">
        <Image
          src="/logos/k-logo.svg"
          alt="EcomTask Logo"
          width={180}
          height={45}
          priority
        />
      </div>

      {/* Login Button (Top Right) */}
      <div className="absolute right-8 top-8 z-10">
        <Link
          href="/login"
          className="inline-block rounded-md bg-white px-5 py-2 text-sm font-semibold text-[#111111] shadow transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111111]"
        >
          Login
        </Link>
      </div>

      <div className="z-10 flex w-full max-w-4xl flex-col items-center px-4 text-center">
        {/* AI-Mitarbeiter Tag */}
        <div className="mb-4 inline-block rounded-full border border-[#444444] bg-[#2a2a2a] px-4 py-1.5 text-sm font-medium text-gray-300">
          AI-Mitarbeiter
        </div>

        {/* Header */}
        <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
          AI-Mitarbeiter & Assistenten für Ihr Unternehmen
        </h1>
        {/* Description - Revised Marketing Copy */}
        <p className="mb-10 max-w-2xl text-lg text-gray-400">
          Steigern Sie Ihre Effizienz und automatisieren Sie komplexe Aufgaben
          mit EcomTask AI. Durch die intelligente Verknüpfung Ihrer
          Wissensdatenbank und Live-System, schaffen wir maßgeschneiderte
          AI-Assistenten für Ihre Teams und autonome AI-Mitarbeiter für ganze
          Prozesse – sicher, präzise und DSGVO-konform.
        </p>

        {/* JETZT STARTEN Button (Made Smaller) */}
        <Link
          href="/register"
          className="mb-12 inline-block rounded-md bg-[#f056c1] px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-[#f056c1] focus:ring-offset-2 focus:ring-offset-[#111111]"
        >
          JETZT STARTEN
        </Link>

        {/* Tagline Element - Updated for overlapping dots and new text */}
        <div className="flex items-center space-x-3 text-gray-400">
          {/* Replace HTML dots with SVG - Adjusted size */}
          <svg
            width="48"
            height="20"
            viewBox="0 0 48 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="10" fill="#f056c1" />
            <circle cx="24" cy="10" r="10" fill="#8B5CF6" />
            <circle cx="38" cy="10" r="10" fill="#1F2937" />
          </svg>
          {/* Updated text */}
          <span>Wir automatisieren Unternehmen mit AI</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 z-10 w-full text-center text-xs text-gray-500">
        <p>© 2023-2025 EcomTask AI. Alle Rechte vorbehalten.</p>
        <p className="mt-1">
          <a
            href="https://github.com/tomallenpierce/chatbot-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
