import { useState, useEffect } from 'react'

const API = ''
const STATUS_LABEL = { actif:'Actif', veille:'Veille', maintenance:'Maintenance', hors_service:'Hors service' }
const STATUS_COLOR = { actif:'#2d7a3f', veille:'#d4930a', maintenance:'#4ab3d4', hors_service:'#c0392b' }

export default function Instrumentarium({ auth }) {
  const [instruments, setInstruments] = useState([])
  const [selected, setSelected]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [sig, setSig]   = useState({ instrument:'', description:'' })
  const [sigMsg, setSigMsg] = useState('')

  const [signalements, setSignalements] = useState([])

  useEffect(() => {
    fetch(`${API}/api/labo/instruments`)
      .then(r => r.json())
      .then(d => setInstruments(d.instruments||[]))
      .catch(() => {})
      .finally(() => setLoading(false))
    if (auth?.id) {
      fetch(`${API}/api/labo/instruments/signalement`, { headers: { 'x-session-id': String(auth.id) } })
        .then(r => r.json())
        .then(d => setSignalements(d.signalements||[]))
        .catch(() => {})
    }
  }, [auth])

  const submitSig = async () => {
    setSigMsg('')
    try {
      const res  = await fetch(`${API}/api/labo/instruments/signalement`, {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'x-session-id': String(auth?.id||'') },
        body: JSON.stringify(sig),
      })
      const data = await res.json()
      if (res.ok) { setSigMsg('Signalement enregistré.'); setSig({ instrument:'', description:'' }) }
      else setSigMsg(data.erreur || 'Erreur.')
    } catch { setSigMsg('Erreur réseau.') }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize:'2rem', color:'var(--ink)' }}>Instrumentarium</h2>
        <p style={{ fontStyle:'italic', color:'var(--copper)', marginTop:4 }}>
          Inventaire des appareils du laboratoire — État et mesures en cours
        </p>
        <div className="ornament" style={{ fontSize:'0.85rem', marginTop:8 }} />
      </div>

      {loading ? (
        <p style={{ color:'var(--copper)', fontStyle:'italic' }}>Chargement de l'inventaire…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instruments.map((inst, i) => (
            <div key={inst.id} className="nollet-card"
              style={{ padding:'16px', cursor:'pointer',
                border: selected===inst.id ? '2px solid var(--copper)' : undefined,
                animationDelay:`${i*70}ms`, opacity:0, animation:`fadeUp 0.5s ease ${i*70}ms forwards` }}
              onClick={() => setSelected(selected===inst.id ? null : inst.id)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <div>
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'0.95rem', color:'var(--ink)', margin:0 }}>{inst.nom}</h3>
                    <p style={{ fontSize:'0.7rem', color:'var(--copper)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>{inst.type_instr}</p>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{
                    display:'inline-block', fontSize:'0.65rem', padding:'2px 8px', borderRadius:2,
                    background:`${STATUS_COLOR[inst.statut]}22`, color:STATUS_COLOR[inst.statut],
                    border:`1px solid ${STATUS_COLOR[inst.statut]}44`,
                    textTransform:'uppercase', letterSpacing:'0.06em',
                  }}>{STATUS_LABEL[inst.statut]||inst.statut}</span>
                  <p style={{ fontFamily:'monospace', fontSize:'1rem', color:'var(--ink)', margin:'4px 0 0' }}>{inst.lecture}</p>
                </div>
              </div>
              {selected===inst.id && (
                <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid var(--parchment-dark)' }}>
                  <p style={{ fontSize:'0.82rem', color:'var(--ink)', fontStyle:'italic', lineHeight:1.5 }}>{inst.description}</p>
                  <p style={{ fontSize:'0.72rem', color:'var(--copper)', marginTop:6 }}>
                    Calibré : {inst.calibre ? '✓ Oui' : '✗ Non'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Signalement honeypot */}
      {auth && (
        <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--parchment-dark)' }}>
          <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
            Signaler une anomalie
          </p>
          <input
            value={sig.instrument}
            onChange={e => setSig(s => ({ ...s, instrument: e.target.value }))}
            placeholder="Nom de l'instrument concerné"
            style={{ width:'100%', fontFamily:'monospace', padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)', marginBottom:8 }}
          />
          <textarea
            value={sig.description}
            onChange={e => setSig(s => ({ ...s, description: e.target.value }))}
            placeholder="Description de l'anomalie…"
            rows={2}
            style={{ width:'100%', fontFamily:"'Crimson Text',serif", padding:'6px 8px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)' }}
          />
          <button className="nollet-btn" style={{ marginTop:8 }} onClick={submitSig}>Signaler</button>
          {sigMsg && (
            <p style={{ marginTop:6, fontSize:'0.78rem', color: sigMsg.includes('enregistré') ? '#2d7a3f' : 'var(--ember)' }}>
              {sigMsg}
            </p>
          )}
        </div>
      )}

      {/* Signalements soumis */}
      {auth && signalements.length > 0 && (
        <div className="nollet-card p-4" style={{ borderLeft:'3px solid var(--parchment-dark)' }}>
          <p style={{ textTransform:'uppercase', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', marginBottom:8 }}>
            Vos signalements
          </p>
          {signalements.map(s => (
            <div key={s.id} style={{ padding:'6px 0', borderBottom:'1px solid var(--parchment-dark)', fontSize:'0.82rem' }}>
              <span style={{ color:'var(--ink)', fontWeight:600 }}>{s.instrument || '(instrument non précisé)'}</span>
              {s.description && <p style={{ color:'#888', fontStyle:'italic', marginTop:2, fontSize:'0.78rem' }}>{s.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
