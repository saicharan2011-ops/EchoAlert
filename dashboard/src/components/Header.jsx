import React from 'react';
import { Volume2, Power, Play, Square } from 'lucide-react';

export default function Header({ status, toggleSystem }) {
    const getStatusColor = () => {
        if (status === 'ALERT') return 'var(--accent-danger)';
        if (status === 'LISTENING') return 'var(--accent-success)';
        return 'var(--text-muted)';
    };

    const getStatusText = () => {
        if (status === 'ALERT') return 'Alert';
        if (status === 'LISTENING') return 'Listening';
        return 'Offline';
    };

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border-color)',
            height: '70px'
        }}>
            {/* Left: Title with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    background: 'linear-gradient(135deg, var(--accent-primary), #60a5fa)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
                }}>
                    <Volume2 color="white" size={20} />
                </div>
                <h1 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 700, 
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)'
                }}>
                    Audio Emergency Detection System
                </h1>
            </div>

            {/* Right: Status and Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Status Indicator */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: status === 'OFF' ? 'rgba(100, 116, 139, 0.1)' : 
                                status === 'ALERT' ? 'rgba(239, 68, 68, 0.1)' : 
                                'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${getStatusColor()}`
                    }}>
                        <div style={{
                        width: '10px',
                        height: '10px',
                            borderRadius: '50%',
                        background: getStatusColor(),
                        boxShadow: status !== 'OFF' ? `0 0 10px ${getStatusColor()}` : 'none',
                        animation: status !== 'OFF' ? 'pulse 2s infinite' : 'none'
                        }} />
                        <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                        color: getStatusColor()
                        }}>
                        {getStatusText()}
                        </span>
                    </div>

                {/* Start/Stop Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => toggleSystem('LISTENING')}
                        disabled={status === 'LISTENING' || status === 'ALERT'}
                        style={{
                            background: status === 'LISTENING' || status === 'ALERT' ? 'var(--bg-card)' : 'var(--accent-success)',
                            color: status === 'LISTENING' || status === 'ALERT' ? 'var(--text-muted)' : '#fff',
                            border: `1px solid ${status === 'LISTENING' || status === 'ALERT' ? 'var(--border-color)' : 'var(--accent-success)'}`,
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontWeight: 600,
                            cursor: status === 'LISTENING' || status === 'ALERT' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            opacity: status === 'LISTENING' || status === 'ALERT' ? 0.5 : 1
                        }}
                    >
                        <Play size={16} />
                        Start
                    </button>
                    <button
                        onClick={() => toggleSystem('OFF')}
                        disabled={status === 'OFF'}
                        style={{
                            background: status === 'OFF' ? 'var(--bg-card)' : 'var(--accent-danger)',
                            color: status === 'OFF' ? 'var(--text-muted)' : '#fff',
                            border: `1px solid ${status === 'OFF' ? 'var(--border-color)' : 'var(--accent-danger)'}`,
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontWeight: 600,
                            cursor: status === 'OFF' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            opacity: status === 'OFF' ? 0.5 : 1
                        }}
                    >
                        <Square size={16} />
                        Stop
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </header>
    );
}
