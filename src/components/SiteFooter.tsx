import { Link } from 'react-router-dom'

const externalLinks = [
  { label: 'Facebook', href: import.meta.env.VITE_FACEBOOK_URL },
  { label: 'LinkedIn', href: import.meta.env.VITE_LINKEDIN_URL }
].filter((link): link is { label: string; href: string } => Boolean(link.href))

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-cta"><div><span className="eyebrow eyebrow--yellow">NEXT ASSEMBLY // YOU</span><h2>Ready to build<br />what’s next?</h2><Link to="/join" className="button button--yellow">Join CIM <span aria-hidden="true">↗</span></Link></div><div className="footer-system-mark" aria-hidden="true"><span>01</span><i /><b>→</b><i /><span>02</span></div></div>
    <div className="footer-bottom"><div><img src="/assets/cim-logo-source.jpeg" alt="CIM logo" className="footer-logo" /><p>Club INSAT Maintenance<br />Founded 2013 · INSAT, Tunisia</p></div><div className="footer-links"><Link to="/">Home</Link><a href="/#about">About</a><a href="/#activities">Activities</a><Link to="/join">Join CIM</Link>{externalLinks.map((link) => <a href={link.href} key={link.label} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div><span className="footer-rev">CIM // REV. 01<br />{new Date().getFullYear()}</span></div>
  </footer>
}
