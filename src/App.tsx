import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) { document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }); return }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return <><ScrollManager /><Navbar /><Routes><Route path="/" element={<HomePage />} /><Route path="/join" element={<JoinPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></>
}
