import { useEffect, useState, type FormEvent } from 'react'
import { SiteFooter } from '../components/SiteFooter'
import { TechnicalLabel } from '../components/TechnicalLabel'
import { studyFields, studyLevels, type RegistrationPayload } from '../data/content'
import { validateRegistration, type FieldErrors } from '../data/registration'

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error' | 'configuration'

const blankForm: RegistrationPayload = { fullName: '', fieldOfStudy: '', levelOfStudy: '', facebookProfile: '', email: '', phone: '', comments: '', website: '' }
const registrationEndpoint = import.meta.env.VITE_REGISTRATION_ENDPOINT as string | undefined
const allowedOrigins = (import.meta.env.VITE_REGISTRATION_ALLOWED_ORIGINS as string | undefined)?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? ['https://script.google.com', 'https://script.googleusercontent.com']

export function JoinPage() {
  const [values, setValues] = useState<RegistrationPayload>(blankForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<SubmissionState>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    function isAllowedOrigin(origin: string) {
      // Exact match first
      if (allowedOrigins.includes(origin)) return true
      // Google Apps Script uses a unique subdomain per deployment like https://n-xxx-0lu-script.googleusercontent.com
      // So we allow any subdomain of googleusercontent.com and script.google.com
      try {
        const url = new URL(origin)
        if (url.hostname === 'script.google.com') return true
        if (url.hostname.endsWith('.googleusercontent.com')) return true
        if (url.hostname.endsWith('googleusercontent.com')) return true
      } catch {}
      // Also allow site origins for local testing if someone misconfigured allowedReturnOrigins
      return false
    }

    function receiveMessage(event: MessageEvent) {
      if (!isAllowedOrigin(event.origin)) return
      const payload = event.data as { source?: string; status?: 'success' | 'error'; message?: string }
      // Accept both registration and contact sources (unified handler) - be permissive if source missing
      if (payload?.source && payload.source !== 'cim-registration' && payload.source !== 'cim-form') return
      // If source is missing but we have a status, still handle it (some deployments send without source)
      if (!payload?.status) return
      if (payload.status === 'success') { setStatus('success'); setMessage(payload.message || 'Your registration has been recorded.') }
      else if (payload.status === 'error') { setStatus('error'); setMessage(payload.message || 'We could not record your registration. Please try again.') }
    }
    window.addEventListener('message', receiveMessage)
    return () => window.removeEventListener('message', receiveMessage)
  }, [])

  function update(name: keyof RegistrationPayload, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }))
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  // Fallback timeout: if Apps Script never replies (network, origin mismatch), don't freeze forever
  useEffect(() => {
    if (status !== 'submitting') return
    const t = window.setTimeout(() => {
      setStatus((prev) => (prev === 'submitting' ? 'error' : prev))
      setMessage((prev) => (prev ? prev : 'No response from server. Please check your connection and try again. If this persists, the form endpoint may be misconfigured.'))
    }, 15000)
    return () => window.clearTimeout(t)
  }, [status])

  function submit(event: FormEvent<HTMLFormElement>) {
    const validation = validateRegistration(values)
    setErrors(validation)
    if (Object.keys(validation).length) { event.preventDefault(); setStatus('idle'); return }
    if (!registrationEndpoint) { event.preventDefault(); setStatus('configuration'); setMessage('Registration is not connected yet. The CIM team needs to add its Apps Script deployment URL.') ; return }
    setStatus('submitting')
    setMessage('')
  }

  const field = (name: keyof RegistrationPayload, label: string, control: React.ReactNode, note?: string) => <label className="form-field"><span>{label} <b aria-hidden="true">*</b></span>{control}{note && <small>{note}</small>}{errors[name] && <em role="alert">{errors[name]}</em>}</label>

  return <>
    <main className="join-page">
      <section className="join-hero"><div><TechnicalLabel>MEMBERSHIP // OPEN</TechnicalLabel><h1>Build<br /><em>with</em> us.</h1><p>Join a student engineering community that takes ideas beyond the classroom and into practical systems.</p><a href="#registration" className="button button--primary">Start registration <span aria-hidden="true">↓</span></a></div><div className="join-hero__visual"><div className="join-system-diagram" aria-hidden="true"><span>INPUT</span><i /><span>LEARN</span><i /><span>BUILD</span><i /><span>CONNECT</span></div><span>NEW MEMBER // SYSTEM INPUT</span></div></section>
      <section className="join-benefits" aria-labelledby="benefits-title"><div><span className="eyebrow">WHY JOIN CIM</span><h2 id="benefits-title">Your next<br />learning system.</h2></div><ol><li><span>01</span><b>Technical skills</b><p>Explore practical engineering tools and systems.</p></li><li><span>02</span><b>Industry exposure</b><p>Connect learning with industrial contexts and professional life.</p></li><li><span>03</span><b>Projects & teamwork</b><p>Build knowledge together through hands-on activity.</p></li><li><span>04</span><b>Professional growth</b><p>Develop the curiosity and confidence to keep learning.</p></li></ol></section>
      <section className="registration-section" id="registration" aria-labelledby="registration-title"><div className="registration-section__intro"><span className="eyebrow">JOIN CIM // FORM 01</span><h2 id="registration-title">Engineer your<br />next chapter.</h2><p>Your registration is sent securely to the CIM team’s Google Sheet through its Google Apps Script endpoint.</p></div><div className="registration-panel">
        {status === 'success' ? <div className="confirmation" role="status"><div className="confirmation__mark">✓</div><TechnicalLabel tone="yellow">SYSTEM CONFIRMED</TechnicalLabel><h3>Welcome to CIM.</h3><p>{message}</p><button type="button" className="button button--outline" onClick={() => { setStatus('idle'); setValues(blankForm) }}>Submit another response</button></div> : <form action={registrationEndpoint || undefined} method="post" target="registration-target" noValidate onSubmit={submit}>
          <input type="hidden" name="returnOrigin" value={window.location.origin} />
          <input type="hidden" name="formVersion" value="cim-web-v1" />
          <div className="form-grid">
            {field('fullName', 'Full name', <input name="fullName" autoComplete="name" value={values.fullName} onChange={(event) => update('fullName', event.target.value)} aria-invalid={Boolean(errors.fullName)} />)}
            {field('email', 'Email address', <input name="email" type="email" autoComplete="email" value={values.email} onChange={(event) => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} />)}
            {field('fieldOfStudy', 'Field of study', <select name="fieldOfStudy" value={values.fieldOfStudy} onChange={(event) => update('fieldOfStudy', event.target.value)} aria-invalid={Boolean(errors.fieldOfStudy)}><option value="">Select field</option>{studyFields.map((item) => <option key={item}>{item}</option>)}</select>)}
            {field('levelOfStudy', 'Level of study', <select name="levelOfStudy" value={values.levelOfStudy} onChange={(event) => update('levelOfStudy', event.target.value)} aria-invalid={Boolean(errors.levelOfStudy)}><option value="">Select level</option>{studyLevels.map((item) => <option key={item}>{item}</option>)}</select>)}
            {field('facebookProfile', 'Facebook profile', <input name="facebookProfile" value={values.facebookProfile} onChange={(event) => update('facebookProfile', event.target.value)} aria-invalid={Boolean(errors.facebookProfile)} />, 'A public profile link or your handle.')}
            {field('phone', 'Phone number', <input name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={(event) => update('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} />)}
            <label className="form-field form-field--full"><span>Comments <small>(optional)</small></span><textarea name="comments" rows={4} value={values.comments} onChange={(event) => update('comments', event.target.value)} /></label>
          </div>
          <label className="honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => update('website', event.target.value)} /></label>
          {status === 'configuration' || status === 'error' ? <p className="form-message form-message--error" role="alert">{message}</p> : null}
          {status === 'submitting' ? <p className="form-message" role="status">Transmitting your registration…</p> : null}
          <button type="submit" className="button button--primary" disabled={status === 'submitting'}>{status === 'submitting' ? 'Transmitting…' : 'Submit registration'} <span aria-hidden="true">↗</span></button>
        </form>}
        <iframe title="Registration submission response" name="registration-target" className="submission-frame" />
      </div></section>
    </main>
    <SiteFooter />
  </>
}
