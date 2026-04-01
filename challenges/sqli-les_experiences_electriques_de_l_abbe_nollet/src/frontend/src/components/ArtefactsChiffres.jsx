import { useState, useEffect, useRef } from 'react'

const API = ''

// Simulation locale si le backend n'est pas dispo (mode démo)
const DEMO_ARTEFACTS = [
  { id: 1, designation: 'Registre des effluves §1', description: 'Extrait du registre des flux électriques primaires', indice: 'Le premier registre relate les observations préliminaires', cle_reference: 'CLE-NL-1746-01' },
  { id: 2, designation: 'Carnet de la chaîne humaine', description: 'Notes sur l\'expérience de Versailles, 180 gardes', indice: 'Cent-quatre-vingts pas pour une étincelle', cle_reference: 'CLE-NL-1746-02' },
  { id: 3, designation: 'Correspondance Musschenbroek', description: 'Lettre sur la bouteille de Leyde, 1745', indice: 'Un Hollandais et un abbé français partagent leurs découvertes', cle_reference: 'CLE-NL-1746-03' },
  { id: 4, designation: 'Feuillet des moines chartreux', description: 'Rapport de l\'expérience des 150 moines', indice: 'Le sursaut simultané prouva l\'instantanéité', cle_reference: 'CLE-NL-1746-04' },
  { id: 5, designation: 'Sceau du Cabinet de Versailles', description: 'Accréditation secrète de l\'Académie Royale — NIVEAU MAITRE', indice: 'La clé de Versailles ouvre bien plus qu\'une porte... cherchez CLE-NL-1746-09', cle_reference: 'CLE-NL-1746-09' },
]

function NoiseBlock() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const draw = () => {
      const d = ctx.createImageData(canvas.width, canvas.height)
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() * 60
        d.data[i] = v; d.data[i+1] = v * 0.6; d.data[i+2] = v * 0.3; d.data[i+3] = 180
      }
      ctx.putImageData(d, 0, 0)
    }
    const t = setInterval(draw, 80)
    return () => clearInterval(t)
  }, [])
  return <canvas ref={ref} width={280} height={60} style={{ borderRadius: 2, opacity: 0.7, display: 'block', width: '100%', height: 60 }} />
}

export default function ArtefactsChiffres() {
  const [artefacts, setArtefacts] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [cleHex, setCleHex]       = useState('')
  const [trying, setTrying]       = useState(false)
  const [result, setResult]       = useState(null)   // { success, jwt?, message }
  const [jwt, setJwt]             = useState(null)

  // Récupère la liste des artefacts
  useEffect(() => {
    fetch(`${API}/api/artefacts`)
      .then(r => r.json())
      .then(d => setArtefacts(d.artefacts || d))
      .catch(() => setArtefacts(DEMO_ARTEFACTS))  // fallback démo
      .finally(() => setLoading(false))
  }, [])

  const handleDechiffrer = async () => {
    if (!selected || !cleHex.trim()) return
    setTrying(true); setResult(null)

    try {
      const res = await fetch(`${API}/api/artefacts/dechiffrer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artefact_id: selected.id, cle_hex: cleHex.trim() }),
      })
      const data = await res.json()

      if (!res.ok || data.erreur) {
        setResult({ success: false, message: data.erreur || 'Déchiffrement impossible — clé incorrecte.' })
      } else if (data.jwt) {
        setJwt(data.jwt)
        setResult({ success: true, jwt: data.jwt, message: 'Artefact déchiffré. Jeton d\'accès obtenu.' })
      } else {
        setResult({ success: true, texte: data.texte, message: 'Déchiffrement réussi — contenu historique.' })
      }
    } catch (e) {
      setResult({ success: false, message: 'Erreur de connexion au laboratoire.' })
    } finally { setTrying(false) }
  }

  const isHexValid = (s) => /^[0-9a-fA-F]{64}$/.test(s.trim())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize: '2rem', color: 'var(--ink)' }}>
          Artefacts Chiffrés — Cabinet de Physique
        </h2>
        <p style={{ fontStyle: 'italic', color: 'var(--copper)', marginTop: 4 }}>
          Cette archive a besoin d'une clé pour être ouverte. Explorez les différents 
        </p>
        <div className="ornament" style={{ fontSize: '0.85rem', marginTop: 8 }} />
      </div>

      {/* Compteur */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up-delay">
        {[
          { label: 'Artefacts scellés', value: artefacts.length},
          { label: 'Clés candidates', value: 15},
          { label: 'Méthode de chiffrement', value: 'AES-256-CBC'},
        ].map(s => (
          <div key={s.label} className="nollet-card p-4 text-center">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--copper)', fontStyle: 'italic', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5 animate-fade-up-delay-2">
        {/* Liste des artefacts */}
        <div className="space-y-3">
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--copper)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Archives Scellées
          </h3>
          {loading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="nollet-card" style={{ height: 70, opacity: 0.5, animation: `fadeUp 0.4s ease ${i*60}ms forwards` }} />
              ))
            : artefacts.map((a, i) => (
                <div
                  key={a.id}
                  className="nollet-card cursor-pointer"
                  onClick={() => { setSelected(a); setResult(null); setCleHex('') }}
                  style={{
                    padding: '12px 16px',
                    borderLeft: selected?.id === a.id ? '3px solid var(--copper)' : '3px solid transparent',
                    transition: 'all 0.2s',
                    opacity: 0,
                    animation: `fadeUp 0.4s ease ${i * 60}ms forwards`,
                    background: selected?.id === a.id ? 'rgba(181,101,29,0.04)' : '',
                  }}
                  onMouseEnter={e => { if (selected?.id !== a.id) e.currentTarget.style.transform = 'translateX(3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: 'var(--ink)', fontWeight: 600 }}>
                        {a.designation}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--copper)', fontStyle: 'italic', marginTop: 2 }}>
                        {a.description}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '0.68rem', padding: '2px 7px', borderRadius: 2,
                      background: 'rgba(192,57,43,0.08)', color: 'var(--ember)',
                      border: '1px solid rgba(192,57,43,0.2)', flexShrink: 0, letterSpacing: '0.06em',
                    }}>
                      {a.id === 5 ? '⭐ MAITRE' : '🔒 SCELLÉ'}
                    </span>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Panneau de déchiffrement */}
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--copper)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Tentative de Déchiffrement
          </h3>

          {!selected ? (
            <div
              className="nollet-card"
              style={{ padding: 32, textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,30,15,0.02)' }}
            >
              <span style={{ fontSize: '2rem', opacity: 0.3 }}>🗝</span>
              <p style={{ fontStyle: 'italic', color: 'rgba(44,30,15,0.4)', fontSize: '0.9rem', marginTop: 10 }}>
                Sélectionnez un artefact dans la liste
              </p>
            </div>
          ) : (
            <div className="nollet-card p-5 space-y-4" style={{ borderTop: `3px solid ${selected.id === 5 ? '#c9a84c' : 'var(--ember)'}` }}>
              {/* Artefact sélectionné */}
              <div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: 'var(--ink)', marginBottom: 4 }}>
                  {selected.designation}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--copper)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  Indice : {selected.indice}
                </p>
              </div>

              {/* Prévisualisation bruit blanc */}
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--copper)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Contenu chiffré
                </p>
                <NoiseBlock />
              </div>

              {/* Champ clé */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--copper)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
                  Clé AES-256 (64 caractères hexadécimaux)
                </label>
                <input
                  style={{
                    width: '100%', padding: '9px 13px',
                    background: 'rgba(255,255,255,0.5)',
                    border: `1px solid ${cleHex && !isHexValid(cleHex) ? 'var(--ember)' : 'var(--copper)'}`,
                    borderRadius: 2, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--ink)',
                    letterSpacing: '0.05em',
                  }}
                  value={cleHex}
                  onChange={e => { setCleHex(e.target.value); setResult(null) }}
                  placeholder="4e6f6c6c65745f4142435f31373436..."
                />
                {cleHex && !isHexValid(cleHex) && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--ember)', marginTop: 3 }}>
                    Format : 64 caractères hexadécimaux (0-9, a-f)
                  </p>
                )}
              </div>

              <button
                className="nollet-btn"
                onClick={handleDechiffrer}
                disabled={trying || !isHexValid(cleHex)}
                style={{ width: '100%', opacity: (!isHexValid(cleHex) || trying) ? 0.55 : 1 }}
              >
                {trying ? '⚙ Déchiffrement en cours…' : '⚡ Tenter le déchiffrement'}
              </button>

              {/* Résultat */}
              {result && (
                <div
                  style={{
                    padding: '12px 14px', borderRadius: 2,
                    background: result.success ? 'rgba(45,122,63,0.08)' : 'rgba(192,57,43,0.06)',
                    border: `1px solid ${result.success ? 'rgba(45,122,63,0.3)' : 'rgba(192,57,43,0.2)'}`,
                    animation: 'fadeUp 0.3s ease',
                  }}
                >
                  <p style={{ fontSize: '0.85rem', color: result.success ? '#2d7a3f' : 'var(--ember)', fontWeight: 600, marginBottom: 6 }}>
                    {result.success ? '✓ ' : '✗ '}{result.message}
                  </p>
                  {result.jwt && (
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--copper)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                        Jeton d'accès obtenu :
                      </p>
                      <textarea
                        readOnly
                        value={result.jwt}
                        style={{
                          width: '100%', fontFamily: 'monospace', fontSize: '0.72rem',
                          color: '#2d7a3f', background: 'rgba(45,122,63,0.05)',
                          border: '1px solid rgba(45,122,63,0.2)',
                          borderRadius: 2, padding: '8px', resize: 'none', height: 80,
                        }}
                      />
                      <p style={{ fontSize: '0.72rem', color: '#2d7a3f', marginTop: 4, fontStyle: 'italic' }}>
                        → Copiez ce jeton et utilisez-le dans l'onglet "Données Expérimentales"
                      </p>
                    </div>
                  )}
                  {result.texte && (
                    <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.88rem', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.6 }}>
                      {result.texte}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}