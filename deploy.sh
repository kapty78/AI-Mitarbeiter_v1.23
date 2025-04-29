#!/bin/bash

# Vercel-Deployment-Skript
cd "$(dirname "$0")"
echo "Deploying to Vercel..."

# Umgebungsvariablen setzen
export NEXT_TELEMETRY_DISABLED=1
export FORCE_BUILDER_REUSE=1
export SKIP_TYPECHECKING=true

# Installiere Vercel CLI falls nötig
npm install -g vercel

# Führe Deployment aus
vercel --prod --yes

echo "Deployment abgeschlossen." 