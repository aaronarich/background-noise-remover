# Noise Reducer PWA

A privacy-focused, client-side Progressive Web App (PWA) to reduce background noise in videos.
Built with React, Vite, Tailwind CSS, and `ffmpeg.wasm`.

## Features
- **100% Client-Side:** Videos are processed locally on your device. No data is uploaded to any server.
- **Noise Reduction:** Uses FFmpeg's `afftdn` (Audio FFT DeNoise) and High-pass filters to reduce background noise like wind, hum, and chatter.
- **PWA Ready:** Installable on iOS and Android.
- **Mobile First:** Designed for touch interfaces.

## Usage

1. **Upload:** Select a video file from your library.
2. **Process:** Click "Reduce Background Noise". The app will download the necessary FFmpeg core (approx 25MB) once.
3. **Save:** Preview the result and save it to your device.

## Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Dev Server:**
   ```bash
   npm run dev
   ```
   *Note: The dev server is configured to serve the required `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers.*

3. **Build:**
   ```bash
   npm run build
   ```

## Deployment

### Cloudflare Pages (Recommended)
This project is pre-configured for Cloudflare Pages.
1. Connect your repository to Cloudflare Pages.
2. Set the build command to `npm run build` and output directory to `dist`.
3. The included `public/_headers` file ensures the necessary security headers are served for `SharedArrayBuffer` support.

### Other Hosting
If deploying elsewhere (Vercel, Netlify, etc.), you **must** configure the server to return these response headers, or `ffmpeg.wasm` will fail to load:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## Credits
- [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) for the browser-based processing power.
