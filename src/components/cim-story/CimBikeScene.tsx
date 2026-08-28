import { useEffect, useRef, useState, type CSSProperties } from 'react'

const sceneFile = '/assets/cim-bike/Scroll%20Bike.glb'
type SceneState = 'loading' | 'ready' | 'fallback'
type SceneRuntime = {
  composer?: unknown
  renderer?: { autoClear: boolean }
  scene?: { getObjectByName?: (name: string) => { visible: boolean, removeFromParent?: () => void, parent?: unknown, traverse?: (cb: (obj: { name: string, visible: boolean, removeFromParent?: () => void }) => void) => void } & Record<string, unknown> }
  mainCameraComponent?: {
    _backgroundColor?: { alpha: number }
    applyClearFlags?: () => void
  }
}

function hideNeedleLogo() {
  try {
    // Hide any Needle Engine watermark / logo elements in the DOM
    document.querySelectorAll('needle-logo-element').forEach((el) => {
      (el as HTMLElement).style.display = 'none'
      el.remove()
    })
    document.querySelectorAll('.needle-non-commercial-use, .needle-forbidden').forEach((el) => {
      (el as HTMLElement).style.display = 'none'
      el.remove()
    })
  } catch {}
  try {
    const engineEl = document.querySelector('needle-engine') as unknown as { shadowRoot?: ShadowRoot }
    const sr = engineEl?.shadowRoot
    if (sr) {
      sr.querySelectorAll('needle-logo-element, .needle-non-commercial-use').forEach((el) => {
        (el as HTMLElement).style.display = 'none'
        el.remove()
      })
      sr.querySelectorAll('*').forEach((n: Element) => {
        const src = (n as HTMLImageElement).src ?? ''
        if (src.includes('poweredbyneedle') || src.includes('needle')) {
          (n as HTMLElement).style.display = 'none'
          n.remove()
        }
      })
    }
  } catch {}
}

function hideNeedleLogoFromScene(runtime: SceneRuntime) {
  const scene = runtime.scene as unknown as { traverse?: (cb: (obj: Record<string, unknown>) => void) => void } | undefined
  if (!scene?.traverse) return
  try {
    scene.traverse((obj: Record<string, unknown>) => {
      const name = ((obj as { name?: string }).name ?? '').toLowerCase()
      if (name.includes('needle')) {
        const anyObj = obj as { visible?: boolean, removeFromParent?: () => void }
        try { anyObj.removeFromParent?.() ?? (anyObj.visible = false) } catch {}
      }
      const mat = (obj as { material?: unknown }).material as { name?: string } | { name?: string }[] | undefined
      const mats = mat ? (Array.isArray(mat) ? mat : [mat]) : []
      for (const m of mats as Array<{ name?: string }>) {
        if ((m.name ?? '').toLowerCase().includes('needle')) {
          try { (obj as { visible?: boolean }).visible = false } catch {}
        }
      }
    })
  } catch {}
}

function hideCactusFromScene(runtime: SceneRuntime) {
  const scene = runtime.scene as unknown as { getObjectByName?: (n: string) => { name: string, visible: boolean, removeFromParent?: () => void }, traverse?: (cb: (o: { name: string, visible: boolean, removeFromParent?: () => void }) => void) => void } | undefined
  if (!scene) return
  const hide = (name: string) => {
    try {
      const obj = scene.getObjectByName?.(name)
      if (obj?.removeFromParent) {
        obj.removeFromParent()
      } else if (obj) {
        obj.visible = false
      }
    } catch { /* ignore */ }
  }
  hide('Model')
  hide('CactusBig')
  hide('Cactus')
  // Fallback: traverse entire scene and remove any cactus-like object.
  try {
    const s = scene as { traverse?: (cb: (o: { name: string }) => void) => void }
    if (s.traverse) {
      const toRemove: Array<{ name: string, removeFromParent?: () => void, visible?: boolean }> = []
      s.traverse((obj: { name: string, removeFromParent?: () => void, visible?: boolean }) => {
        if (obj.name === 'CactusBig' || obj.name === 'Model') toRemove.push(obj as never)
        if (obj.name.toLowerCase().includes('cactus')) toRemove.push(obj as never)
      })
      for (const obj of toRemove) {
        try { obj.removeFromParent?.() ?? ((obj as { visible?: boolean }).visible = false) } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
}

function brandBikeWithCIM(runtime: SceneRuntime) {
  const scene = runtime.scene as unknown as { traverse: (cb: (obj: Record<string, unknown>) => void) => void } | undefined
  if (!scene?.traverse) return
  // Dynamic import avoids bundling Three in the test environment and keeps
  // the rebranding side-effect free if the loader fails.
  // @ts-ignore
  void import('three').then(({ TextureLoader, SRGBColorSpace, CanvasTexture, RepeatWrapping }) => {
    const loader = new TextureLoader()

    const applyToLogo = (tex: unknown) => {
      try {
        const t = tex as { colorSpace: unknown, flipY: boolean, needsUpdate: boolean, wrapS?: unknown, wrapT?: unknown, offset?: { set: (x:number,y:number)=>void }, repeat?: { set: (x:number,y:number)=>void } }
        // GLTF KHR_texture_transform uses offset 0,1 / scale 1,-1 to flip Y
        t.colorSpace = SRGBColorSpace
        t.flipY = false
        // @ts-ignore offset/repeat exist on Texture
        if ((t as unknown as { offset?: unknown }).offset) {
          try { (t as unknown as { offset: { set:(x:number,y:number)=>void } }).offset.set(0, 1); } catch {}
          try { (t as unknown as { repeat: { set:(x:number,y:number)=>void } }).repeat.set(1, -1); } catch {}
        }
        t.needsUpdate = true
        if ('wrapS' in t) {
          (t as { wrapS: unknown }).wrapS = RepeatWrapping
          ;(t as { wrapT: unknown }).wrapT = RepeatWrapping
        }
      } catch { /* ignore */ }
      try {
        if (!scene?.traverse) return
        scene.traverse((obj: Record<string, unknown>) => {
          const mat = (obj as { material?: unknown }).material as { name?: string, map?: unknown, needsUpdate?: boolean } | { name?: string, map?: unknown, needsUpdate?: boolean }[] | undefined
          if (!mat) return
          const mats = Array.isArray(mat) ? mat : [mat]
          for (const m of mats as Array<{ name?: string, map?: unknown, needsUpdate?: boolean }>) {
            const name = (m.name ?? '') as string
            const objName = (obj as { name?: string }).name ?? ''
            // schild_RobertS_logo is the branded plate on the frame (material Bike_Logo)
            if (name === 'Bike_Logo' || objName.includes('schild') || objName.toLowerCase().includes('logo')) {
              m.map = tex as never
              m.needsUpdate = true
            }
          }
        })
      } catch { /* ignore */ }
    }

    const applyToWheel = (tex: unknown) => {
      try {
        const t = tex as { colorSpace: unknown, flipY: boolean, needsUpdate: boolean, offset?: unknown, repeat?: unknown }
        t.colorSpace = SRGBColorSpace
        t.flipY = false
        // Handle KHR_texture_transform flip
        try { (t as unknown as { offset: { set:(x:number,y:number)=>void } }).offset?.set(0, 1); } catch {}
        try { (t as unknown as { repeat: { set:(x:number,y:number)=>void } }).repeat?.set(1, -1); } catch {}
        t.needsUpdate = true
      } catch { /* ignore */ }
      try {
        if (!scene?.traverse) return
        scene.traverse((obj: Record<string, unknown>) => {
          const mat = (obj as { material?: unknown }).material as { name?: string, map?: unknown, needsUpdate?: boolean } | undefined
          const mats = mat ? (Array.isArray(mat) ? mat : [mat]) : []
          let applied = false
          for (const m of mats as Array<{ name?: string, map?: unknown, needsUpdate?: boolean }>) {
            const n = (m.name ?? '').toLowerCase()
            // Apply to any wheel-related material: inner/outer tire and rim
            if (n === 'reifen_innen' || n === 'reifen' || n.includes('felge') || n.includes('tire') || n.includes('wheel')) {
              // Clone material if shared to avoid affecting other meshes
              m.map = tex as never
              m.needsUpdate = true
              applied = true
            }
          }
          // Fallback by object name if material name didn't match (e.g. carbon frame has no wheel mat name)
          const objName = (obj as { name?: string }).name ?? ''
          const lowerObj = objName.toLowerCase()
          if (!applied && (lowerObj.includes('reifen') || lowerObj.includes('felge') || lowerObj.includes('wheel') || lowerObj.includes('tire') || lowerObj.includes('rim'))) {
            for (const m of mats as Array<{ name?: string, map?: unknown, needsUpdate?: boolean }>) {
              m.map = tex as never
              m.needsUpdate = true
            }
          }
        })
      } catch { /* ignore */ }
    }

    // User request: replace circular R badge on carbon frame with I (Instrumentation)
    loader.load('/assets/cim-bike/cim-I-badge.png', applyToLogo as never, undefined, () => {
      // Fallback: try CIM frame brand, then generate canvas I
      loader.load('/assets/cim-bike/cim-bike-frame-brand.png', applyToLogo as never, undefined, () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 512; canvas.height = 512
          const ctx = canvas.getContext('2d')!
          ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 512, 512)
          ctx.fillStyle = 'black'; ctx.font = 'bold 150px \"Space Grotesk\", sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.save()
          ctx.translate(256, 250)
          // @ts-ignore canvas transform
          ctx.transform(1, 0, 0.15, 1, 0, 0)
          ctx.fillText('I', 0, 0)
          ctx.restore()
          const tex = new CanvasTexture(canvas)
          tex.colorSpace = SRGBColorSpace
          tex.flipY = false
          tex.needsUpdate = true
          applyToLogo(tex)
        } catch { /* ignore */ }
      })
    })

    // Apply CIM wheel brand to wheels (outer tire / rim) - white CIM on black
    loader.load('/assets/cim-bike/cim-bike-wheel-brand.png', applyToWheel as never, undefined, () => {
      // Wheel fallback uses the frame texture mirrored
      loader.load('/assets/cim-bike/cim-bike-frame-brand.png', applyToWheel as never)
    })


  }).catch(() => { /* ignore bundling errors in tests */ })
}

function CimSceneLoader({ progress, message }: { progress: number, message: string }) {
  return <div className="cim-bike-loader" role="status" aria-live="polite" aria-label={`CIM 3D scene: ${message}`}>
    <span className="cim-bike-loader__word" aria-hidden="true">CIM</span>
    <div className="cim-bike-loader__content">
      <span className="cim-bike-loader__eyebrow">CIM // SYSTEM BOOT</span>
      <strong>Loading bike<br />assembly</strong>
      <p>{message}</p>
      <div className="cim-bike-loader__meter" style={{ '--cim-load-progress': `${progress}%` } as CSSProperties} aria-hidden="true"><i /></div>
      <span className="cim-bike-loader__progress">{String(Math.round(progress)).padStart(3, '0')}% // RAM BUFFER</span>
    </div>
  </div>
}

export function CimBikeScene({ reducedMotion }: { reducedMotion: boolean }) {
  return <CimBikeSceneInstance key={reducedMotion ? 'reduced-motion' : 'full-motion'} reducedMotion={reducedMotion} />
}

function CimBikeSceneInstance({ reducedMotion }: { reducedMotion: boolean }) {
  const engine = useRef<HTMLElement>(null)
  const [state, setState] = useState<SceneState>(reducedMotion ? 'fallback' : 'loading')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Preparing visual system')
  const [sceneSource, setSceneSource] = useState<string>()

  useEffect(() => {
    if (reducedMotion) return

    const element = engine.current
    if (!element) return
    let disposed = false
    let objectUrl: string | undefined
    const controller = new AbortController()

    const showFallback = () => {
      if (!disposed) setState('fallback')
    }
    const updateRuntimeProgress = (event: Event) => {
      const total = (event as CustomEvent<{ totalProgress01?: number }>).detail?.totalProgress01
      if (typeof total === 'number') setProgress(Math.max(90, Math.min(99, 90 + total * 9)))
    }
    const complete = () => {
      if (disposed) return
      // This authored scene's post-processing pass clears its transparent output
      // on some browser/GPU combinations. Keep the scene camera's direct render
      // path, with an opaque technical background, so the actual bike is visible.
      const runtime = (element as HTMLElement & { context?: SceneRuntime }).context
      if (runtime) {
        runtime.composer = null
        if (runtime.renderer) runtime.renderer.autoClear = true
        if (runtime.mainCameraComponent?._backgroundColor) {
          runtime.mainCameraComponent._backgroundColor.alpha = 1
          runtime.mainCameraComponent.applyClearFlags?.()
        }
        // Delete the cactus that appears at the end of the timeline (user request).
        // The original GLB contains Model/CactusBig which is enabled via an
        // ActivationTrack at t=28.3. Removing it from the scene keeps the
        // authored timeline intact but prevents the cactus from ever being seen.
        hideCactusFromScene(runtime)
        hideNeedleLogo()
        hideNeedleLogoFromScene(runtime)
        // Rebrand any textual logo on the bike with CIM assets.
        // Frame plate (Bike_Logo / schild_RobertS_logo) R -> I: cim-I-badge.png (white circle, black I)
        // Wheel tire sidewall (Reifen_innen) -> cim-bike-wheel-brand.png (white CIM on black, 4-up)
        brandBikeWithCIM(runtime)
        // Also schedule a follow-up hide+brand in case the timeline re-adds or
        // late-spawns the materials during the first few frames of evaluation.
        window.setTimeout(() => {
          try { hideCactusFromScene(runtime); hideNeedleLogo(); hideNeedleLogoFromScene(runtime); brandBikeWithCIM(runtime) } catch { /* ignore */ }
        }, 300)
        window.setTimeout(() => {
          try { hideCactusFromScene(runtime); hideNeedleLogo(); hideNeedleLogoFromScene(runtime); brandBikeWithCIM(runtime) } catch { /* ignore */ }
        }, 1200)
      }
      setProgress(100)
      setMessage('Scene ready')
      window.requestAnimationFrame(() => {
        if (!disposed) setState('ready')
      })
    }

    element.addEventListener('error', showFallback)
    element.addEventListener('progress', updateRuntimeProgress)
    element.addEventListener('loadfinished', complete)

    void (async () => {
      try {
        setMessage('Buffering bike asset in memory')
        setProgress(15)
        const response = await fetch(sceneFile, { signal: controller.signal })
        if (!response.ok) throw new Error(`Bike asset request failed (${response.status})`)
        const asset = await response.arrayBuffer()
        if (disposed) return

        setProgress(76)
        setMessage('Initializing 3D renderer')
        objectUrl = URL.createObjectURL(new Blob([asset], { type: 'model/gltf-binary' }))
        await import('@needle-tools/engine')
        if (disposed) return

        setProgress(90)
        setMessage('Building interactive assembly')
        setSceneSource(JSON.stringify([objectUrl]))
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) showFallback()
      }
    })()

    return () => {
      disposed = true
      controller.abort()
      element.removeEventListener('error', showFallback)
      element.removeEventListener('progress', updateRuntimeProgress)
      element.removeEventListener('loadfinished', complete)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [reducedMotion])

  const fallback = state === 'fallback'
  const loading = state === 'loading'

  return <div className={`cim-bike-scene${loading ? ' cim-bike-scene--loading' : ''}`}>
    {fallback && <div className="cim-bike-scene__fallback" aria-hidden="true"><img src="/assets/systems/motorcycle-exploded.png" alt="" /></div>}
    {!fallback && <needle-engine ref={engine} src={sceneSource} contactshadows="1" focus-rect=".cim-story__focus" loading-blur="" aria-hidden="true"><div className="cim-story__focus" /></needle-engine>}
    {loading && <CimSceneLoader progress={progress} message={message} />}
  </div>
}
