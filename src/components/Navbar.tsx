import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { navigation } from '../data/content'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const onHome = location.pathname === '/'

  function closeMenu() {
    setOpen(false)
  }

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Main navigation">
        <Link to="/" className="wordmark" aria-label="CIM home" onClick={closeMenu}>
          <img src="/assets/cim-logo-source.jpeg" alt="CIM logo" className="wordmark__logo" />
          <span className="wordmark__sub">INSAT<br />MAINTENANCE</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span /><span />
        </button>
        <div className={`nav-links ${open ? 'nav-links--open' : ''}`} id="main-menu">
          {navigation.map((item) => (
            item.href === '/' ? (
              <Link key={item.label} to="/" onClick={closeMenu} className={onHome ? 'is-active' : ''}>{item.label}</Link>
            ) : (
              <a key={item.label} href={item.href} onClick={closeMenu}>{item.label}</a>
            )
          ))}
          <Link to="/join" className="nav-join" onClick={closeMenu}>Join CIM <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>
    </header>
  )
}
