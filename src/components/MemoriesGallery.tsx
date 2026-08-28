import { clubMemories, type ClubMemory } from '../data/memories'

function MemoryRow({ memories, direction }: { memories: ClubMemory[], direction: 'forward' | 'reverse' }) {
  const loop = [...memories, ...memories]
  return <div className={`memory-row memory-row--${direction}`} role="list">
    {loop.map((memory, index) => <figure className={`memory-card memory-card--${memory.orientation}`} key={`${memory.id}-${index}`} role="listitem" aria-hidden={index >= memories.length || undefined}>
      <img src={memory.image} alt={index < memories.length ? memory.alt : ''} loading={index < 4 ? 'eager' : 'lazy'} />
      <figcaption>FRAME // {memory.id}</figcaption>
    </figure>)}
  </div>
}

export function MemoriesGallery() {
  const midpoint = Math.ceil(clubMemories.length / 2)
  const frameCount = String(clubMemories.length).padStart(2, '0')
  return <section className="memories-section" id="memories" aria-labelledby="memories-title">
    <div className="section-intro section-intro--light">
      <div><span className="eyebrow">CIM // PHOTO MEMORY BANK</span><h2 id="memories-title">The moments<br />we build together.</h2></div>
      <p>Beyond the systems and sessions, CIM is a shared record of visits, learning, teamwork, and the people who make each experience matter.</p>
    </div>
    <div className="memories-gallery" aria-label="Scrolling gallery of CIM club memories">
      <div className="memories-gallery__rail"><MemoryRow memories={clubMemories.slice(0, midpoint)} direction="forward" /></div>
      <div className="memories-gallery__rail"><MemoryRow memories={clubMemories.slice(midpoint)} direction="reverse" /></div>
      <span className="memories-gallery__axis" aria-hidden="true" />
    </div>
    <div className="memories-footer"><span>{frameCount} SHARED FRAMES // CIM ARCHIVE</span><p>Pause on hover or swipe through the gallery to take in each moment.</p></div>
  </section>
}
