# Roley

Multi-video Recorder using Svelte and ffmpeg.wasm
This project is a web-based multi-video recorder that leverages Svelte as the core framework and ffmpeg.wasm library to record videos from the device camera. The app allows users to record multiple videos from their device camera and merge them into a single video.

## Technologies

- SvelteKit
- ffmpeg.wasm
- Postgres

## Features

- Video recording from device camera
- Merging of multiple videos into a single one
- Video preview
- User-friendly UI/UX
- Download of the final video

## Dependencies

Use `docker compose up -d` to run the dependencies in local containers.

List:

- Postgres

## Development

1. Install dependencies `pnpm i`
2. Copy file `.env.example` to `.env` and fill it with values
3. Run the development server `pnpm dev`
4. Commit to the `main` branch to deploy to Vercel

## Deployment to another hosting

1. Install dependencies, fill `.env` file and build project `pnpm i && pnpm build`
2. Copy the `build` folder to your hosting
3. Configure your hosting to serve `index.html` for all routes
