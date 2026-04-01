import { useState, useRef, useEffect } from 'react'

const API = ''

const ENDPOINTS = [
  {
    id: 'experiences',
    method: 'GET',
    path: '/api/v1/experiences',
    label: 'Expériences (liste)',
    desc: 'Retourne les expériences selon votre rang JWT.',
    params: [],
    pg: false,
  },
  {
    id: 'classification',
    method: 'GET',
    path: '/api/v1/classification',
    label: 'Classification secrète',
    desc: 'Documents classifiés PUBLIC / CONFIDENTIEL / SECRET.',
    params: [{ name: 'level', placeholder: 'PUBLIC', required: false }],
    pg: false,
  },
  {
    id: 'rapport',
    method: 'GET',
    path: '/api/v1/rapport',
    label: 'Rapports par auteur',
    desc: 'Interroge directement la base des archives. Paramètre transmis sans filtrage.',
    params: [{ name: 'auteur', placeholder: 'admin_nollet', required: true }],
    pg: true,   // 💀 time-based blind SQLi
  },
  {
    id: 'secrets',
    method: 'GET',
    path: '/api/v1/artefacts/secrets',
    label: 'Artefacts secrets',
    desc: 'Références des artefacts de niveau MAITRE.',
    params: [],
    pg: false,
  },
]

function TerminalLine({ type, text }) {
  const colors = {
    cmd:     '#c9a84c',
    ok:      '#4ab3d4',
    data:    'rgba(245,234,215,0.85)',
    err:     '#e74c3c',
    info:    'rgba(245,234,215,0.4)',
    success: '#2ecc71',
    warn:    '#f39c12',
  }
  return (
    <div style={{
      fontFamily:'monospace', fontSize:'0.82rem',
      color: colors[type]||'white',
      lineHeight:1.6, paddingLeft: type==='data' ? 16 : 0,
      whiteSpace:'pre-wrap', wordBreak:'break-all',
    }}>
      {type==='cmd' && <span style={{ color:'rgba(245,234,215,0.3)', marginRight:8 }}>{'>'}</span>}
      {text}
    </div>
  )
}

export default function TerminalAPI() {
  const [jwt, setJwt]           = useState('')
  const [jwtValid, setJwtValid] = useState(false)
  const [jwtPayload, setJwtPayload] = useState(null)
  const [selected, setSelected] = useState(ENDPOINTS[0])
  const [params, setParams]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [logs, setLogs]         = useState([
    { type:'info', text:'Laboratoire Nollet · Terminal API v1746.3' },
    { type:'info', text:'Connexion établie. En attente de jeton JWT…' },
  ])
  const [timing, setTiming]     = useState(null)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [logs])

  const addLog  = (entries) => setLogs(p => [...p, ...entries])
  const clearLog = () => setLogs([{ type:'info', text:'Terminal effacé.' }])

  const handleSetJWT = () => {
    const t = jwt.trim()
    try {
      const parts = t.split('.')
      if (parts.length !== 3) throw new Error('format')
      const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')))
      const exp = payload.exp ? new Date(payload.exp*1000).toLocaleString('fr-FR') : '∞'
      setJwtPayload(payload)
      setJwtValid(true)
      addLog([
        { type:'ok',   text:'✓ Jeton accepté' },
        { type:'data', text:`scope : ${payload.scope||'—'}` },
        { type:'data', text:`rank  : ${payload.rank||'—'}` },
        { type:'data', text:`exp   : ${exp}` },
      ])
    } catch {
      setJwtValid(false)
      addLog([{ type:'err', text:'Jeton invalide — format JWT attendu (header.payload.signature).' }])
    }
  }

  const callEndpoint = async () => {
    if (!jwtValid) {
      addLog([{ type:'err', text:'Aucun jeton valide. Configurez d\'abord votre JWT.' }])
      return
    }
    setLoading(true); setTiming(null)

    let url = `${API}${selected.path}`
    const qs = selected.params
      .filter(p => params[p.name])
      .map(p => `${p.name}=${encodeURIComponent(params[p.name])}`)
      .join('&')
    if (qs) url += '?' + qs

    addLog([
      { type:'info', text:'─'.repeat(48) },
      { type:'cmd',  text:`${selected.method} ${url}` },
    ])

    const t0 = performance.now()
    try {
      const res = await fetch(url, { headers:{ Authorization:`Bearer ${jwt.trim()}` } })
      const elapsed = Math.round(performance.now() - t0)
      setTiming(elapsed)
      const data = await res.json()

      addLog([{ type: res.ok ? 'success' : 'err', text:`HTTP ${res.status} · ${elapsed}ms` }])

      if (!res.ok) {
        addLog([{ type:'err', text: JSON.stringify(data, null, 2) }])
      } else {
        const lines = JSON.stringify(data, null, 2).split('\n').slice(0, 80)
        lines.forEach(l => addLog([{ type:'data', text:l }]))
      }

      // Indice time-based sur /api/v1/rapport
      if (selected.pg && elapsed >= 2500) {
        addLog([
          { type:'info', text:'─'.repeat(48) },
          { type:'warn', text:`⏱ Temps de réponse : ${elapsed}ms — latence anormale détectée.` },
          { type:'info', text:'Le serveur des archives a marqué une pause inhabituelle.' },
          { type:'info', text:'Ce comportement peut indiquer qu\'une condition a été évaluée.' },
        ])
      }
    } catch (e) {
      const elapsed = Math.round(performance.now() - t0)
      setTiming(elapsed)
      addLog([{ type:'err', text:`Erreur réseau (${elapsed}ms) : ${e.message}` }])
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize:'2rem', color:'var(--ink)' }}>
          Données Expérimentales — Terminal API
        </h2>
        <p style={{ fontStyle:'italic', color:'var(--copper)', marginTop:4 }}>
          Accès aux archives protégées · Authentification JWT requise
        </p>
        <div className="ornament" style={{ fontSize:'0.85rem', marginTop:8 }} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Colonne gauche */}
        <div className="space-y-4">

          {/* JWT */}
          <div className="nollet-card p-4" style={{ borderTop:`3px solid ${jwtValid ? '#2d7a3f' : 'var(--copper)'}` }}>
            <label style={{ display:'block', fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
              Jeton JWT
            </label>
            <textarea
              value={jwt}
              onChange={e => { setJwt(e.target.value); setJwtValid(false); setJwtPayload(null) }}
              placeholder="eyJhbGciOiJIUzI1NiJ9…"
              style={{
                width:'100%', fontFamily:'monospace', fontSize:'0.72rem',
                color:'var(--ink)', background:'rgba(255,255,255,0.5)',
                border:`1px solid ${jwtValid ? 'rgba(45,122,63,0.5)' : 'var(--copper)'}`,
                borderRadius:2, padding:8, resize:'none', height:80,
              }}
            />
            <button onClick={handleSetJWT} disabled={!jwt.trim()} style={{
              marginTop:6, padding:'6px 14px', width:'100%',
              background: jwtValid ? 'rgba(45,122,63,0.15)' : 'var(--copper)',
              border:`1px solid ${jwtValid ? '#2d7a3f' : 'transparent'}`,
              color: jwtValid ? '#2d7a3f' : 'var(--parchment)',
              borderRadius:2, fontFamily:"'Crimson Text',serif", fontSize:'0.85rem',
              cursor:'pointer', transition:'all 0.2s',
            }}>
              {jwtValid ? '✓ Jeton validé' : '⚡ Valider le jeton'}
            </button>
          </div>

          {/* Endpoints */}
          <div className="nollet-card p-4">
            <p style={{ fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
              Endpoints
            </p>
            <div className="space-y-2">
              {ENDPOINTS.map(ep => (
                <button key={ep.id} onClick={() => { setSelected(ep); setParams({}) }} style={{
                  display:'block', width:'100%', textAlign:'left', padding:'8px 10px',
                  borderRadius:2, cursor:'pointer',
                  background: selected.id===ep.id ? 'rgba(181,101,29,0.08)' : 'transparent',
                  border:`1px solid ${selected.id===ep.id ? 'var(--copper)' : 'var(--parchment-dark)'}`,
                  transition:'all 0.2s',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'var(--electric)', fontWeight:700, letterSpacing:'0.05em' }}>
                      {ep.method}
                    </span>
                    <span style={{ fontFamily:'monospace', fontSize:'0.72rem', color:'var(--ink)' }}>{ep.path}</span>

                  </div>
                  <div style={{ fontSize:'0.7rem', color:'var(--copper)', fontStyle:'italic', marginTop:2 }}>{ep.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Params */}
          {selected.params.length > 0 && (
            <div className="nollet-card p-4" style={{ borderLeft:`3px solid var(--copper)` }}>
              <p style={{ fontSize:'0.72rem', color:'var(--copper)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                Paramètres
              </p>
              {selected.params.map(p => (
                <div key={p.name}>
                  <label style={{ display:'block', fontSize:'0.72rem', color:'var(--copper)', marginBottom:3 }}>
                    {p.name}{p.required && ' *'}
                  </label>
                  <input
                    value={params[p.name]||''}
                    onChange={e => setParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                    placeholder={p.placeholder}
                    style={{ width:'100%', padding:'7px 10px', fontFamily:'monospace', fontSize:'0.82rem', background:'rgba(255,255,255,0.5)', border:'1px solid var(--copper)', borderRadius:2, color:'var(--ink)' }}
                  />
                </div>
              ))}
            </div>
          )}

          <button className="nollet-btn" onClick={callEndpoint} disabled={loading}
            style={{ width:'100%', opacity:loading ? 0.6 : 1 }}>
            {loading ? '⚙ Requête en cours…' : `▶ Exécuter ${selected.method} ${selected.path}`}
          </button>

          {timing !== null && (
            <p style={{ textAlign:'center', fontFamily:'monospace', fontSize:'0.75rem', color: timing >= 2500 ? 'var(--ember)' : 'var(--copper)' }}>
              ⏱ {timing}ms{timing >= 2500 ? ' ← latence anormale' : ''}
            </p>
          )}
        </div>

        {/* Terminal */}
        <div className="md:col-span-2">
          <div style={{
            background:'#0d0804', border:'1px solid rgba(181,101,29,0.3)',
            borderRadius:3, padding:'12px 16px', minHeight:480, maxHeight:600,
            overflowY:'auto', fontFamily:'monospace', position:'relative',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14, paddingBottom:10, borderBottom:'1px solid rgba(181,101,29,0.15)' }}>
              {['#e74c3c','#f39c12','#2ecc71'].map(c => (
                <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c, opacity:0.8 }} />
              ))}
              <span style={{ marginLeft:8, fontSize:'0.72rem', color:'rgba(245,234,215,0.3)', letterSpacing:'0.08em' }}>
                nollet_api_terminal
              </span>
              <button onClick={clearLog} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(245,234,215,0.25)', fontSize:'0.7rem', cursor:'pointer' }}>
                effacer
              </button>
            </div>
            <div>
              {logs.map((l, i) => <TerminalLine key={i} {...l} />)}
              {loading && (
                <div style={{ fontFamily:'monospace', fontSize:'0.82rem', color:'var(--amber)', animation:'flicker 0.8s ease infinite' }}>
                  ⚙ En attente de réponse…
                </div>
              )}
              <div ref={endRef} />
            </div>
            {!loading && (
              <div style={{ display:'inline-block', width:8, height:14, marginTop:4, background:'var(--copper)', opacity:0.8, animation:'flicker 1.2s ease infinite' }} />
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
