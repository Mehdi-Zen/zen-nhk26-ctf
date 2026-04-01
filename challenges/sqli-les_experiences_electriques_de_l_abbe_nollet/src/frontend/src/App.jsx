import { useState, useEffect, useRef } from 'react'
import './index.css'
import Dashboard from './components/Dashboard'
import GalerieDesGlaces from './components/GalerieDesGlaces'
import BouteilleLeyde from './components/BouteilleLeyde'
import Instrumentarium from './components/Instrumentarium'
import CarnetExperiences from './components/CarnetExperiences'
import Archives1746 from './components/Archives1746'
import PortailAcces from './components/PortailAcces'
import ArtefactsChiffres from './components/ArtefactsChiffres'
import TerminalAPI from './components/TerminalAPI'
import Profil from './components/Profil'

const LABO_TABS = [
  { key: 'dashboard',       label: 'Accueil'          },
  { key: 'galerie',         label: 'Galerie des Glaces' },
  { key: 'leyde',           label: 'Bouteille de Leyde' },
  { key: 'instrumentarium', label: 'Instrumentarium' },
  { key: 'carnet',          label: "Carnet d'Expériences" },
  { key: 'archives',        label: 'Archives 1746' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [scrolled, setScrolled]   = useState(false)
  const [headerHeight, setHeaderHeight] = useState(120)
  const headerRef = useRef(null)
  const [auth, setAuth] = useState(null)

  // Charge session
  useEffect(() => {
    const saved = sessionStorage.getItem('nollet_session')
    if (saved) {
      try { setAuth(JSON.parse(saved)) } catch {}
    }
  }, [])

  useEffect(() => {
    const measure = () => { if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Si l'onglet actif devient inaccessible après logout, revenir à dashboard
  useEffect(() => {
    if (!auth && (activeTab === 'profil')) setActiveTab('portail')
    if (auth && activeTab === 'portail') setActiveTab('dashboard')
  }, [auth])

  const handleTab = (key) => {
    setActiveTab(key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogin = (data) => {
    setAuth(data)
    sessionStorage.setItem('nollet_session', JSON.stringify(data))
    setActiveTab('profil')
  }

  const handleLogout = async () => {
    try { await fetch('/api/auth/deconnexion', { method: 'POST' }) } catch {}
    setAuth(null)
    sessionStorage.removeItem('nollet_session')
    setActiveTab('dashboard')
  }

  // Onglets CTF selon état d'auth
  const ctfTabs = auth
    ? [
        { key: 'artefacts', label: 'Artefacts Chiffrés' },
        { key: 'terminal',  label: 'Données Expér.' },
        { key: 'profil',    label: 'Profil Personnel' },
      ]
    : [
        { key: 'portail', label: "Portail d'Accès"},
      ]

  const isCtf = ['portail','artefacts','terminal','profil'].includes(activeTab)

  const components = {
    dashboard:       <Dashboard />,
    galerie:         <GalerieDesGlaces auth={auth} />,
    leyde:           <BouteilleLeyde auth={auth} />,
    instrumentarium: <Instrumentarium auth={auth} />,
    carnet:          <CarnetExperiences auth={auth} />,
    archives:        <Archives1746 auth={auth} />,
    portail:         <PortailAcces onLogin={handleLogin} />,
    artefacts:       <ArtefactsChiffres />,
    terminal:        <TerminalAPI />,
    profil:          <Profil auth={auth} />,
  }

  const tabStyle = (key, group) => {
    const isActive = activeTab === key
    if (group === 'ctf') {
      return isActive
        ? { background: '#1a4a5e', color: 'var(--electric-glow)', borderColor: 'var(--electric)', boxShadow: '0 2px 8px rgba(74,179,212,0.3)', fontSize: '0.87rem', padding: '4px 12px' }
        : { color: 'rgba(74,179,212,0.65)', fontSize: '0.87rem', padding: '4px 12px' }
    }
    return isActive
      ? { background: 'var(--copper)', color: 'var(--parchment)', borderColor: 'var(--copper-light)', boxShadow: '0 2px 8px rgba(181,101,29,0.4)', fontSize: '0.87rem', padding: '4px 12px' }
      : { color: 'rgba(245,234,215,0.78)', fontSize: '0.87rem', padding: '4px 12px' }
  }

  return (
    <>
      <style>{`
        html, body, #root { margin: 0 !important; padding: 0 !important; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--parchment)', fontFamily: "'Crimson Text', serif" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <header
          ref={headerRef}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, width: '100vw',
            margin: 0, padding: 0, zIndex: 10000,
            background: 'rgba(44, 30, 15, 0.97)',
            borderBottom: '2px solid var(--copper)',
            backdropFilter: 'blur(6px)',
            boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.2)',
            transition: 'box-shadow 0.3s',
          }}
        >
          {/* Brand + user info */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8, padding: '8px 24px',
            borderBottom: '1px solid rgba(181,101,29,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>⚡</span>
              <div>
                <h1 className="display-title" style={{ color: 'var(--parchment)', fontSize: '1.25rem', letterSpacing: '0.04em', margin: 0, lineHeight: 1.1 }}>
                  Laboratoire expérimentales Nollet
                </h1>
                <p style={{ color: 'var(--copper-light)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Philosophie Naturelle · Câbles Vivants · MDCCXLVI
                </p>
              </div>
            </div>

            {/* Auth status */}
            {auth ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--copper-light)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                   {auth.nom_plume}
                  <span style={{
                    marginLeft: 6, fontSize: '0.65rem', textTransform: 'uppercase',
                    background: auth.rang === 'MAITRE' ? 'rgba(212,147,10,0.25)' : 'rgba(74,179,212,0.15)',
                    color: auth.rang === 'MAITRE' ? '#d4930a' : 'var(--electric)',
                    padding: '1px 6px', borderRadius: 2,
                  }}>{auth.rang}</span>
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)',
                    color: '#e74c3c', fontSize: '0.72rem', padding: '3px 10px',
                    cursor: 'pointer', borderRadius: 2, fontFamily: "'Crimson Text', serif",
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}
                >
                  ✕ Déconnexion
                </button>
              </div>
            ) : (
              <p style={{ color: 'rgba(245,234,215,0.4)', fontSize: '0.7rem', fontStyle: 'italic', margin: 0 }}>
                «&nbsp;La nature est un livre ouvert à qui sait l'observer&nbsp;»
              </p>
            )}
          </div>

          {/* Nav double rangée */}
          <div style={{ padding: '4px 20px 6px' }}>
            {/* Laboratoire */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(181,101,29,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 4, flexShrink: 0 }}>
                Labo
              </span>
              {LABO_TABS.map(tab => (
                <button
                  key={tab.key}
                  className="nav-btn"
                  style={tabStyle(tab.key, 'labo')}
                  onClick={() => handleTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* CTF */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(74,179,212,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 4, flexShrink: 0 }}>
                Sécurisé
              </span>
              {ctfTabs.map(tab => (
                <button
                  key={tab.key}
                  className="nav-btn"
                  style={tabStyle(tab.key, 'ctf')}
                  onClick={() => handleTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── Main ───────────────────────────────────────────── */}
        <main
          key={activeTab}
          style={{
            paddingTop: headerHeight + 20,
            paddingBottom: 64,
            paddingLeft: 24,
            paddingRight: 24,
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
          {isCtf && (
            <div style={{
              marginBottom: 16, padding: '8px 16px',
              background: 'rgba(74,179,212,0.06)',
              border: '1px solid rgba(74,179,212,0.2)',
              borderRadius: 2, display: 'flex', alignItems: 'center', gap: 8,
              animation: 'fadeUp 0.3s ease',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--electric)', boxShadow: '0 0 6px rgba(74,179,212,0.7)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--electric)', fontFamily: "'Crimson Text', serif", margin: 0, letterSpacing: '0.04em' }}>
                Zone sécurisée · Authentification requise · Toute intrusion est journalisée
              </p>
            </div>
          )}

          <div className="section-enter">
            {components[activeTab]}
          </div>
        </main>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid var(--parchment-dark)', padding: '12px 32px',
          textAlign: 'center', color: 'var(--copper)',
          fontSize: '0.78rem', fontStyle: 'italic', letterSpacing: '0.05em',
        }}>
          Abbé Jean-Antoine Nollet · Académie Royale des Sciences · Paris, 1746
        </footer>
      </div>
    </>
  )
}
