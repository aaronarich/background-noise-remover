import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

function App() {
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [processedUrl, setProcessedUrl] = useState(null)
  const [status, setStatus] = useState('idle') // idle, loading_ffmpeg, processing, done, error
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)

  const ffmpegRef = useRef(new FFmpeg())
  const messageRef = useRef(null)

  const loadFfmpeg = async () => {
    if (ffmpegLoaded) return true;

    const ffmpeg = ffmpegRef.current
    ffmpeg.on('log', ({ message }) => {
        if (messageRef.current) messageRef.current.innerHTML = message
        console.log(message)
    })

    // Progress is 0 to 1
    ffmpeg.on('progress', ({ progress, time }) => {
        setProgress(progress)
    })

    try {
        setStatus('loading_ffmpeg')
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })
        setFfmpegLoaded(true)
        return true
    } catch (error) {
        console.error(error)
        setErrorMessage('Failed to load FFmpeg. Your browser might not support it (SharedArrayBuffer).')
        setStatus('error')
        return false
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setProcessedUrl(null)
    setStatus('idle')
    setErrorMessage('')
    setProgress(0)
  }

  const handleProcess = async () => {
    setErrorMessage('')
    setStatus('loading_ffmpeg')

    const loaded = await loadFfmpeg()
    if (!loaded) return

    setStatus('processing')
    setProgress(0)

    const ffmpeg = ffmpegRef.current

    try {
        // Write the file to memory
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

        // Execute FFmpeg command
        // Using highpass filter to remove rumble, and afftdn for noise reduction if available.
        // If afftdn fails (not in build), we might need a fallback.
        // We'll try a combo: "highpass=f=80, afftdn"
        // Note: -c:v copy copies the video stream without re-encoding (FAST!)
        // Note: -c:a aac re-encodes the audio

        await ffmpeg.exec([
            '-i', 'input.mp4',
            '-af', 'highpass=f=80, afftdn',
            '-c:v', 'copy',
            '-c:a', 'aac',
            'output.mp4'
        ])

        // Read the result
        const data = await ffmpeg.readFile('output.mp4')
        const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))

        setProcessedUrl(url)
        setStatus('done')

    } catch (error) {
        console.error(error)
        setErrorMessage('An error occurred during processing.')
        setStatus('error')
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            Noise Reducer
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">

        {/* Intro / Empty State */}
        {!videoFile && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Upload a Video</h2>
            <p className="text-gray-500 text-sm">
              Select a video to reduce background noise like talking, yelling, or wind.
            </p>

            <label className="block w-full">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="block w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl cursor-pointer hover:bg-blue-700 transition active:scale-95 shadow-md shadow-blue-200">
                Choose Video
              </span>
            </label>
          </div>
        )}

        {/* Video Preview & Actions */}
        {videoFile && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Original File Info */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 truncate max-w-[200px]">{videoFile.name}</p>
                <p className="text-xs text-gray-500">{formatSize(videoFile.size)}</p>
              </div>
              <button
                onClick={() => {
                  setVideoFile(null)
                  setVideoUrl(null)
                  setProcessedUrl(null)
                  setStatus('idle')
                }}
                className="text-gray-400 hover:text-red-500 p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Player */}
            <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-md relative">
              <video
                src={processedUrl || videoUrl}
                controls
                className="w-full h-full object-contain"
              />
              {processedUrl && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                  PROCESSED
                </div>
              )}
            </div>

            {/* Controls */}
            {status === 'processing' || status === 'loading_ffmpeg' ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>
                    {status === 'loading_ffmpeg' ? 'Loading Core (Wait a moment)...' : 'Processing audio...'}
                  </span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  This happens locally on your device. Please keep this tab open.
                </p>
                {/* Debug log area - hidden but useful if needed */}
                {/* <div ref={messageRef} className="text-[10px] text-gray-300 h-4 overflow-hidden"></div> */}
              </div>
            ) : status === 'done' && processedUrl ? (
               <div className="space-y-3">
                 <a
                   href={processedUrl}
                   download={`processed-${videoFile.name}`}
                   className="block w-full bg-green-600 text-white text-center font-semibold py-4 px-4 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200"
                 >
                   Save to Photos / Files
                 </a>
                 <button
                   onClick={() => setStatus('idle')} // Reset to allow processing again
                   className="block w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50"
                 >
                   Process Again (Tweaks?)
                 </button>
               </div>
            ) : (
              <button
                onClick={handleProcess}
                disabled={status !== 'idle' && status !== 'error'}
                className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition hover:bg-blue-700"
              >
                {status === 'error' ? 'Try Again' : 'Reduce Background Noise'}
              </button>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100">
                {errorMessage}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}

export default App
