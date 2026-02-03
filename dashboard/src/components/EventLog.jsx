import React from 'react';
import { AlertCircle, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

const getEventIcon = (type) => {
    switch (type) {
        case 'Crash': return <Zap size={18} />;
        case 'Explosion': return <AlertCircle size={18} />;
        case 'Scream': return <AlertTriangle size={18} />;
        default: return <CheckCircle2 size={18} />;
    }
};

const getEventColor = (type) => {
    switch (type) {
        case 'Crash': return 'var(--accent-danger)';
        case 'Explosion': return 'var(--accent-danger)';
        case 'Scream': return 'var(--accent-warning)';
        default: return 'var(--accent-success)';
    }
};

export default function EventLog({ events }) {
    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Event Log</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-dark)', padding: '2px 8px', borderRadius: '12px' }}>
                    {events.length} Events
                </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {events.length === 0 ? (
                    <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ opacity: 0.2 }}><CheckCircle2 size={40} /></div>
                        <span>No events detected</span>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${getEventColor(event.type)}`
                        }}>
                            <div style={{
                                color: getEventColor(event.type),
                                marginRight: '0.75rem',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {getEventIcon(event.type)}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.type} Detected</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{event.timestamp}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: getEventColor(event.type) }}>{event.confidence}%</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
