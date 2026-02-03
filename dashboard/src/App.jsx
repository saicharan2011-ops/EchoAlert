import { useState, useEffect } from 'react'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import MapComponent from './components/MapComponent'
import RightPanel from './components/RightPanel'
import { AudioWaveform } from './components/AudioVisuals'

function App() {
    const [eventHistory, setEventHistory] = useState([]);
    const [hardwareStatus, setHardwareStatus] = useState({ mic_active: false, camera_active: false });
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [decibelLevel, setDecibelLevel] = useState(0);
    const [waveformData, setWaveformData] = useState(new Float32Array(64).fill(0)); // Lower res for smoother animation

    // Waveform Animation Loop
    useEffect(() => {
        let animationFrame;
        const animate = () => {
            setWaveformData(prev => {
                const newData = new Float32Array(prev.length);
                // Shift left
                for (let i = 0; i < prev.length - 1; i++) {
                    newData[i] = prev[i + 1];
                }

                // Add new random sample scaled by decibel
                // Decibel 0-100 map to amplitude 0-100
                // Add some noise + consistent signal if loud
                const baseNoise = (Math.random() - 0.5) * 50;
                const signal = decibelLevel > 40 ? Math.sin(Date.now() / 20) * decibelLevel : 0;

                // Scale factor: if db is 0, Amp is 0. If db is 80, Amp is high.
                const scale = Math.max(0, decibelLevel / 20);

                newData[prev.length - 1] = (baseNoise + signal) * scale;
                return newData;
            });
            animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [decibelLevel]);

    // Polling Backend
    // Polling logic moved to the unified faster loop below


    // Fetch data and real audio level
    useEffect(() => {
        const fetchData = async () => {
            try {
                const statusRes = await fetch('http://localhost:5050/api/status');
                const status = await statusRes.json();
                setHardwareStatus(status);

                // Use real db level if available, else 0
                if (status.audio_level !== undefined) {
                    setDecibelLevel(status.audio_level);
                }

                const eventsRes = await fetch('http://localhost:5050/api/events');
                const events = await eventsRes.json();
                setEventHistory(events);
            } catch (err) {
                // silent fail
            }
        };

        const interval = setInterval(fetchData, 200); // Polling faster for audio smoothness
        return () => clearInterval(interval);
    }, []);

    const currentEvent = eventHistory[0] || null;
    const systemOn = hardwareStatus.mic_active;

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Header status={systemOn ? 'LISTENING' : 'OFFLINE'} toggleSystem={() => { }} />

            {/* Main Content Grid */}
            <div style={{
                flex: 1,
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: '320px 1fr 200px',
                gridTemplateRows: '1fr 220px',
                gap: '1rem',
                minHeight: 0,
                overflow: 'hidden',
                position: 'relative'
            }}>

                {/* Left Panel: Event Info */}
                <div style={{ gridRow: '1 / -1', minHeight: 0 }}>
                    <LeftPanel
                        currentEvent={currentEvent}
                        recentEvents={eventHistory}
                        systemOn={systemOn}
                        toggleSystem={() => { }} // Disabled as it's hardware controlled
                        sampleRate={44100}
                        setSampleRate={() => { }}
                    />
                </div>

                {/* Center: Map */}
                <div style={{
                    gridColumn: '2 / 3',
                    gridRow: '1 / 2',
                    position: 'relative',
                    height: '100%',
                    minHeight: 0
                }}>
                    <MapComponent currentEvent={currentEvent} events={eventHistory} />
                </div>

                {/* Right Panel: Hardware Status */}
                <div style={{ gridRow: '1 / -1', minHeight: 0 }}>
                    <RightPanel
                        decibelLevel={decibelLevel}
                        hardwareStatus={hardwareStatus}
                        sampleRate={44100}
                        eventHistory={eventHistory}
                        onShowEvidence={(ev) => setSelectedEvidence(ev)}
                    />
                </div>

                {/* Bottom: Waveform */}
                <div style={{
                    gridColumn: '2 / 3',
                    gridRow: '2 / 3',
                    minHeight: 0
                }}>
                    <AudioWaveform data={[...waveformData]} />
                </div>

            </div>

            {/* EVIDENCE MODAL */}
            {selectedEvidence && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }} onClick={() => setSelectedEvidence(null)}>
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '80%',
                        maxWidth: '800px',
                        border: '1px solid var(--border-color)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            Evidence - {selectedEvidence.type}
                        </h2>

                        {/* Video Player */}
                        {selectedEvidence.video_url ? (
                            <video
                                src={`http://localhost:5050${selectedEvidence.video_url}`}
                                controls
                                autoPlay
                                style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }}
                            />
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', background: '#000', borderRadius: '8px' }}>
                                No Video Available
                            </div>
                        )}

                        {/* Maps Link */}
                        <a
                            href={selectedEvidence.map_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'block',
                                textAlign: 'center',
                                background: 'var(--accent-primary)',
                                color: '#fff',
                                padding: '1rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            👉 Open in Google Maps
                        </a>

                        <button
                            onClick={() => setSelectedEvidence(null)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: '1.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
