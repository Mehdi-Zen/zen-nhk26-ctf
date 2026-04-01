import ADNHelix from './Adn.tsx'
import './App.css'

function App() {
  return (
    <>
      <h1>Helix</h1>
      <div style={{
        position: "absolute",
        display: "inline-block",
        width: "40vw",
        height: "150px",
        background: "radial-gradient(circle at center, #FFFFFFFF, #FFFFFFFF)",
        overflow: "hidden",
      }}>
        <ADNHelix sequenceADN="AATTGGCC" zoom={0.6} />
      </div>
      <div style={{
        position: "relative",
        display: "inline-block",
        width: "40vw",
        height: "150px",
        background: "radial-gradient(circle at center, #FFFFFFFF, #FFFFFFFF)",
        overflow: "hidden",
      }}>
        <ADNHelix sequenceADN="AATTGGCC" zoom={0.6} />
      </div>
      <div style={{
        position: "relative",
        width: "90vw",
        height: "300px",
        background: "radial-gradient(circle at center, #FFFFFFFF, #FFFFFFFF)",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "0", left: "0", color: "black", zIndex: "1" }}>
        </div>
        <ADNHelix sequenceADN="ATGGTGCACTTGACTTCTGAGGAGAAGAACTGCATCACTACCATCTGGT" zoom={0.2} />
      </div>
    </>
  )
}

export default App
