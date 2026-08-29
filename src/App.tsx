import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'
import { AppLoader } from './components/AppLoader'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) { document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }); return }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Allow background scroll only after loader is gone
    if (!ready) {
      document.documentElement.classList.add('is-loading')
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.classList.remove('is-loading')
      document.body.style.overflow = ''
    }
  }, [ready])

  return (
    <>
      {!ready && <AppLoader onDone={() => setReady(true)} />}
      <div className={`app-root ${ready ? 'app-root--ready' : 'app-root--loading'}`} aria-hidden={!ready} style={ready ? undefined : { visibility: 'hidden', pointerEvents: 'none' }}>
        <ScrollManager />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}
