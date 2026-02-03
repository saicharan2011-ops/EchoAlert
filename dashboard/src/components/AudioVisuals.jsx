import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, CartesianGrid, Area, AreaChart } from 'recharts';

export function AudioWaveform({ data }) {
    // Format data for Recharts with time-based x-axis
    const chartData = useMemo(() => {
        return data.map((val, i) => ({ 
            time: i, 
            amplitude: val,
            positive: Math.max(0, val),
            negative: Math.min(0, val)
        }));
    }, [data]);

    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    return (
        <div className="card" style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ 
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Audio Waveform
                </h3>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--accent-success)',
                        boxShadow: '0 0 8px var(--accent-success)',
                        animation: 'pulse 2s infinite'
                    }} />
                    <span>{currentTime}</span>
                </div>
            </div>

            {/* Chart */}
            <div style={{ flex: 1, minHeight: 0, padding: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                            <linearGradient id="waveformGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="50%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                            dataKey="time" 
                            hide 
                            domain={[0, 'dataMax']}
                        />
                        <YAxis 
                            domain={[-300, 300]} 
                            hide
                        />
                        <Area
                            type="monotone"
                            dataKey="amplitude"
                            stroke="var(--accent-primary)"
                            strokeWidth={2}
                            fill="url(#waveformGradient)"
                            isAnimationActive={false}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Grid overlay effect */}
            <div style={{
                position: 'absolute', 
                inset: 0, 
                pointerEvents: 'none',
                background: `
                    linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px),
                    linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                zIndex: 1
            }} />

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}

export function AudioMeters({ levels }) {
    const [left, right] = levels;

    const getColor = (val) => {
        if (val > 80) return 'var(--accent-danger)';
        if (val > 60) return 'var(--accent-warning)';
        return 'var(--accent-success)';
    };

    return (
        <div className="card" style={{ height: '100%', padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <MeterBar value={left} label="L" color={getColor(left)} />
            <MeterBar value={right} label="R" color={getColor(right)} />
        </div>
    );
}

function MeterBar({ value, label, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '30px' }}>
            <div style={{
                flex: 1,
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end'
            }}>
                <div style={{
                    width: '100%',
                    height: `${value}%`,
                    background: color,
                    transition: 'height 0.05s ease-out, background-color 0.2s',
                    boxShadow: `0 0 10px ${color}`
                }} />

                {/* Tick marks */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(transparent 90%, rgba(0,0,0,0.5) 90%)', backgroundSize: '100% 10%' }} />
            </div>
            <span style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
        </div>
    );
}
