import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

export default function LiveVideo({ src, onError, className = 'camera-video', videoRef: externalRef }) {
  const internalRef = useRef(null)
  const videoRef = externalRef ?? internalRef
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setPlaying(false)
    const video = videoRef.current
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onErrorRef.current?.()
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      return () => hls.destroy()
    }
    // Safari plays HLS natively
    video.src = src
  }, [src])

  return (
    <>
      <video
        ref={videoRef}
        className={className}
        /* lets frames be read for detection when Safari plays the stream natively */
        crossOrigin="anonymous"
        autoPlay
        muted
        playsInline
        onPlaying={() => setPlaying(true)}
        onError={() => onErrorRef.current?.()}
      />
      {!playing && (
        // Camera servers are slow; a few seconds of black screen otherwise looks broken
        <div className="video-buffering" role="status">
          <span className="video-buffering-spinner" />
          กำลังโหลดวิดีโอ…
        </div>
      )}
    </>
  )
}
