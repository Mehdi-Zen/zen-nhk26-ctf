import { useState, useEffect } from 'react'

const API = ''
const ISOLATION_LABELS = { verre:"Verre (Nollet, 1745)", resine:"Résine d'ambre", soufre:"Soufre vulgaire", cire:"Cire à cacheter" }

function GaugeMeter({ value, max=100 }) {
  const pct=Math.min(value/max,1), radius=68, circ=Math.PI*radius
  const color=pct>0.85?'#c0392b':pct>0.6?'#d4930a':'#4ab3d4'
  return (
    <svg width="180" height="110" viewBox="0 0 180 110">
      <path d={`M 16 100 A ${radius} ${radius} 0 0 1 164 100`} fill="none" stroke="rgba(181,101,29,0.15)" strokeWidth="12" strokeLinecap="round"/>
      <path d={`M 16 100 A ${radius} ${radius} 0 0 1 164 100`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${pct*circ} ${circ}`} style={{ transition:'stroke-dasharray 0.8s cubic-bezier(.34,1.2,.64,1)' }}/>
      <text x="90" y="90" textAnchor="middle" fill={color} style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.4rem', fontWeight:700 }}>
        {Math.round(pct*100)}%
      </text>
      <text x="90" y="106" textAnchor="middle" fill="var(--copper)" style={{ fontSize:'0.55rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>Rendement</text>
    </svg>
  )
}

export default function BouteilleLeyde({ auth }) {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [note, setNote]         = useState('')
  const [noteMsg, setNoteMsg]   = useState('')

  const [annotations, setAnnotations] = useState([])

  const load = () => {
    setLoading(true)
    fetch(`${API}/api/labo/bouteille`)
      .then(r => r.json())
      .then(d => { const s=d.sessions||[]; setSessions(s); if(s.length) setSelected(s.length-1) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  const loadAnnotations = () => {
    if (!auth?.id) return
    fetch(`${API}/api/labo/bouteille/annotation`, { headers: { 'x-session-id': String(auth.id) } })
      .then(r => r.json())
      .then(d => setAnnotations(d.annotations||[]))
      .catch(() => {})
  }
  useEffect(() => { load(); loadAnnotations() }, [auth])

  const submitNote = async () => {
    setNoteMsg('')
    const current = sessions[selected]
    try {
      const res  = await fetch(`${API}/api/labo/bouteille/annotation`, {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'x-session-id': String(auth?.id||'') },
        body: JSON.stringify({ session_id: current?.id, note }),
      })
      const data = await res.json()
      if (res.ok) { setNoteMsg('Annotation enregistrée.'); setNote('') }
      else setNoteMsg(data.erreur || 'Erreur.')
    } catch { setNoteMsg('Erreur réseau.') }
  }

  const current = sessions[selected]

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize:'2rem', color:'var(--ink)' }}>Bouteille de Leyde</h2>
        <p style={{ fontStyle:'italic', color:'var(--copper)', marginTop:4 }}>
          Historique des sessions de charge — Laboratoire Nollet
        </p>
        <div className="ornament" style={{ fontSize:'0.85rem', marginTop:8 }} />
      </div>

      {loading ? (
        <p style={{ color:'var(--copper)', fontStyle:'italic' }}>Chargement des sessions…</p>
      ) : (
        <>
          <div className="nollet-card p-4">
            <p style={{ fontSize:'0.72rem', textTransform:'uppercase', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
              Sessions enregistrées
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {sessions.map((s, i) => (
                <button key={s.id} className="nollet-btn"
                  style={{ fontSize:'0.75rem', padding:'4px 10px', background:selected===i?'var(--copper)':'transparent', color:selected===i?'var(--parchment)':'var(--copper)' }}
                  onClick={() => setSelected(i)}>
                  #{s.id}
                </button>
              ))}
            </div>
          </div>

          {current && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="nollet-card p-5" style={{ textAlign:'center' }}>
                <GaugeMeter value={parseFloat(current.rendement_pct)} max={100} />
                <p style={{ marginTop:8, fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', color:'var(--ink)' }}>
                  {current.session_label}
                </p>
                <p style={{ fontSize:'0.78rem', color:'var(--copper)', marginTop:4 }}>
                  Isolation : {ISOLATION_LABELS[current.isolation]||current.isolation}
                </p>
              </div>
              <div className="nollet-card p-5 space-y-3">
                {[
                  { label:'Charge accumulée', val:`${current.charge_joules} J` },
                  { label:'Durée session',    val:`${current.duree_sec} s` },
                  { label:'Rendement',        val:`${current.rendement_pct}%` },
                  { label:'Date',             val:current.date_exp||'—' },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--parchment-dark)', paddingBottom:6 }}>
                    <span style={{ fontSize:'0.82rem', color:'var(--copper)' }}>{label}</span>
                    <span style={{ fontFamily:'monospace', fontSize:'0.9rem', color:'var(--ink)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Annotation honeypot */}
          {auth && current && (
            <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--parchment-dark)' }}>
              <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
                Annoter la session #{current.id}
              </p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Observations complémentaires…"
                rows={2}
                style={{ width:'100%', fontFamily:"'Crimson Text',serif", padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)' }}
              />
              <button className="nollet-btn" style={{ marginTop:8 }} onClick={submitNote}>
                Enregistrer l'annotation
              </button>
              {noteMsg && (
                <p style={{ marginTop:6, fontSize:'0.78rem', color: noteMsg.includes('enregistrée') ? '#2d7a3f' : 'var(--ember)' }}>
                  {noteMsg}
                </p>
              )}
            </div>
          )}

          {/* Annotations soumises */}
          {auth && annotations.length > 0 && (
            <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--parchment-dark)' }}>
              <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
                Vos annotations
              </p>
              {annotations.map(a => (
                <div key={a.id} style={{ padding:'6px 0', borderBottom:'1px solid var(--parchment-dark)', fontSize:'0.82rem' }}>
                  <span style={{ color:'var(--copper)', marginRight:8, fontSize:'0.72rem' }}>Session #{a.session_id||'?'}</span>
                  <span style={{ color:'var(--ink)', fontStyle:'italic' }}>{a.note}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
