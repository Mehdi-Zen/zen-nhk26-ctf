import { useState } from 'react'

const API = ''  // Vide = même origine. Mettre 'http://localhost:3001' si backend séparé

export default function PortailAcces({ onLogin }) {
  const [mode, setMode]         = useState('connexion')
  const [nomPlume, setNomPlume] = useState('')
  const [motDePasse, setMdp]    = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState(null)   // { type: 'ok'|'err', text }
  const [loggedIn, setLoggedIn] = useState(false)
  const [sessionUser, setUser]  = useState(null)
  const [rapport, setRapport]   = useState(null)
  const [pref, setPref]         = useState("")
  const [rapportLoading, setRapportLoading] = useState(false)

  const reset = () => { setMessage(null); setNomPlume(''); setMdp('') }

  // ── Inscription ──────────────────────────────────────────────
  const handleInscription = async () => {
    if (!nomPlume.trim() || !motDePasse.trim()) {
      return setMessage({ type: 'err', text: 'Tous les champs sont requis.' })
    }
    setLoading(true); setMessage(null)
    try {
      const res = await fetch(`${API}/api/auth/inscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_plume: nomPlume, mot_de_passe: motDePasse }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur || 'Erreur serveur')
      setMessage({ type: 'ok', text: `Bienvenue, ${data.nom_plume}. Votre plume est enregistrée.` })
      reset()
      setMode('connexion')
    } catch (e) {
      setMessage({ type: 'err', text: e.message })
    } finally { setLoading(false) }
  }

  // ── Connexion ────────────────────────────────────────────────
  const handleConnexion = async () => {
    if (!nomPlume.trim() || !motDePasse.trim()) {
      return setMessage({ type: 'err', text: 'Identifiants incomplets.' })
    }
    setLoading(true); setMessage(null)
    try {
      const res = await fetch(`${API}/api/auth/connexion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_plume: nomPlume, mot_de_passe: motDePasse }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur || 'Identifiants incorrects')
      // Stocke session en mémoire (pas de localStorage)
      sessionStorage.setItem('nollet_session', JSON.stringify({ id: data.id, nom_plume: data.nom_plume, rang: data.rang }))
      setLoggedIn(true)
      setUser({ id: data.id, nom_plume: data.nom_plume, rang: data.rang })
      setMessage({ type: 'ok', text: `Session ouverte. Rang : ${data.rang}` })
      if (onLogin) onLogin({ id: data.id, nom_plume: data.nom_plume, rang: data.rang })
    } catch (e) {
      setMessage({ type: 'err', text: e.message })
    } finally { setLoading(false) }
  }

  const handleDeconnexion = () => {
    sessionStorage.removeItem('nollet_session')
    setLoggedIn(false); setUser(null); setRapport(null); setMessage(null)
  }
const handleSavePref = async () => {
  if (!pref.trim()) return
  try {
    const res = await fetch(`${API}/api/profil/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionUser.id },
      body: JSON.stringify({ pref_enc: pref.trim() }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.erreur || 'Erreur serveur')
    setMessage({ type: 'ok', text: 'Préférence enregistrée.' })
  } catch (e) {
    setMessage({ type: 'err', text: e.message })
  }
}

// ── Rapport d'expérience (vecteur SQLi second ordre) ─────────
  const handleRapport = async () => {
    setRapportLoading(true); setRapport(null)
    try {
      const res = await fetch(`${API}/api/profil/rapport`, {
        headers: { 'X-Session-Id': sessionUser.id },
      })
      const data = await res.json()
      setRapport(data)
    } catch (e) {
      setRapport({ erreur: e.message })
    } finally { setRapportLoading(false) }
  }

  // ─────────────────────────────────────────────────────────────

  const inputStyle = {
    width: '100%', padding: '9px 13px',
    background: 'rgba(255,255,255,0.5)',
    border: '1px solid var(--copper)', borderRadius: 2,
    fontFamily: "'Crimson Text', serif", fontSize: '1rem', color: 'var(--ink)',
  }

  const msgColor = message?.type === 'ok' ? '#2d7a3f' : 'var(--ember)'
  const msgBg    = message?.type === 'ok' ? 'rgba(45,122,63,0.08)' : 'rgba(192,57,43,0.08)'

  if (loggedIn && sessionUser) {
    return (
      <div className="space-y-6">
        <div className="animate-fade-up">
          <h2 className="display-title" style={{ fontSize: '2rem', color: 'var(--ink)' }}>
            Portail d'Accès — Espace Expérimentateur
          </h2>
          <p style={{ fontStyle: 'italic', color: 'var(--copper)', marginTop: 4 }}>
            Système d'authentification du Laboratoire Nollet — v17.46
          </p>
          <div className="ornament" style={{ fontSize: '0.85rem', marginTop: 8 }} />
        </div>

        {/* Session active */}
        <div
          className="nollet-card p-6 animate-fade-up-delay"
          style={{ borderTop: '3px solid #2d7a3f' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2d7a3f', boxShadow: '0 0 6px rgba(45,122,63,0.7)' }} />
                <span style={{ fontSize: '0.75rem', color: '#2d7a3f', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Session active
                </span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: 'var(--ink)' }}>
                {sessionUser.nom}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--copper)', fontStyle: 'italic', marginTop: 2 }}>
                Rang : {sessionUser.rang} · ID : {sessionUser.id}
              </p>
            </div>
            <button
              onClick={handleDeconnexion}
              style={{
                padding: '7px 16px', background: 'transparent',
                border: '1px solid var(--ember)', color: 'var(--ember)',
                borderRadius: 2, fontFamily: "'Crimson Text', serif",
                fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.06em',
              }}
            >
              Clore la session
            </button>
          </div>

<div className="nollet-card p-5" style={{ borderTop: '3px solid var(--copper)' }}>
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'end', gap:12, flexWrap:'wrap' }}>
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ fontFamily:"'Crimson Text', serif", fontWeight:700, fontSize:'1.1rem', color:'var(--ink)' }}>
        Préférence de rapport
      </div>
      <div style={{ fontStyle:'italic', color:'var(--copper)', fontSize:'0.95rem', marginTop:4 }}>
        Valeur stockée puis réutilisée lors de la génération du rapport.
      </div>
      <input
        value={pref}
        onChange={(e) => setPref(e.target.value)}
        placeholder={"Ex: auteur%20%3D%20%27admin_nollet%27 (encodé)"}
        style={{ ...inputStyle, marginTop: 10 }}
      />
    </div>
    <button className="nollet-btn" onClick={handleSavePref} style={{ height: 42 }}>
      Enregistrer la préférence
    </button>
  </div>
</div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--parchment-dark)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--ink)' }}>
                Rapport d'Expériences Personnel
              </h4>
              <button
                className="nollet-btn"
                onClick={handleRapport}
                disabled={rapportLoading}
                style={{ padding: '7px 16px', fontSize: '0.82rem' }}
              >
                {rapportLoading ? '⚙ Génération…' : '📜 Générer le rapport'}
              </button>
            </div>

            {rapport && (
              <div
                style={{
                  padding: 14,
                  background: rapport.erreur
                    ? 'rgba(192,57,43,0.06)'
                    : 'rgba(44,30,15,0.03)',
                  border: `1px solid ${rapport.erreur ? 'rgba(192,57,43,0.2)' : 'var(--parchment-dark)'}`,
                  borderRadius: 2,
                  animation: 'fadeUp 0.3s ease',
                }}
              >
                {rapport.erreur ? (
                  <p style={{ color: 'var(--ember)', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                    Erreur : {rapport.erreur}
                  </p>
                ) : rapport.resultats?.length === 0 ? (
                  <p style={{ fontSize: '0.88rem', color: 'var(--copper)', fontStyle: 'italic' }}>
                    Aucune expérience enregistrée sous ce nom d'utilisateur.
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--parchment-dark)' }}>
                        {rapport.colonnes?.map(c => (
                          <th key={c} style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--copper)', fontWeight: 600, letterSpacing: '0.06em', fontSize: '0.75rem', textTransform: 'uppercase' }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rapport.resultats?.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(181,101,29,0.08)' }}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} style={{ padding: '6px 8px', color: 'var(--ink)', verticalAlign: 'top' }}>{String(v ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="nollet-card p-4 animate-fade-up-delay-2"
          style={{ borderLeft: '3px solid rgba(181,101,29,0.3)', background: 'rgba(44,30,15,0.02)' }}
        >
          <p style={{ fontSize: '0.78rem', color: 'rgba(44,30,15,0.45)', fontStyle: 'italic', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--copper)' }}>Note du registre :</strong> Le rapport d'expériences utilise
            le nom d'utilisateur tel qu'enregistré pour interroger les archives historiques. 

          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize: '2rem', color: 'var(--ink)' }}>
          Portail d'Accès — Espace Expérimentateur
        </h2>
        <p style={{ fontStyle: 'italic', color: 'var(--copper)', marginTop: 4 }}>
          Authentification sécurisée par le Sceau de l'Académie Royale
        </p>
        <div className="ornament" style={{ fontSize: '0.85rem', marginTop: 8 }} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulaire principal */}
        <div className="nollet-card p-6 animate-fade-up-delay" style={{ borderTop: '3px solid var(--copper)' }}>
          {/* Onglets */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--parchment-dark)' }}>
            {['connexion', 'inscription'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setMessage(null) }}
                style={{
                  padding: '8px 20px',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '0.9rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: mode === m ? '2px solid var(--copper)' : '2px solid transparent',
                  color: mode === m ? 'var(--ink)' : 'var(--copper)',
                  textTransform: 'capitalize',
                  letterSpacing: '0.05em',
                  marginBottom: -1,
                  transition: 'all 0.2s',
                }}
              >
                {m === 'connexion' ? '🔑 Connexion' : '✒ Inscription'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--copper)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                Nom de plume
              </label>
              <input
                style={inputStyle}
                value={nomPlume}
                onChange={e => setNomPlume(e.target.value)}
                placeholder="Ex. philosophe_naturel"
                autoComplete="off"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--copper)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                Phrase secrète
              </label>
              <input
                type="password"
                style={inputStyle}
                value={motDePasse}
                onChange={e => setMdp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'connexion' ? handleConnexion() : handleInscription())}
                placeholder="••••••••••"
              />
            </div>

            {message && (
              <div style={{ padding: '10px 14px', background: msgBg, border: `1px solid ${msgColor}40`, borderRadius: 2, animation: 'fadeUp 0.3s ease' }}>
                <p style={{ fontSize: '0.88rem', color: msgColor, fontFamily: "'Crimson Text', serif" }}>
                  {message.text}
                </p>
              </div>
            )}

            <button
              className="nollet-btn"
              onClick={mode === 'connexion' ? handleConnexion : handleInscription}
              disabled={loading}
              style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
            >
              {loading
                ? '⚙ Vérification en cours…'
                : mode === 'connexion' ? '⚡ Accéder au Laboratoire' : '✒ Enregistrer ma Plume'}
            </button>
          </div>
        </div>

        {/* Panneau latéral informatif */}
        <div className="space-y-4 animate-fade-up-delay-2">
          <div className="nollet-card p-5" style={{ background: 'linear-gradient(135deg, #1e1409, #2c1e0f)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--parchment)', marginBottom: 10 }}>
              Niveaux d'Accréditation
            </h3>
            {[
              { rang: 'Novice',      desc: 'Accès au portail et aux archives publiques', color: 'rgba(245,234,215,0.5)' },
              { rang: 'Initié',      desc: 'Accès aux expériences et aux artefacts chiffrés', color: 'var(--electric)' },
              { rang: 'Philosophe',  desc: 'Accès aux rapports et correspondances', color: 'var(--amber)' },
              { rang: 'Maître',      desc: 'Accès complet — Cabinet de Versailles', color: '#c9a84c' },
            ].map(({ rang, desc, color }) => (
              <div key={rang} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(181,101,29,0.1)', alignItems: 'flex-start' }}>
                <span style={{ color, fontWeight: 700, fontFamily: "'Playfair Display', serif", fontSize: '0.85rem', minWidth: 90 }}>{rang}</span>
                <span style={{ color: 'rgba(245,234,215,0.55)', fontSize: '0.8rem', lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>

          <div className="nollet-card p-4" style={{ borderLeft: '3px solid var(--copper)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink)', lineHeight: 1.7, fontStyle: 'italic' }}>
              <strong style={{ color: 'var(--copper)' }}>Note de sécurité :</strong> Les inscriptions sont
              enregistrées dans le registre du laboratoire. Le nom de plume choisi
              est utilisé pour indexer vos contributions dans les archives expérimentales.
              Choisissez-le avec soin — il ne pourra être modifié.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}