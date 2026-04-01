import { useState, useEffect } from 'react'

const API = ''

export default function GalerieDesGlaces({ auth }) {
  const [glaces, setGlaces]   = useState([])
  const [hovered, setHovered] = useState(null)
  const [loading, setLoading] = useState(true)
  const [obs, setObs]         = useState({ titre:'', commentaire:'' })
  const [obsMsg, setObsMsg]   = useState('')
  const [observations, setObservations] = useState([])

  useEffect(() => {
    fetch(`${API}/api/labo/galerie`)
      .then(r => r.json())
      .then(d => setGlaces(d.miroirs||[]))
      .catch(() => {})
      .finally(() => setLoading(false))
    if (auth?.id) {
      fetch(`${API}/api/labo/galerie/observation`, { headers: { 'x-session-id': String(auth.id) } })
        .then(r => r.json())
        .then(d => setObservations(d.observations||[]))
        .catch(() => {})
    }
  }, [auth])

  const submitObs = async () => {
    setObsMsg('')
    try {
      const res  = await fetch(`${API}/api/labo/galerie/observation`, {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'x-session-id': String(auth?.id||'') },
        body: JSON.stringify(obs),
      })
      const data = await res.json()
      if (res.ok) { setObsMsg('Observation enregistrée.'); setObs({ titre:'', commentaire:'' }) }
      else setObsMsg(data.erreur || 'Erreur.')
    } catch { setObsMsg('Erreur réseau.') }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize:'2rem', color:'var(--ink)' }}>
          Galerie des Glaces
        </h2>
        <p style={{ fontStyle:'italic', color:'var(--copper)', marginTop:4, fontSize:'1rem' }}>
          Reflets de votre consommation — illuminés à la manière de Versailles
        </p>
        <div className="ornament" style={{ fontSize:'0.85rem', marginTop:8 }} />
      </div>

      {loading ? (
        <p style={{ color:'var(--copper)', fontStyle:'italic' }}>Chargement des miroirs…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up-delay">
          {glaces.map((g, i) => (
            <div key={g.id} className="nollet-card"
              style={{
                padding:'20px 16px', cursor:'pointer', textAlign:'center',
                border: hovered===g.id ? `2px solid ${g.couleur}` : '1px solid var(--parchment-dark)',
                boxShadow: hovered===g.id ? `0 0 20px ${g.couleur}33` : undefined,
                transition:'all 0.3s', animationDelay:`${i*80}ms`, opacity:0,
                animation:`fadeUp 0.5s ease ${i*80}ms forwards`,
              }}
              onMouseEnter={() => setHovered(g.id)} onMouseLeave={() => setHovered(null)}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1rem', color:'var(--ink)', marginBottom:4 }}>{g.titre}</h3>
              <p style={{ fontSize:'1.8rem', fontWeight:700, color:g.couleur, lineHeight:1 }}>{g.valeur}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--copper)', marginTop:4 }}>{g.label}</p>
              {hovered===g.id && g.detail && (
                <p style={{ marginTop:10, fontSize:'0.78rem', color:'var(--ink)', fontStyle:'italic', lineHeight:1.4, borderTop:`1px solid ${g.couleur}44`, paddingTop:8 }}>
                  {g.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulaire honeypot — visible si connecté */}
      {auth && (
        <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--parchment-dark)' }}>
          <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
            Soumettre une observation
          </p>
          <input
            value={obs.titre}
            onChange={e => setObs(o => ({ ...o, titre: e.target.value }))}
            placeholder="Titre de l'observation"
            style={{ width:'100%', fontFamily:'monospace', padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)', marginBottom:8 }}
          />
          <textarea
            value={obs.commentaire}
            onChange={e => setObs(o => ({ ...o, commentaire: e.target.value }))}
            placeholder="Commentaire…"
            rows={2}
            style={{ width:'100%', fontFamily:"'Crimson Text',serif", padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)' }}
          />
          <button className="nollet-btn" style={{ marginTop:8 }} onClick={submitObs}>
            Enregistrer
          </button>
          {obsMsg && (
            <p style={{ marginTop:6, fontSize:'0.78rem', color: obsMsg.includes('enregistrée') ? '#2d7a3f' : 'var(--ember)' }}>
              {obsMsg}
            </p>
          )}
        </div>
      )}

      {/* Observations soumises */}
      {auth && observations.length > 0 && (
        <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--parchment-dark)' }}>
          <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
            Vos observations
          </p>
          {observations.map(o => (
            <div key={o.id} style={{ padding:'6px 0', borderBottom:'1px solid var(--parchment-dark)', fontSize:'0.82rem' }}>
              <span style={{ color:'var(--ink)', fontWeight:600 }}>{o.titre || '(sans titre)'}</span>
              {o.commentaire && <p style={{ color:'#888', fontStyle:'italic', marginTop:2, fontSize:'0.78rem' }}>{o.commentaire}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
