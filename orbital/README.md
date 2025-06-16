# Orbital: 3D RSS Feed Reader

Orbital is a beautiful spatial RSS feed reader built with React, Vite, and Three.js. Upload an OPML file to visualize your feeds as animated 3D cards in a stunning environment. Feeds auto-refresh every 15 seconds, and cards animate smoothly in and out.

## Features
- OPML upload for easy feed import
- 3D spatial card layout using Three.js and React Three Fiber
- Smooth card animations with Framer Motion
- Auto-refreshes feeds every 15 seconds
- Modern, responsive UI

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the app in your browser (usually at http://localhost:5173)
4. Upload your OPML file to see your feeds in 3D!

## Running with Docker

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

### Steps

1. **Build the Docker image:**
   ```bash
   docker-compose build
   ```
2. **Start the application:**
   ```bash
   docker-compose up
   ```
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000](http://localhost:3000)

3. **Stop the application:**
   Press `Ctrl+C` in the terminal, then run:
   ```bash
   docker-compose down
   ```

### Notes
- Rebuild the image after code changes:
  ```bash
  docker-compose build
  docker-compose up
  ```
- For development, consider using Docker volumes or bind mounts for live code updates.

## Tech Stack
- React + Vite
- TypeScript
- Three.js, @react-three/fiber, @react-three/drei
- Framer Motion
- rss-parser, opmlparser

---

Replace placeholder assets and styles as desired for your own branding.
