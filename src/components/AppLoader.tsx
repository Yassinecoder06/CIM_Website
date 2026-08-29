import { useEffect, useState, useRef, type CSSProperties } from 'react'
import { clubMemories } from '../data/memories'

const CRITICAL_IMAGES = [
  '/assets/cim-logo-source.jpeg',
  '/assets/systems/motorcycle-exploded.png',
  '/assets/cim-bike/cim-I-badge.png',
  '/assets/cim-bike/cim-bike-frame-brand.png',
  '/assets/cim-bike/cim-bike-wheel-brand.png',
  ...clubMemories.slice(0, 8).map(m => m.image),
]

const MIN_DISPLAY_MS = 900

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

export function AppLoader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Preparing visual system')
  const [fadeOut, setFadeOut] = useState(false)
  const doneRef = useRef(false)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    let cancelled = false
    let bikeProgress = 0
    let imagesProgress = 0
    let fontsDone = false
    let windowDone = false

    const update = () => {
      if (cancelled) return
      // Weighted progress: bike 55%, images 35%, fonts+window 10%
      const total = Math.round(bikeProgress * 0.55 + imagesProgress * 0.35 + (fontsDone && windowDone ? 10 : 0))
      setProgress(Math.min(99, total))
    }

    const tryDone = () => {
      if (doneRef.current) return
      const bikeReady = bikeProgress >= 100
      const imagesReady = imagesProgress >= 100
      // Need at least fonts or window, but bike+images are critical
      if (bikeReady && imagesReady && fontsDone) {
        const elapsed = Date.now() - startTimeRef.current
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
        doneRef.current = true
        setProgress(100)
        setMessage('System ready')
        window.setTimeout(() => {
          setFadeOut(true)
          // Dispatch global ready for any other listeners
          window.dispatchEvent(new CustomEvent('cim:app-ready'))
          // Hide static HTML loader if still present
          document.getElementById('app-loader-static')?.remove()
          document.documentElement.classList.remove('is-loading')
          window.setTimeout(onDone, 520)
        }, remaining)
      }
    }

    // 1. Fonts
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { fontsDone = true; update(); tryDone() }).catch(() => { fontsDone = true; update(); tryDone() })
    } else {
      fontsDone = true
    }

    // 2. Window load (all images via browser)
    if (document.readyState === 'complete') {
      windowDone = true
    } else {
      window.addEventListener('load', () => { windowDone = true; update(); tryDone() }, { once: true })
      // Fallback: if load never fires (e.g. in test), mark done after 2s
      window.setTimeout(() => { if (!windowDone) { windowDone = true; update(); tryDone() } }, 2000)
    }

    // 3. Preload critical images
    setMessage('Loading imagery')
    let loadedImages = 0
    const totalImages = CRITICAL_IMAGES.length
    const onImageTick = () => {
      loadedImages++
      imagesProgress = Math.round((loadedImages / totalImages) * 100)
      setMessage(loadedImages < totalImages ? `Loading imagery ${loadedImages}/${totalImages}` : 'Imagery ready')
      update()
      tryDone()
    }
    CRITICAL_IMAGES.forEach(src => {
      preloadImage(src).then(onImageTick)
    })
    // Safety: if images stall, mark done after 4s
    window.setTimeout(() => {
      if (imagesProgress < 100) {
        imagesProgress = 100
        update()
        tryDone()
      }
    }, 4000)

    // 4. Bike progress via custom events from CimBikeScene
    const onBikeProgress = (e: Event) => {
      const detail = (e as CustomEvent<{ progress?: number; message?: string }>).detail
      if (typeof detail?.progress === 'number') {
        bikeProgress = Math.max(bikeProgress, Math.min(100, Math.round(detail.progress)))
        if (detail.message) setMessage(detail.message)
        update()
        tryDone()
      }
    }
    const onBikeReady = () => {
      bikeProgress = 100
      setMessage('Bike assembly ready')
      update()
      tryDone()
    }
    const onBikeFallback = () => {
      bikeProgress = 100
      update()
      tryDone()
    }

    window.addEventListener('cim:bike-progress', onBikeProgress as EventListener)
    window.addEventListener('cim:bike-ready', onBikeReady)
    window.addEventListener('cim:bike-fallback', onBikeFallback)
    // If reduced-motion, bike will be fallback immediately - check after short delay
    window.setTimeout(() => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        bikeProgress = 100
        update()
        tryDone()
      }
    }, 600)

    // Initial tick
    update()

    return () => {
      cancelled = true
      window.removeEventListener('cim:bike-progress', onBikeProgress as EventListener)
      window.removeEventListener('cim:bike-ready', onBikeReady)
      window.removeEventListener('cim:bike-fallback', onBikeFallback)
    }
  }, [onDone])

  return (
    <div className={`app-loader ${fadeOut ? 'app-loader--out' : ''}`} role="status" aria-live="polite" aria-label="Loading CIM site">
      <div className="app-loader__bg" aria-hidden="true" />
      <div className="app-loader__card">
        <div className="app-loader__header">
          <span className="app-loader__eyebrow">CIM // SYSTEM BOOT</span>
          <span className="app-loader__version">REV 01 — TUNISIA</span>
        </div>
        <div className="app-loader__word" aria-hidden="true">CIM</div>
        <h1 className="app-loader__title">
          Engineering<br />
          <em>into</em> action.
        </h1>
        <p className="app-loader__message">{message}</p>
        <div className="app-loader__meter" style={{ '--app-load-progress': `${progress}%` } as CSSProperties} aria-hidden="true">
          <i />
        </div>
        <div className="app-loader__footer">
          <span>{String(Math.round(progress)).padStart(3, '0')}% // BUFFER</span>
          <span>IMAGES + BICYCLE + FONTS</span>
        </div>
      </div>
      <div className="app-loader__grid" aria-hidden="true" />
    </div>
  )
}
