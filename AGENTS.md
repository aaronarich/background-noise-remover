# FFmpeg Core Files

The FFmpeg core files (js, wasm, worker) are located in `public/ffmpeg/core` (single-threaded) and `public/ffmpeg/core-mt` (multi-threaded).

These files were manually copied from `@ffmpeg/core@0.12.6` and `@ffmpeg/core-mt@0.12.6` npm packages to ensure they are available reliably without depending on external CDNs like unpkg.

If you need to update the FFmpeg version:
1.  Install the new version of `@ffmpeg/core` or `@ffmpeg/core-mt`.
2.  Copy the distributable files from `node_modules` to the respective folders in `public/ffmpeg/`.
3.  Update the version in `package.json` if you decide to keep the dependencies, or just document the version here.
