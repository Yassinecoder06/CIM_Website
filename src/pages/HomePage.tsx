import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { activityAreas, events, team, timeline } from '../data/content'
import { MemoriesGallery } from '../components/MemoriesGallery'
import { CimStory } from '../components/CimStory'
import { SiteFooter } from '../components/SiteFooter'
import { TechnicalLabel } from '../components/TechnicalLabel'

const filters = [
  { label: 'All', values: [] },
  { label: 'Workshops', values: ['Workshop'] },
  { label: 'Industrial Visits', values: ['Industrial Visit'] },
  { label: 'Training', values: ['Training'] },
  { label: 'Competitions', values: ['Competition'] },
  { label: 'Conferences', values: ['Conference'] },
  { label: 'Projects', values: ['Project'] },
  { label: 'Other', values: ['Other'] }
]

function EventFallback({ eventId }: { eventId: string }) {
  const seed = eventId.split('-').slice(0, 2).join(' // ').toUpperCase()
  return <div className="event-fallback" aria-hidden="true"><span>ARCHIVE // 2025</span><strong>{seed}</strong><i /><i /><i /><b>⌁</b></div>
}

export function HomePage() {
  const [activeArea, setActiveArea] = useState('instrumentation')
  const [filter, setFilter] = useState('All')
  const active = activityAreas.find((area) => area.id === activeArea) ?? activityAreas[0]
  const filteredEvents = useMemo(() => {
    const selected = filters.find((item) => item.label === filter)
    return !selected?.values.length ? events : events.filter((event) => selected.values.includes(event.type))
  }, [filter])

  return <>
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <TechnicalLabel>INSAT // TUNISIA</TechnicalLabel>
          <h1 id="hero-title">Engineering<br /><em>into</em> action.</h1>
          <div className="hero__manifesto"><span className="hero__index">01</span><p><strong>Club INSAT Maintenance</strong><br />Where engineering students turn theory into practical industrial knowledge.</p></div>
          <p className="hero__intro">Workshops, technical exploration, industry connection, and hands-on learning—built by students since 2013.</p>
          <div className="hero__actions"><a className="button button--primary" href="#about">Discover CIM <span aria-hidden="true">↓</span></a><Link to="/join" className="button button--outline">Join the club <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="hero__visual hero__visual--intro"><div className="hero__coordinates"><span>X 38.730</span><span>Y 9.163</span><span>REV 01</span></div><div className="hero-system-intro"><span>THEORY</span><i /><span>PRACTICE</span><i /><span>INDUSTRY</span><strong>CIM<br />SYSTEM<br />01</strong></div><div className="hero__note">CIM // SCROLL STORY<br /><b>Trace the system</b></div></div>
      </section>

      <CimStory />

      <section className="about-section" id="about" aria-labelledby="about-title">
        <div className="about-intro"><div><span className="eyebrow">CIM // 2013–NOW</span><h2 id="about-title">Built by engineers.<br /><span>Driven by curiosity.</span></h2></div><div className="about-intro__copy"><p>Founded by INSAT students in 2013, CIM is an industrial-oriented student club focused on helping future engineers connect learning with the systems, tools, and contexts of professional life.</p><p>Through technical workshops, industrial visits, professional training, and technology exploration, we make room for practical engineering.</p></div></div>
        <div className="about-grid"><div className="brand-asset"><span>IDENTITY // CIM</span><img src="/assets/cim-logo-source.jpeg" alt="CIM brand mark" loading="lazy" /><small>Supplied club artwork</small></div><div className="timeline"><span className="eyebrow">VERIFIED TIMELINE</span>{timeline.map((item, index) => <article key={item.year} className="timeline-item"><span className="timeline-item__line" aria-hidden="true" /><span className="timeline-item__year">{item.year}</span><div><h3>{item.title}</h3><p>{item.description}</p>{index === timeline.length - 1 && <small>Further archive milestones can be added when verified.</small>}</div></article>)}</div></div>
      </section>

      <section className="activities-section" id="what-we-do" aria-labelledby="activities-title">
        <div className="section-intro"><div><span className="eyebrow">OPERATING AREAS // 06</span><h2 id="activities-title">What we do.</h2></div><p>CIM moves across the technical systems behind contemporary industry. Select an area to inspect its focus.</p></div>
        <div className="activity-layout"><div className="activity-grid" role="list">{activityAreas.map((area) => <button key={area.id} type="button" className={`activity-card ${area.id === activeArea ? 'is-active' : ''}`} onClick={() => setActiveArea(area.id)} role="listitem" aria-pressed={area.id === activeArea}><span>{area.index}</span><b aria-hidden="true">↗</b><h3>{area.title}</h3><code>{area.notation}</code></button>)}</div><aside className="activity-readout" aria-live="polite"><TechnicalLabel tone="yellow">AREA {active.index}</TechnicalLabel><h3>{active.title}</h3><p>{active.description}</p><span>SELECTED // {active.notation}</span></aside></div>
      </section>

      <MemoriesGallery />

      <section className="archive-section" id="activities" aria-labelledby="archive-title">
        <div className="section-intro"><div><span className="eyebrow">CIM // EVENT ARCHIVE</span><h2 id="archive-title">Learning in motion.</h2></div><p>A growing record of workshops, training, visits, projects, and technical exchange. Only verified archive entries are published.</p></div>
        <div className="event-filter" role="toolbar" aria-label="Filter activities">{filters.map((item) => <button type="button" key={item.label} className={filter === item.label ? 'is-active' : ''} onClick={() => setFilter(item.label)}>{item.label}</button>)}</div>
        <div className="event-list" aria-live="polite">{filteredEvents.length ? filteredEvents.map((event, index) => <article className={`event-card ${index === 0 ? 'event-card--featured' : ''}`} key={event.id}><div className="event-card__media">{event.image ? <img src={event.image} alt="" loading="lazy" /> : <EventFallback eventId={event.id} />}</div><div className="event-card__meta"><span>CIM / EVENTS / {event.year}</span><dl><div><dt>Date</dt><dd>{event.dateLabel ?? 'Date not published'}</dd></div><div><dt>Type</dt><dd>{event.type}</dd></div>{event.partners?.length ? <div><dt>With</dt><dd>{event.partners.join(', ')}</dd></div> : null}</dl></div><div className="event-card__content"><h3>{event.title}</h3><p>{event.description}</p><div>{event.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div></article>) : <div className="empty-archive"><span>NO VERIFIED ENTRIES</span><p>No published activity matches this archive filter yet.</p></div>}</div>
      </section>

      <section className="team-section" id="team" aria-labelledby="team-title">
        <div className="section-intro"><div><span className="eyebrow">CIM // BUREAU</span><h2 id="team-title">The people<br />behind the systems.</h2></div><p>Meet the current team through their technical profiles and areas of focus.</p></div>
        {team.length ? <div className="team-grid">{team.map((member, index) => <article className="team-card" key={member.name}><div className="team-card__image">{member.image ? <img src={member.image} alt={member.name} /> : <div className="team-card__placeholder" />}</div><span>CIM // {String(index + 1).padStart(2, '0')}</span><h3>{member.name}</h3><p>{member.role}</p>{member.department && <small>{member.department}</small>}</article>)}</div> : <div className="team-empty"><span className="team-empty__number">// 00</span><div><TechnicalLabel tone="yellow">ROSTER INPUT PENDING</TechnicalLabel><h3>Bureau profiles will appear here.</h3><p>Real names, roles, descriptions, and portraits can be added in one data file—no generic profiles are used.</p></div><span className="team-empty__line" aria-hidden="true" /></div>}
      </section>
    </main>
    <SiteFooter />
  </>
}
