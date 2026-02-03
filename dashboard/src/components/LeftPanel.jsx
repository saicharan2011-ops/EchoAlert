import React from 'react';
import { AlertTriangle, Zap, AlertCircle, CheckCircle2, Power } from 'lucide-react';
import crashIconImg from '../../../image.png';
import screamIconImg from '../../../scream.png';
import gunIconImg from '../../../gun.png';

const getEventIcon = (type) => {
    switch (type.toLowerCase()) {
        case 'crash':
            return (
                <img
                    src={crashIconImg}
                    alt="Crash"
                    style={{ width: 26, height: 26, objectFit: 'contain' }}
                />
            );
        case 'scream':
            return (
                <img
                    src={screamIconImg}
                    alt="Scream"
                    style={{ width: 26, height: 26, objectFit: 'contain' }}
                />
            );
        case 'gun':
            return (
                <img
                    src={gunIconImg}
                    alt="Gun"
                    style={{ width: 26, height: 26, objectFit: 'contain' }}
                />
            );
        case 'explosion': return <AlertCircle size={20} />;
        default: return <CheckCircle2 size={20} />;
    }
};

const getEventColor = (type) => {
    switch (type.toLowerCase()) {
        case 'crash': return 'var(--accent-danger)';
        case 'explosion': return 'var(--accent-danger)';
        case 'gun': return 'var(--accent-danger)';
        case 'scream': return 'var(--accent-warning)';
        default: return 'var(--accent-success)';
    }
};

export default function LeftPanel({
    currentEvent,
    recentEvents,
    systemOn,
    toggleSystem,
    sampleRate,
    setSampleRate
}) {
    return (
        <div className="card" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            gap: '1rem'
        }}>
            {/* Status Indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: '8px',
                background: systemOn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                border: `1px solid ${systemOn ? 'var(--accent-success)' : 'var(--text-muted)'}`
            }}>
                <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: systemOn ? 'var(--accent-success)' : 'var(--text-muted)',
                    boxShadow: systemOn ? '0 0 10px var(--accent-success)' : 'none',
                    animation: systemOn ? 'pulse 2s infinite' : 'none'
                }} />
                <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: systemOn ? 'var(--accent-success)' : 'var(--text-muted)'
                }}>
                    {systemOn ? 'Listening' : 'Offline'}
                </span>
            </div>

            {/* Current Event Card */}
            {currentEvent ? (
                <div style={{
                    background: currentEvent.type === 'Normal'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : currentEvent.type === 'Scream'
                            ? 'rgba(245, 158, 11, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                    border: `2px solid ${getEventColor(currentEvent.type)}`,
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: `0 0 20px ${getEventColor(currentEvent.type)}40`
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                        color: getEventColor(currentEvent.type),
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        <div style={{ animation: 'blink 1s infinite' }}>
                            {getEventIcon(currentEvent.type)}
                        </div>
                        <span>▲ CURRENT EVENT</span>
                    </div>

                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: getEventColor(currentEvent.type),
                        marginBottom: '0.5rem',
                        lineHeight: 1.2
                    }}>
                        {(() => {
                            switch (currentEvent.type) {
                                case 'Crash': return 'Crash Detected';
                                case 'Explosion': return 'Explosion Detected';
                                case 'Gun': return 'Gun Firing Detected';
                                case 'Scream': return 'Scream Detected';
                                case 'Normal': return 'Normal Detected';
                                default: return `${currentEvent.type} Detected`;
                            }
                        })()}
                    </h2>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        <div>
                            <span style={{
                                display: 'block',
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                marginBottom: '0.25rem'
                            }}>
                                Confidence
                            </span>
                            <span style={{
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                                fontSize: '1rem'
                            }}>
                                {currentEvent.confidence}%
                            </span>
                        </div>
                        <div>
                            <span style={{
                                display: 'block',
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                marginBottom: '0.25rem'
                            }}>
                                Time
                            </span>
                            <span style={{
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                                fontSize: '1rem',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {(() => {
                                    try {
                                        const date = new Date(currentEvent.timestamp);
                                        if (isNaN(date)) return currentEvent.timestamp;
                                        const d = String(date.getDate()).padStart(2, '0');
                                        const m = String(date.getMonth() + 1).padStart(2, '0');
                                        const y = String(date.getFullYear()).slice(-2);
                                        const H = String(date.getHours()).padStart(2, '0');
                                        const M = String(date.getMinutes()).padStart(2, '0');
                                        const S = String(date.getSeconds()).padStart(2, '0');
                                        return `${d}/${m}/${y} ${H}:${M}:${S}`;
                                    } catch (e) { return currentEvent.timestamp; }
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                }}>
                    <CheckCircle2 size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.875rem' }}>No active events</div>
                </div>
            )}

            {/* Recent Events */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Recent Events
                </h3>
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    {recentEvents.length === 0 ? (
                        <div style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            padding: '1rem'
                        }}>
                            No events yet
                        </div>
                    ) : (
                        recentEvents.slice(0, 5).map((event) => (
                            <div
                                key={event.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    borderLeft: `3px solid ${getEventColor(event.type)}`
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ color: getEventColor(event.type) }}>
                                        {getEventIcon(event.type)}
                                    </div>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {event.type}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        {(() => {
                                            try {
                                                const date = new Date(event.timestamp);
                                                if (isNaN(date)) return event.timestamp;
                                                const d = String(date.getDate()).padStart(2, '0');
                                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                                const y = String(date.getFullYear()).slice(-2);
                                                const H = String(date.getHours()).padStart(2, '0');
                                                const M = String(date.getMinutes()).padStart(2, '0');
                                                const S = String(date.getSeconds()).padStart(2, '0');
                                                return `${d}/${m}/${y} ${H}:${M}:${S}`;
                                            } catch (e) { return event.timestamp; }
                                        })()}
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: getEventColor(event.type),
                                        minWidth: '40px',
                                        textAlign: 'right'
                                    }}>
                                        ({event.confidence}%)
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* System Controls */}
            <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                {/* System Toggle */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        System ON/OFF
                    </label>
                    <button
                        onClick={toggleSystem}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: systemOn ? 'var(--accent-primary)' : 'var(--bg-dark)',
                            border: `1px solid ${systemOn ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Power size={16} />
                        {systemOn ? 'ON' : 'OFF'}
                    </button>
                </div>

            </div>

            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}

