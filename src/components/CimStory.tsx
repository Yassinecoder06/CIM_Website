import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CimBikeScene } from './cim-story/CimBikeScene'
import { cimStoryChapters, type CimStoryChapterId } from './cim-story/storyScene'

export function CimStory() {
  const [active, setActive] = useState<CimStoryChapterId>(cimStoryChapters[0].id)
  const [progress, setProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const chapterRefs = useRef<Array<HTMLElement | null>>([])
  const layoutRef = useRef<HTMLDivElement>(null)
  const activeChapter = cimStoryChapters.find((chapter) => chapter.id === active) ?? cimStoryChapters[0]

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(visible.target.id as CimStoryChapterId)
    }, { threshold: [0.35, 0.6] })
    chapterRefs.current.forEach((chapter) => chapter && observer.observe(chapter))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    updateMotion()
    media.addEventListener('change', updateMotion)
    return () => media.removeEventListener('change', updateMotion)
  }, [])

  useEffect(() => {
    let frame = 0
    const updateProgress = () => {
      frame = 0
      const layout = layoutRef.current
      if (!layout) return
      const rect = layout.getBoundingClientRect()
      const travel = Math.max(1, rect.height - window.innerHeight)
      setProgress(Math.max(0, Math.min(1, -rect.top / travel)))
    }
    const queueUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress)
    }
    updateProgress()
    window.addEventListener('scroll', queueUpdate, { passive: true })
    window.addEventListener('resize', queueUpdate)
    return () => {
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', queueUpdate)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  function focusChapter(index: number) {
    chapterRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <section className="cim-story" id="story" aria-labelledby="story-title">
      <div className="story-intro"><div><span className="eyebrow eyebrow--yellow">CIM // 3D SCROLL STORY</span><h2 id="story-title">A machine is<br />a lesson in motion.</h2></div><p>A motorcycle is not the subject of CIM—it is a learning lens. Scroll to move through its systems and follow the practical engineering path from signal to complete machine.</p></div>
      <div className="story-layout" ref={layoutRef} style={{ '--story-progress': progress } as CSSProperties}>
        <aside className="story-machine" data-stage={active} aria-label="Interactive 3D motorcycle engineering scene">
          <CimBikeScene reducedMotion={reducedMotion} />
          <div className="story-machine__top"><span>ENGINEERING STORY // {activeChapter.index}</span><span>{activeChapter.focus}</span></div>
          <div className="story-machine__telemetry"><span>SCROLL INPUT</span><b>{String(Math.round(progress * 100)).padStart(3, '0')}%</b><i aria-hidden="true" /></div>
          <div className="story-machine__footer"><span>MAP</span><i aria-hidden="true" /><span>SENSE</span><i aria-hidden="true" /><span>OPEN</span><i aria-hidden="true" /><span>REASSEMBLE</span></div>
          <nav className="story-progress" aria-label="CIM engineering story chapters">{cimStoryChapters.map((chapter, index) => <button type="button" key={chapter.id} className={active === chapter.id ? 'is-active' : ''} aria-current={active === chapter.id ? 'step' : undefined} onClick={() => focusChapter(index)}><span>{chapter.index}</span><b>{chapter.kicker}</b></button>)}</nav>
        </aside>
        <div className="story-chapters">{cimStoryChapters.map((chapter, index) => <article className="story-chapter" id={chapter.id} data-timeline-marker={chapter.timelineMarker} key={chapter.id} ref={(element) => { chapterRefs.current[index] = element }}><div className="story-chapter__panel"><span className="story-chapter__index">{chapter.index}</span><div><span className="eyebrow eyebrow--yellow">{chapter.kicker} // CIM</span><h3>{chapter.title}</h3><p>{chapter.copy}</p></div></div><span className="story-chapter__rule" aria-hidden="true" /></article>)}</div>
      </div>
    </section>
  )
}
