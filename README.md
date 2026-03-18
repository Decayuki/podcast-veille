# podcast-veille

PWA Next.js pour écouter les épisodes de veille tech/IA/dev générés automatiquement.

## Architecture

```
Résumés #veille (texte)
  → generate-podcast.sh
    → generate-podcast.py
      → Gemini API (script dialogue FR)
      → Edge TTS (DeniseNeural + HenriNeural)
      → ffmpeg (MP3 final)
    → public/audio/YYYY-MM-DD.mp3
    → public/episodes.json (mise à jour)
    → public/podcast.xml (RSS régénéré)
    → git push → Vercel redéploie
```

## Setup

### Dépendances Python

```bash
pip install google-generativeai edge-tts
brew install ffmpeg
```

### Variables d'environnement

```bash
cp .env.example .env
# Renseigner GOOGLE_API_KEY
```

### Next.js

```bash
npm install
npm run dev
```

## Générer un épisode

```bash
# Depuis Sally (SSH)
ssh marc@100.112.192.17 '/Users/marc/dev/scripts/generate-podcast.sh /tmp/veille.txt'

# En local
/Users/marc/dev/scripts/generate-podcast.sh veille.txt 2026-03-18
```

## Déploiement

Vercel (compte Decayuki) — auto-deploy sur push main.

```bash
vercel --prod
```

## RSS Feed

- URL web : `https://podcast-veille.vercel.app/podcast.xml`
- Compatible Apple Podcasts, AntennaPod, Podcast Addict

## Icônes PWA

Pour générer les icônes PNG (requis pour l'installation sur iOS) :

```bash
# Avec Inkscape ou convert (ImageMagick)
convert public/icons/icon.svg -resize 192x192 public/icons/icon-192.png
convert public/icons/icon.svg -resize 512x512 public/icons/icon-512.png
```
