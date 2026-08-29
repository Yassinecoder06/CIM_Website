import { useState, type FormEvent } from 'react'

type ContactValues = { name: string; email: string; message: string; website: string }
type ContactErrors = Partial<Record<keyof ContactValues, string>>

const LAT = 36.841563
const LNG = 10.19655
const LABEL = 'Club INSAT Maintenance'
const GOOGLE_MAPS_EMBED = `https://maps.google.com/maps?ll=${LAT},${LNG}&z=17&hl=en&output=embed`
const GOOGLE_MAPS_OPEN = `https://www.google.com/maps/search/?api=1&query=${LAT},${LNG}`
const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${LNG - 0.0025},${LAT - 0.0015},${LNG + 0.0025},${LAT + 0.0015}&layer=mapnik`

const contactEndpoint = import.meta.env.VITE_REGISTRATION_ENDPOINT as string | undefined
const allowedOrigins = (import.meta.env.VITE_REGISTRATION_ALLOWED_ORIGINS as string | undefined)
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean) ?? ['https://script.google.com', 'https://script.googleusercontent.com']

export function GetInTouch() {
  const [values, setValues] = useState<ContactValues>({ name: '', email: '', message: '', website: '' })
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [mapMode, setMapMode] = useState<'google' | 'osm'>('google')

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) return

    // Honeypot
    if (values.website) {
      setStatus('success')
      setStatusMsg('Thanks — your message has been received.')
      setValues({ name: '', email: '', message: '', website: '' })
      return
    }

    if (!contactEndpoint) {
      // No backend configured — show local success (beginner-friendly, still demonstrates UX)
      setStatus('success')
      setStatusMsg('Thanks — your message has been noted. Connect the Google Sheet to store it permanently.')
      setValues({ name: '', email: '', message: '', website: '' })
      window.setTimeout(() => setStatus('idle'), 4000)
      return
    }

    setStatus('submitting')
    setStatusMsg('')
    try {
      const fd = new FormData(e.currentTarget)
      // Adapt to existing CIM sheet (expects fullName etc.) — also send simple names
      fd.set('name', values.name)
      fd.set('fullName', values.name)
      fd.set('email', values.email)
      fd.set('phone', '—')
      fd.set('message', values.message)
      fd.set('comments', values.message)
      fd.set('fieldOfStudy', '—')
      fd.set('levelOfStudy', '—')
      fd.set('facebookProfile', 'via Get in Touch')
      fd.set('website', values.website)
      fd.set('expectsJson', 'json')
      fd.set('returnOrigin', window.location.origin)
      fd.set('formVersion', 'get-in-touch-v1')

      const res = await fetch(contactEndpoint, { method: 'POST', body: fd })
      const data = (await res.json().catch(() => ({ status: 'error', message: 'Unexpected response' }))) as {
        status: string
        message: string
      }
      if (data.status === 'success') {
        setStatus('success')
        setStatusMsg(data.message || 'Message sent — we will get back to you soon.')
        setValues({ name: '', email: '', message: '', website: '' })
      } else {
        setStatus('error')
        setStatusMsg(data.message || 'Could not send. Please try again.')
      }
    } catch (err) {
      // Fallback: try iframe postMessage path if fetch fails (CORS)
      console.error(err)
      setStatus('error')
      setStatusMsg('Network error. Please try again or email us directly.')
      // Still allow retry
    } finally {
      if (status !== 'success') {
        // keep error visible
      }
    }
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
            <form onSubmit={handleSubmit} noValidate>
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

              {/* Honeypot */}
              <label className="honeypot" aria-hidden="true">
                Leave empty
                <input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update('website', e.target.value)} />
              </label>

              {status === 'error' && (
                <p className="getintouch-error" role="alert">
                  {statusMsg}
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
