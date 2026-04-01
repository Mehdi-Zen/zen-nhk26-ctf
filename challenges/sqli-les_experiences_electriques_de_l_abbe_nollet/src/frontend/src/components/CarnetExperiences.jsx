import { useState, useEffect } from 'react'

const API = ''

export default function CarnetExperiences({ auth }) {
  const [pages, setPages]       = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [note, setNote]         = useState({ date_exp:'', titre:'', contenu:'', joules:'' })
  const [noteMsg, setNoteMsg]   = useState('')

  const [mesNotes, setMesNotes] = useState([])

  const loadNotes = () => {
    if (!auth?.id) return
    fetch(`${API}/api/labo/carnet/note`, { headers: { 'x-session-id': String(auth.id) } })
      .then(r => r.json())
      .then(d => setMesNotes(d.notes||[]))
      .catch(() => {})
  }

  useEffect(() => {
    fetch(`${API}/api/labo/carnet`)
      .then(r => r.json())
      .then(d => setPages(d.pages||[]))
      .catch(() => {})
      .finally(() => setLoading(false))
    loadNotes()
  }, [auth])

  const submitNote = async () => {
    setNoteMsg('')
    try {
      const res  = await fetch(`${API}/api/labo/carnet/note`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-session-id': String(auth?.id||'') },
        body: JSON.stringify(note),
      })
      const data = await res.json()
      if (res.ok) { setNoteMsg('Note enregistrée.'); setNote({ date_exp:'', titre:'', contenu:'', joules:'' }) }
      else setNoteMsg(data.erreur || 'Erreur.')
    } catch { setNoteMsg('Erreur réseau.') }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize:'2rem', color:'var(--ink)' }}>
          Carnet d'Expériences
        </h2>
        <p style={{ fontStyle:'italic', color:'var(--copper)', marginTop:4 }}>
          Journal des travaux — Abbé Nollet, Académie Royale des Sciences
        </p>
        <div className="ornament" style={{ fontSize:'0.85rem', marginTop:8 }} />
      </div>

      {loading ? (
        <p style={{ color:'var(--copper)', fontStyle:'italic' }}>Chargement du carnet…</p>
      ) : (
        <div className="space-y-4">
          {pages.map((page, i) => (
            <div key={page.id} className="nollet-card"
              style={{ padding:'16px 20px', cursor:'pointer',
                borderLeft: expanded===page.id ? '3px solid var(--copper)' : '3px solid transparent',
                animationDelay:`${i*80}ms`, opacity:0, animation:`fadeUp 0.5s ease ${i*80}ms forwards` }}
              onClick={() => setExpanded(expanded===page.id ? null : page.id)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12 }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1rem', color:'var(--ink)', margin:0 }}>
                  {page.titre}
                </h3>
                <span style={{ fontFamily:'monospace', fontSize:'0.72rem', color:'var(--copper)', whiteSpace:'nowrap' }}>
                  {page.date_exp}
                </span>
              </div>
              {page.joules > 0 && (
                <p style={{ fontSize:'0.72rem', color:'#888', marginTop:4 }}>
                  Énergie&nbsp;: <span style={{ color:'var(--ember)', fontFamily:'monospace' }}>{parseFloat(page.joules).toFixed(2)} J</span>
                </p>
              )}
              {expanded===page.id && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--parchment-dark)' }}>
                  <p style={{ fontSize:'0.88rem', color:'var(--ink)', lineHeight:1.6, fontStyle:'italic' }}>
                    {page.contenu}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulaire honeypot — visible si connecté */}
      {auth && (
        <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--parchment-dark)' }}>
          <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
            Ajouter une note
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <div>
              <label style={{ fontSize:'0.7rem', color:'var(--copper)', display:'block', marginBottom:2 }}>Date (YYYY-MM-DD)</label>
              <input
                value={note.date_exp}
                onChange={e => setNote(n => ({ ...n, date_exp: e.target.value }))}
                placeholder="1746-03-12"
                style={{ width:'100%', fontFamily:'monospace', padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)' }}
              />
            </div>
            <div>
              <label style={{ fontSize:'0.7rem', color:'var(--copper)', display:'block', marginBottom:2 }}>Énergie (joules)</label>
              <input
                type="number"
                value={note.joules}
                onChange={e => setNote(n => ({ ...n, joules: e.target.value }))}
                placeholder="0"
                style={{ width:'100%', fontFamily:'monospace', padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)' }}
              />
            </div>
          </div>
          <input
            value={note.titre}
            onChange={e => setNote(n => ({ ...n, titre: e.target.value }))}
            placeholder="Titre de l'expérience…"
            style={{ width:'100%', fontFamily:"'Crimson Text',serif", padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)', marginBottom:8, fontSize:'0.95rem' }}
          />
          <textarea
            value={note.contenu}
            onChange={e => setNote(n => ({ ...n, contenu: e.target.value }))}
            placeholder="Observations de l'expérience…"
            rows={3}
            style={{ width:'100%', fontFamily:"'Crimson Text',serif", padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)', fontSize:'0.95rem' }}
          />
          <button className="nollet-btn" style={{ marginTop:8 }} onClick={submitNote}>
            Enregistrer la note
          </button>
          {noteMsg && (
            <p style={{ marginTop:6, fontSize:'0.78rem', color: noteMsg.includes('enregistrée') ? '#2d7a3f' : 'var(--ember)' }}>
              {noteMsg}
            </p>
          )}
        </div>
      )}

      {/* Notes soumises */}
      {auth && mesNotes.length > 0 && (
        <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--parchment-dark)' }}>
          <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
            Vos notes
          </p>
          {mesNotes.map(n => (
            <div key={n.id} style={{ padding:'8px 0', borderBottom:'1px solid var(--parchment-dark)' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'var(--ink)', fontSize:'0.88rem', fontFamily:"'Playfair Display',serif" }}>{n.titre}</span>
                <span style={{ color:'var(--copper)', fontSize:'0.72rem', fontFamily:'monospace' }}>{n.date_exp}</span>
              </div>
              {n.contenu && <p style={{ color:'#888', fontStyle:'italic', marginTop:2, fontSize:'0.78rem', lineHeight:1.4 }}>{n.contenu}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
