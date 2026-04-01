import { useState, useEffect } from 'react'

function StatCard({ label, value, trend, up, delay }) {
  return (
    <div
      className="nollet-card p-5 flex flex-col gap-2"
      style={{ animationDelay: `${delay}ms`, opacity: 0, animation: `fadeUp 0.5s ease ${delay}ms forwards` }}
    >
      <div className="flex items-start justify-between">

        <span style={{
          fontSize: '0.75rem', fontFamily: "'Crimson Text', serif",
          color: up ? '#2d7a3f' : 'var(--ember)',
          background: up ? 'rgba(45,122,63,0.1)' : 'rgba(192,57,43,0.1)',
          padding: '2px 8px', borderRadius: '2px',
        }}>{trend}</span>
      </div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.65rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--copper)', letterSpacing: '0.03em', lineHeight: 1.3 }}>{label}</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState([])
  const [semaine, setSemaine] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/labo/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d.stats || []); setSemaine(d.semaine || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const maxVal = semaine.length ? Math.max(...semaine.map(d => parseFloat(d.value) || 0)) : 1

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2 className="display-title" style={{ fontSize: '2rem', color: 'var(--ink)' }}>
          Tableau de Bord
        </h2>
        <p style={{ fontStyle: 'italic', color: 'var(--copper)', marginTop: 4 }}>
          État du Laboratoire Nollet — Relevés en temps réel
        </p>
        <div className="ornament" style={{ fontSize: '0.85rem', marginTop: 8 }} />
      </div>

      {loading ? (
        <p style={{ color: 'var(--copper)', fontStyle: 'italic' }}>Chargement des relevés…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <StatCard key={i} label={s.label} value={s.valeur} trend={s.tendance} up={!!s.hausse} delay={i * 80} />
            ))}
          </div>

          {semaine.length > 0 && (
            <div className="nollet-card p-5" style={{ animation: 'fadeUp 0.5s ease 320ms forwards', opacity: 0 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'var(--ink)', marginBottom: 16 }}>
                Consommation hebdomadaire
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
                {semaine.map((d, i) => {
                  const h = maxVal > 0 ? Math.round((parseFloat(d.value) / maxVal) * 100) : 0
                  const isMax = parseFloat(d.value) === maxVal
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--copper)' }}>{d.value}</span>
                      <div style={{
                        width: '100%', height: `${h}%`, minHeight: 4,
                        background: isMax ? 'var(--ember)' : 'var(--copper)',
                        borderRadius: '2px 2px 0 0',
                        boxShadow: isMax ? '0 0 8px rgba(192,57,43,0.4)' : 'none',
                        transition: 'height 0.8s cubic-bezier(.34,1.2,.64,1)',
                      }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--copper-light)' }}>{d.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
