import { useEffect, useState, type FormEvent } from 'react'

type ContactValues = { name: string; email: string; message: string; website: string }
type ContactErrors = Partial<Record<keyof ContactValues, string>>

const LAT = 36.841563
const LNG = 10.19655
const LABEL = 'Club INSAT Maintenance'
const GOOGLE_MAPS_EMBED = `https://maps.google.com/maps?q=${LAT},${LNG}&hl=en&z=17&t=&ie=UTF8&iwloc=B&output=embed`
const GOOGLE_MAPS_OPEN = `https://www.google.com/maps/search/?api=1&query=${LAT},${LNG}`
const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${LNG - 0.0025},${LAT - 0.0015},${LNG + 0.0025},${LAT + 0.0015}&layer=mapnik&marker=${LAT},${LNG}`

const contactEndpoint = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined
const allowedOrigins = (import.meta.env.VITE_REGISTRATION_ALLOWED_ORIGINS as string | undefined)
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean) ?? ['https://script.google.com', 'https://script.googleusercontent.com']

export function GetInTouch() {
  const [values, setValues] = useState<ContactValues>({ name: '', email: '', message: '', website: '' })
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'configuration'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [mapMode, setMapMode] = useState<'google' | 'osm'>('google')

  useEffect(() => {
    function isAllowedOrigin(origin: string) {
      if (allowedOrigins.includes(origin)) return true
      try {
        const url = new URL(origin)
        if (url.hostname === 'script.google.com') return true
        if (url.hostname.endsWith('.googleusercontent.com')) return true
        if (url.hostname.endsWith('googleusercontent.com')) return true
      } catch {}
      return false
    }
    function receiveMessage(event: MessageEvent) {
      if (!isAllowedOrigin(event.origin)) return
      const payload = event.data as { source?: string; status?: 'success' | 'error'; message?: string }
      if (payload?.source && payload.source !== 'cim-form' && payload.source !== 'cim-registration') return
      if (!payload?.status) return
      if (payload.status === 'success') { setStatus('success'); setStatusMsg(payload.message || 'Your message has been recorded. Thank you!') }
      else if (payload.status === 'error') { setStatus('error'); setStatusMsg(payload.message || 'We could not send your message. Please try again.') }
    }
    window.addEventListener('message', receiveMessage)
    return () => window.removeEventListener('message', receiveMessage)
  }, [])

  useEffect(() => {
    if (status !== 'submitting') return
    const t = window.setTimeout(() => {
      setStatus((prev) => (prev === 'submitting' ? 'error' : prev))
      setStatusMsg((prev) => prev || 'No response from server. Please check your connection and try again. If this persists, the form endpoint may be misconfigured.')
    }, 15000)
    return () => window.clearTimeout(t)
  }, [status])

  function update<K extends keyof ContactValues>(key: K, value: string) {
    setValues((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  function validate(v: ContactValues): ContactErrors {
    const e: ContactErrors = {}
    if (v.name.trim().length < 2) e.name = 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Enter a valid email.'
    if (v.message.trim().length < 5) e.message = 'Enter a message (min 5 chars).'
    if (v.website.trim().length > 0) e.website = 'Spam detected.'
    return e
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) { e.preventDefault(); setStatus('idle'); return }
    if (values.website) {
      e.preventDefault()
      setStatus('success')
      setStatusMsg('Thanks — your message has been received.')
      setValues({ name: '', email: '', message: '', website: '' })
      return
    }
    if (!contactEndpoint) {
      e.preventDefault()
      setStatus('configuration')
      setStatusMsg('Contact form is not connected yet. Add VITE_CONTACT_ENDPOINT.')
      return
    }
    setStatus('submitting')
    setStatusMsg('')
  }

  return (
    <section className="getintouch-section" id="contact" aria-labelledby="getintouch-title">
      <div className="getintouch-shell">
        <div className="getintouch-form">
          <h2 id="getintouch-title">Get in touch</h2>
          <span className="getintouch-underline" aria-hidden="true" />

          {status === 'success' ? (
            <div className="getintouch-success" role="status">
              <span className="getintouch-success__icon">✓</span>
              <h3>Message sent</h3>
              <p>{statusMsg || 'Thanks for reaching out — the CIM team will reply soon.'}</p>
              <button type="button" className="button button--primary" onClick={() => setStatus('idle')}>
                Send another message <span aria-hidden="true">↗</span>
              </button>
            </div>
          ) : (
            <form action={contactEndpoint || undefined} method="post" target="contact-target" noValidate onSubmit={handleSubmit}>
              <input type="hidden" name="returnOrigin" value={typeof window !== 'undefined' ? window.location.origin : ''} />
              <input type="hidden" name="formVersion" value="get-in-touch-v1" />
              <div className="getintouch-field">
                <label htmlFor="git-name">
                  Name <b aria-hidden="true">*</b>
                </label>
                <input
                  id="git-name"
                  name="name"
                  placeholder="Enter your name"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => update('name', e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'git-name-error' : undefined}
                />
                {errors.name && (
                  <em id="git-name-error" role="alert">
                    {errors.name}
                  </em>
                )}
              </div>

              <div className="getintouch-field">
                <label htmlFor="git-email">
                  Email <b aria-hidden="true">*</b>
                </label>
                <input
                  id="git-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => update('email', e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'git-email-error' : undefined}
                />
                {errors.email && (
                  <em id="git-email-error" role="alert">
                    {errors.email}
                  </em>
                )}
              </div>

              <div className="getintouch-field getintouch-field--textarea">
                <label htmlFor="git-message">
                  Message <b aria-hidden="true">*</b>
                </label>
                <textarea
                  id="git-message"
                  name="message"
                  placeholder="Enter your message"
                  rows={4}
                  value={values.message}
                  onChange={(e) => update('message', e.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'git-message-error' : undefined}
                />
                {errors.message && (
                  <em id="git-message-error" role="alert">
                    {errors.message}
                  </em>
                )}
              </div>

              <label className="honeypot" aria-hidden="true">
                Leave empty
                <input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update('website', e.target.value)} />
              </label>
              {/* hidden phone for sheet compatibility */}
              <input type="hidden" name="phone" value="—" />

              {status === 'error' && (
                <p className="getintouch-error" role="alert">
                  {statusMsg}
                </p>
              )}
              {status === 'configuration' && (
                <p className="getintouch-error" role="alert">
                  {statusMsg}
                </p>
              )}
              {status === 'submitting' && (
                <p className="getintouch-error" role="status">
                  Sending your message…
                </p>
              )}

              <div className="getintouch-actions">
                <button type="submit" className="button getintouch-submit" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending…' : 'Submit'} <span aria-hidden="true">→</span>
                </button>
              </div>

              <p className="getintouch-hint">
                Or email directly at <a href="mailto:contact@cim-insat.tn">contact@cim-insat.tn</a> — INSAT, Centre Urbain Nord, Tunis.
              </p>
            </form>
          )}
          <iframe title="Contact submission response" name="contact-target" className="submission-frame" style={{ display: 'none' }} />
        </div>

        <div className="getintouch-mapwrap">
          <div className="getintouch-mapcard">
            <div className="getintouch-mapheader">
              <span className="getintouch-maplabel">CIM // LOCATION</span>
              <div className="getintouch-maptoggle" role="group" aria-label="Map provider">
                <button type="button" className={mapMode === 'google' ? 'is-active' : ''} onClick={() => setMapMode('google')}>
                  Google
                </button>
                <button type="button" className={mapMode === 'osm' ? 'is-active' : ''} onClick={() => setMapMode('osm')}>
                  OSM
                </button>
              </div>
            </div>

            <div className="getintouch-mapframe">
              {mapMode === 'google' ? (
                <iframe
                  title={`Map showing ${LABEL} at ${LAT}, ${LNG}`}
                  src={GOOGLE_MAPS_EMBED}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <iframe
                  title={`OpenStreetMap showing ${LABEL}`}
                  src={OSM_EMBED}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
              <a
                className="getintouch-openinmaps"
                href={GOOGLE_MAPS_OPEN}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${LABEL} in Google Maps`}
              >
                Open in Maps <span aria-hidden="true">↗</span>
              </a>
              <div className="getintouch-coords" aria-hidden="true">
                {LAT.toFixed(6)}, {LNG.toFixed(6)}
              </div>
            </div>

            <div className="getintouch-mapfooter">
              <span>
                <b>{LABEL}</b> — INSAT, Centre Urbain Nord, Tunis
              </span>
              <span className="getintouch-mapcoords">
                {LAT}, {LNG}
              </span>
            </div>
          </div>

          <p className="getintouch-mapnote">
            Not yet registered on Google Maps — this pin is placed at our exact workshop coordinates. Click <a href={GOOGLE_MAPS_OPEN} target="_blank" rel="noreferrer">Open in Maps</a> for directions.
          </p>
        </div>
      </div>
    </section>
  )
}
