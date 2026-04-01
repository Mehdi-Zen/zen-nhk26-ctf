import { useState, useEffect } from 'react'

const API = ''
const CLASS_COLOR = { PUBLIC:'#2d7a3f', RESERVE:'#d4930a', CONFIDENTIEL:'#c0392b' }
const CLASS_ICON  = { PUBLIC:'📜', RESERVE:'🔒', CONFIDENTIEL:'🔐' }

export default function Archives1746({ auth }) {
  const [docs, setDocs]           = useState([])
  const [expanded, setExpanded]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState(null)
  const [searchMsg, setSearchMsg] = useState('')

  useEffect(() => {
    fetch(`${API}/api/labo/archives`)
      .then(r => r.json())
      .then(d => setDocs(d.docs||[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const doSearch = async () => {
    setSearchMsg(''); setResults(null)
    try {
      const res  = await fetch(`${API}/api/labo/archives/recherche`, {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'x-session-id': String(auth?.id||'') },
        body: JSON.stringify({ requete: query }),
      })
      const data = await res.json()
      if (res.ok) setResults(data.docs||[])
      else setSearchMsg(data.erreur || 'Erreur.')
    } catch { setSearchMsg('Erreur réseau.') }
  }

  const display = results !== null ? results : docs

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize:'2rem', color:'var(--ink)' }}>Archives 1746</h2>
        <p style={{ fontStyle:'italic', color:'var(--copper)', marginTop:4 }}>
          Fonds documentaire — Correspondances & mémoires de l'Académie Royale
        </p>
        <div className="ornament" style={{ fontSize:'0.85rem', marginTop:8 }} />
      </div>

      {/* Recherche honeypot */}
      {auth && (
        <div className="nollet-card p-4" style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key==='Enter' && doSearch()}
            placeholder="Rechercher par titre ou auteur…"
            style={{ flex:1, minWidth:200, fontFamily:"'Crimson Text',serif", padding:'7px 10px', border:'1px solid var(--parchment-dark)', borderRadius:2, background:'rgba(255,255,255,0.5)', fontSize:'0.9rem' }}
          />
          <button className="nollet-btn" onClick={doSearch}>Rechercher</button>
          {results !== null && (
            <button className="nollet-btn" style={{ opacity:0.6 }} onClick={() => { setResults(null); setQuery('') }}>
              Réinitialiser
            </button>
          )}
          {searchMsg && <p style={{ width:'100%', fontSize:'0.78rem', color:'var(--ember)', margin:0 }}>{searchMsg}</p>}
        </div>
      )}

      {loading ? (
        <p style={{ color:'var(--copper)', fontStyle:'italic' }}>Chargement des archives…</p>
      ) : (
        <div className="space-y-3">
          {display.length === 0 && (
            <p style={{ color:'#999', fontStyle:'italic', fontSize:'0.85rem' }}>Aucun document trouvé.</p>
          )}
          {display.map((doc, i) => (
            <div key={doc.id} className="nollet-card"
              style={{ padding:'14px 18px', cursor:'pointer',
                borderLeft:`3px solid ${CLASS_COLOR[doc.classification]||'#888'}`,
                animationDelay:`${i*70}ms`, opacity:0, animation:`fadeUp 0.5s ease ${i*70}ms forwards` }}
              onClick={() => setExpanded(expanded===doc.id ? null : doc.id)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <span>{CLASS_ICON[doc.classification]||'📄'}</span>
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'0.95rem', color:'var(--ink)', margin:0 }}>{doc.titre}</h3>
                  </div>
                  <p style={{ fontSize:'0.72rem', color:'var(--copper)' }}>{doc.auteur_arch} · {doc.annee}</p>
                </div>
                <span style={{
                  fontSize:'0.62rem', padding:'2px 6px', borderRadius:2, whiteSpace:'nowrap',
                  background:`${CLASS_COLOR[doc.classification]||'#888'}22`,
                  color:CLASS_COLOR[doc.classification]||'#888',
                  border:`1px solid ${CLASS_COLOR[doc.classification]||'#888'}44`,
                  textTransform:'uppercase', letterSpacing:'0.06em',
                }}>{doc.classification}</span>
              </div>
              {expanded===doc.id && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--parchment-dark)' }}>
                  <p style={{ fontSize:'0.86rem', color:'var(--ink)', lineHeight:1.6, fontStyle:'italic' }}>{doc.extrait}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
