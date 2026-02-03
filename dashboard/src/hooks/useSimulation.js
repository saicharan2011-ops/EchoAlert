import { useState, useEffect, useRef } from 'react';

// Random data generators
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Initial start location (Hyderabad, India)
const BASE_LAT = 17.3850; // Hyderabad, India
const BASE_LNG = 78.4867;

export function useSimulation() {
    const [status, setStatus] = useState('OFF'); // 'OFF' | 'LISTENING' | 'ALERT'
    const [systemHealth, setSystemHealth] = useState({ cpu: 12, memory: 450, latency: 12 });
    const [currentEvent, setCurrentEvent] = useState(null);
    const [eventHistory, setEventHistory] = useState([]);
    const [audioData, setAudioData] = useState(new Array(100).fill(0)); // Waveform buffer (larger for smoother scrolling)
    const [decibelLevel, setDecibelLevel] = useState(0); // Single decibel level (0dB to 100dB range)
    const [sampleRate, setSampleRate] = useState(44100); // Sample rate in Hz

    // Refs for intervals to clear them
    const audioInterval = useRef(null);
    const eventInterval = useRef(null);
    const statusInterval = useRef(null);
    const currentEventHoldTimeout = useRef(null);

    const toggleSystem = (newStatus) => {
        if (newStatus) {
            setStatus(newStatus);
        } else {
            setStatus(prev => prev === 'LISTENING' || prev === 'ALERT' ? 'OFF' : 'LISTENING');
        }
    };

    useEffect(() => {
        // Run simulation when status is LISTENING or ALERT
        if (status === 'LISTENING' || status === 'ALERT') {
            // 1. Audio Waveform & Meter Loop (Fast: 50ms)
            audioInterval.current = setInterval(() => {
                // Generate random waveform point (larger range for more dramatic visualization)
                const baseValue = randomInt(-200, 200);
                const newValue = baseValue + randomInt(-50, 50);
                setAudioData(prev => {
                    const newData = [...prev.slice(1), Math.max(-300, Math.min(300, newValue))];
                    return newData;
                });

                // Update decibel level based on audio amplitude
                // Convert amplitude to decibel (0dB to 100dB range)
                const amplitude = Math.abs(newValue);
                const dbValue = Math.max(0, Math.min(100, (amplitude / 300) * 100));
                setDecibelLevel(dbValue);
            }, 50);

            // 2. System Status Loop (Medium: 1s)
            statusInterval.current = setInterval(() => {
                setSystemHealth({
                    cpu: randomInt(10, 35),
                    memory: randomInt(400, 800),
                    latency: randomInt(8, 25)
                });
            }, 1000);

            // 3. Event Loop (Slow: Random 2-6s for more frequent updates)
            const scheduleNextEvent = () => {
                const delay = randomInt(2000, 6000);
                eventInterval.current = setTimeout(() => {
                    triggerRandomEvent();
                    scheduleNextEvent(); // Recursive schedule
                }, delay);
            };

            scheduleNextEvent();

        } else {
            // Cleanup when OFF
            clearInterval(audioInterval.current);
            clearInterval(statusInterval.current);
            clearTimeout(eventInterval.current);
            clearTimeout(currentEventHoldTimeout.current);
            // Reset immediate visuals (keep history)
            setDecibelLevel(0);
            setAudioData(new Array(100).fill(0));
            setSystemHealth(prev => ({ ...prev, cpu: 2, latency: 0 }));
            setCurrentEvent(null); // Clear current event when system stops
        }

        return () => {
            clearInterval(audioInterval.current);
            clearInterval(statusInterval.current);
            clearTimeout(eventInterval.current);
            clearTimeout(currentEventHoldTimeout.current);
        };
    }, [status]);

    const triggerRandomEvent = () => {
        // 55% chance of Normal, 15% Crash, 15% Scream, 10% Explosion, 5% Gun
        const roll = Math.random();
        let type = 'Normal';
        if (roll > 0.95) type = 'Gun';
        else if (roll > 0.85) type = 'Explosion';
        else if (roll > 0.70) type = 'Scream';
        else if (roll > 0.55) type = 'Crash';

        const newEvent = {
            id: Date.now(),
            type,
            confidence: randomFloat(70, 98).toFixed(1),
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            lat: BASE_LAT + randomFloat(-0.01, 0.01),
            lng: BASE_LNG + randomFloat(-0.01, 0.01),
        };

        // Always set current event - prioritize emergency events
        // Emergency events (Crash, Explosion, Scream, Gun) should always be shown
        // Normal events only show if there's no emergency event currently displayed
        const isEmergency = ['Crash', 'Explosion', 'Scream', 'Gun'].includes(type);
        
        if (isEmergency) {
            // Clear any existing timeout
            clearTimeout(currentEventHoldTimeout.current);
            // Always show emergency events immediately - use functional update to ensure it's set
            setCurrentEvent(newEvent);
            // Hold emergency events for 15 seconds before allowing Normal to overwrite
            currentEventHoldTimeout.current = setTimeout(() => {
                setCurrentEvent(prev => {
                    // Only clear if this is still the current event (hasn't been replaced)
                    if (prev?.id === newEvent.id) {
                        // Find most recent Normal event to show, or null
                        return null;
                    }
                    return prev;
                });
            }, 15000);
        } else {
            // For Normal events, only show if there's no emergency event currently displayed
            setCurrentEvent(prev => {
                // If there's an emergency event, keep it
                if (prev && ['Crash', 'Explosion', 'Scream', 'Gun'].includes(prev.type)) {
                    return prev;
                }
                // Otherwise show this Normal event
                return newEvent;
            });
        }
        
        // Update status to ALERT for critical events
        if (['Crash', 'Explosion', 'Gun'].includes(type)) {
            setStatus('ALERT');
            // Auto-clear alert after 5 seconds
            setTimeout(() => {
                setStatus(prev => prev === 'ALERT' ? 'LISTENING' : prev);
            }, 5000);
        }
        
        // Add all events to history (including Normal)
        setEventHistory(prev => [newEvent, ...prev].slice(0, 10)); // Keep last 10
    };

    return {
        status,
        toggleSystem,
        systemHealth,
        currentEvent,
        eventHistory,
        audioData,
        decibelLevel,
        sampleRate,
    };
}
