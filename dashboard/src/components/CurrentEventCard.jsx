import React, { useEffect, useState } from 'react';
import { AlertOctagon, BellRing } from 'lucide-react';

export default function CurrentEventCard({ event }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (event) {
            setVisible(true);
            // Auto-hide or keep visible? Usually "Current" implies sticky until next one or timeout.
            // We will keep it visible as long as it's the "Current" event passed down.
        }
    }, [event]);

    if (!event) return null;

    const isCritical = ['Crash', 'Explosion'].includes(event.type);
    const color = isCritical ? 'var(--accent-danger)' : 'var(--accent-warning)';
    const label = isCritical ? 'CRITICAL ALERT' : 'EVENT DETECTED';

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${color}`,
            boxShadow: `0 0 30px ${color}40`,
            borderRadius: '16px',
            padding: '1.5rem',
            minWidth: '320px',
            textAlign: 'center',
            animation: 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <div className="flex-center" style={{
                marginBottom: '0.5rem',
                color: color,
                gap: '0.5rem',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.1em'
            }}>
                <div style={{ animation: 'blink 1s infinite' }}><AlertOctagon size={16} /></div>
                {label}
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.25rem' }}>
                {event.type}
            </h2>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                marginTop: '1rem',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
            }}>
                <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Confidence</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{event.confidence}%</span>
                </div>
                <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Time</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{event.timestamp}</span>
                </div>
            </div>

            <style>{`
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            @keyframes slideDown {
                from { transform: translate(-50%, -20px); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
        `}</style>
        </div>
    );
}
