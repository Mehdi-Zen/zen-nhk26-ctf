import './App.css';

function App() {
  return (
    <>
      <h1>Helix</h1>

      <div style={{ display: 'flex', justifyContent: 'space-around', gap: '20px', padding: '20px' }}>
        <div style={{ width: 'auto', height: 'auto', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <video src="/loops/1.mp4" autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <div style={{ width: 'auto', height: 'auto', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <video src="/loops/2.mp4" autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </div>

      <div style={{ width: '100%', height: 'auto', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: '20px 0' }}>
        <video src="/loops/3.mp4" autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    </>
  );
}

export default App;
