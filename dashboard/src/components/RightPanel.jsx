import React, { useState, useEffect } from 'react';
import { Mic, Camera } from 'lucide-react';

export default function RightPanel({ decibelLevel, hardwareStatus, sampleRate, eventHistory, onShowEvidence }) {

    // Normalize decibel (0–100)
    const normalizedValue = Math.max(0, Math.min(100, decibelLevel));

    // Calculate Last Emergency
    const lastEmergencyEvent = eventHistory?.find(ev =>
        ['crash', 'explosion', 'scream', 'gun'].includes(ev.type?.toLowerCase())
    );

    // Concept of "Acknowledge" - track the ID/Timestamp of the last viewed event
    const [viewedEventIdentifier, setViewedEventIdentifier] = useState(null);

    // Unique ID for the current emergency event
    const currentEventId = lastEmergencyEvent ? (lastEmergencyEvent.id || lastEmergencyEvent.timestamp) : null;

    // It is "New" if we have an event AND its ID is not what we last viewed
    const isNewEmergency = currentEventId && currentEventId !== viewedEventIdentifier;

    // Acknowledge logic
    const handleEmergencyClick = () => {
        if (lastEmergencyEvent) {
            setViewedEventIdentifier(currentEventId);
            onShowEvidence(lastEmergencyEvent);
        }
    };

    // 🔊 AUDIO ALERT LOGIC
    // We use a REF to keep the audio instance persistent across renders
    const audioRef = React.useRef(new Audio('/alert.wav'));

    useEffect(() => {
        const audio = audioRef.current;
        audio.loop = true; // Ensure continuous looping

        if (isNewEmergency) {
            // Start playing if not already playing
            audio.play().catch(e => console.error("Audio play failed (user interaction needed?):", e));
        } else {
            // Stop playing if noticed or no emergency
            audio.pause();
            audio.currentTime = 0;
        }

        // Cleanup on unmount
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, [isNewEmergency]); // Re-run only when "Newness" status changes

    const getEventColor = (type) => {
        if (type?.toLowerCase() === 'scream') return 'var(--accent-warning)';
        return 'var(--accent-danger)';
    };

    return (
        <div className="card" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            gap: '1.5rem'
        }}>

            {/* 🎤 Decibel Meter */}
            <div>
                <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Microphone Level
                </h3>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '250px'
                }}>
                    <DecibelMeter
                        value={normalizedValue}
                        decibel={decibelLevel}
                    />
                </div>
            </div>

            {/* 🖥️ Hardware Status */}
            <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem'
            }}>
                <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Hardware Status
                </h3>

                <div style={{ display: 'flex', gap: '0.25rem' }}>

                    {/* Mic Status */}
                    <HardwareIcon
                        icon={Mic}
                        label="Mic"
                        active={hardwareStatus?.mic_active}
                        color="var(--accent-success)"
                    />

                    {/* Camera Status */}
                    <HardwareIcon
                        icon={Camera}
                        label="Camera"
                        active={hardwareStatus?.camera_active}
                        color="var(--accent-primary)"
                    />

                </div>
            </div>

            {/* 🚨 Last Emergency Info */}
            {lastEmergencyEvent && (
                <div
                    onClick={handleEmergencyClick}
                    className={isNewEmergency ? "blink-bg-red" : ""}
                    style={{
                        borderTop: '1px solid var(--border-color)',
                        padding: '1rem',
                        marginTop: '0.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        border: isNewEmergency ? '1px solid var(--accent-danger)' : '1px solid transparent',
                        backgroundColor: isNewEmergency ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                    }}
                    onMouseEnter={(e) => !isNewEmergency && (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={(e) => !isNewEmergency && (e.currentTarget.style.opacity = '1')}
                >
                    <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: isNewEmergency ? 'var(--accent-danger)' : 'var(--text-secondary)',
                        marginBottom: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        {/* CHANGED: "Last Emergency" -> "Emergency" */}
                        Emergency

                        {isNewEmergency && (
                            <span style={{
                                fontSize: '0.6rem',
                                background: 'var(--accent-danger)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginLeft: '8px'
                            }}>
                                NEW
                            </span>
                        )}

                        <img
                            src="/evi.png"
                            alt="Open Evidence"
                            style={{
                                height: '20px',
                                width: 'auto',
                                cursor: 'pointer',
                                marginLeft: 'auto'
                            }}
                        />
                    </h3>

                    <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: getEventColor(lastEmergencyEvent.type),
                        marginBottom: '0.5rem'
                    }}>
                        {lastEmergencyEvent.type}
                    </div>

                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1.6
                    }}>
                        <div style={{ fontFamily: 'var(--font-mono)' }}>
                            {lastEmergencyEvent.lat && lastEmergencyEvent.lng
                                ? `${lastEmergencyEvent.lat.toFixed(6)}, ${lastEmergencyEvent.lng.toFixed(6)}`
                                : (lastEmergencyEvent.location || "Unknown Location")
                            }
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {(() => {
                                // Format timestamp
                                try {
                                    const dateObj = new Date(lastEmergencyEvent.timestamp);
                                    if (!isNaN(dateObj)) {
                                        const day = String(dateObj.getDate()).padStart(2, '0');
                                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                        const year = String(dateObj.getFullYear()).slice(-2);
                                        const hours = String(dateObj.getHours()).padStart(2, '0');
                                        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                                        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
                                        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                                    }
                                    return lastEmergencyEvent.timestamp;
                                } catch (e) {
                                    return lastEmergencyEvent.timestamp;
                                }
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function HardwareIcon({ icon: Icon, label, active, color }) {
    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1rem',
            background: active ? `${color}20` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${active ? color : 'var(--border-color)'}`,
            borderRadius: '12px',
            transition: 'all 0.3s'
        }}>
            <Icon size={24} color={active ? color : 'var(--text-muted)'} />
            <span style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: active ? color : 'var(--text-muted)',
                textTransform: 'uppercase'
            }}>
                {active ? 'ACTIVE' : 'OFFLINE'}
            </span>
        </div>
    )
}

/* 🔥 Gradient Decibel Meter */
function DecibelMeter({ value, decibel }) {
    const barHeightPercent = Math.max(0, Math.min(100, value || 0));

    const getNumberColor = (db) => {
        if (db >= 80) return '#ff3b3b';
        if (db >= 50) return '#ffcc00';
        return '#00ff9c';
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '80px'
        }}>
            <div style={{
                width: '100%',
                height: '200px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${barHeightPercent}%`,
                    minHeight: barHeightPercent > 0 ? '4px' : '0px',
                    background: `linear-gradient(to top,
                        #00ff9c 0%,
                        #00ff9c 35%,
                        #ffcc00 60%,
                        #ff8800 75%,
                        #ff3b3b 100%)`,
                    transition: 'height 0.15s linear',
                    boxShadow: barHeightPercent > 0
                        ? '0 0 25px rgba(255,0,0,0.35), inset 0 0 15px rgba(255,255,255,0.2)'
                        : 'none',
                    borderRadius: barHeightPercent >= 100 ? '8px' : '6px 6px 0 0'
                }} />
            </div>

            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: getNumberColor(decibel),
                    textShadow: '0 0 10px rgba(255,255,255,0.15)'
                }}>
                    {decibel.toFixed(1)}
                </div>
                <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                }}>
                    dB
                </div>
            </div>
        </div>
    );
}