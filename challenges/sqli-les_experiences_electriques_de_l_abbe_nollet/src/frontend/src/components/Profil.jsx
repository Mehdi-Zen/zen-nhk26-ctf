import { useState } from 'react'

const API = ''
const RANG_COLOR = { NOVICE:'#888', ADEPT:'#4ab3d4', MAITRE:'#d4930a' }

export default function Profil({ auth }) {
  const [pref, setPref]       = useState('')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const userId = auth?.id || null

  const savePref = async () => {
    if (!userId) return setMessage('Session requise.')
    try {
      const res  = await fetch(`${API}/api/profil/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': String(userId) },
        body: JSON.stringify({ pref_enc: pref }),
      })
      const data = await res.json()
      setMessage(res.ok ? 'Préférence enregistrée.' : (data.erreur || 'Erreur.'))
    } catch { setMessage('Erreur réseau.') }
  }

  const loadHistory = async () => {
    if (!userId) return setMessage('Session requise.')
    setLoading(true); setHistory([]); setMessage('')
    try {
      const res  = await fetch(`${API}/api/profil/historique`, {
        headers: { 'x-session-id': String(userId) },
      })
      const data = await res.json()
      if (res.ok) setHistory(data.items || [])
      else setMessage(data.erreur || 'Erreur.')
    } catch { setMessage('Erreur réseau.') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-title" style={{ fontSize:'2rem', color:'var(--ink)' }}>
          Cabinet Personnel
        </h2>
        <p style={{ fontStyle:'italic', color:'var(--copper)' }}>
          Préférences expérimentales & journal d'activité
        </p>
      </div>

      {/* Infos session */}
      <div className="nollet-card p-4" style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
        <div>
          <p style={{ fontSize:'0.72rem', textTransform:'uppercase', color:'var(--copper)', letterSpacing:'0.1em' }}>Nom de plume</p>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', color:'var(--ink)', marginTop:2 }}>{auth?.nom_plume || '—'}</p>
        </div>
        <div>
          <p style={{ fontSize:'0.72rem', textTransform:'uppercase', color:'var(--copper)', letterSpacing:'0.1em' }}>Rang</p>
          <span style={{
            display:'inline-block', marginTop:4,
            fontFamily:'monospace', fontWeight:700, fontSize:'0.82rem',
            color: RANG_COLOR[auth?.rang]||'#888',
            background:`${RANG_COLOR[auth?.rang]||'#888'}22`,
            padding:'3px 12px', borderRadius:2,
            border:`1px solid ${RANG_COLOR[auth?.rang]||'#888'}44`,
            textTransform:'uppercase', letterSpacing:'0.1em',
          }}>{auth?.rang || '—'}</span>
        </div>
        <div>
          <p style={{ fontSize:'0.72rem', textTransform:'uppercase', color:'var(--copper)', letterSpacing:'0.1em' }}>ID Session</p>
          <p style={{ fontFamily:'monospace', fontSize:'0.88rem', color:'var(--ink)', marginTop:4 }}>{userId || '—'}</p>
        </div>
      </div>

      {/* Filtrage du journal — second-order SQLi */}
      <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--copper)' }}>
        <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em' }}>
          Filtrage du journal d'activité
        </p>
        <p style={{ fontSize:'0.82rem', color:'var(--ink)', marginTop:4, marginBottom:8, fontStyle:'italic' }}>
          Clause de filtrage appliquée lors de la consultation du journal.
        </p>
        <textarea
          value={pref}
          onChange={e => setPref(e.target.value)}
          placeholder=""
          rows={3}
          style={{
            width:'100%', fontFamily:'monospace', padding:8,
            border:'1px solid var(--copper)', borderRadius:2,
            background:'rgba(255,255,255,0.5)',
          }}
        />
        <button className="nollet-btn" style={{ marginTop:8 }} onClick={savePref}>
          Enregistrer le filtre
        </button>
        {message && (
          <p style={{ marginTop:8, fontSize:'0.8rem', color:'var(--copper)' }}>{message}</p>
        )}
      </div>

      {/* Résultats du journal */}
      <div className="nollet-card p-4">
        <button className="nollet-btn" onClick={loadHistory} disabled={loading}>
          {loading ? 'Chargement…' : 'Afficher le journal'}
        </button>

        {history.length > 0 && (
          <div style={{ marginTop:16 }}>
            {history.map((item, i) => (
              <div key={i} style={{
                fontFamily:'monospace', fontSize:'0.85rem',
                padding:'6px 0', borderBottom:'1px solid var(--parchment-dark)',
              }}>
                <span style={{ color:'var(--copper)', marginRight:8 }}>#{String(item.id)}</span>
                <span style={{ color:'var(--ink)' }}>{String(item.action)}</span>
                {item.detail && (
                  <span style={{ color:'#888', marginLeft:8 }}>— {String(item.detail)}</span>
                )}
                {item.date && (
                  <span style={{ color:'#aaa', marginLeft:8, fontSize:'0.72rem' }}>
                    {String(item.date).slice(0,19)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && history.length === 0 && (
          <p style={{ marginTop:12, fontSize:'0.82rem', color:'#999', fontStyle:'italic' }}>
            Aucune entrée avec le filtre actuel.
          </p>
        )}
      </div>
    </div>
  )
}
