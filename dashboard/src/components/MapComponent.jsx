import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Rotate3D, Compass, Plus, Minus, AlertCircle } from 'lucide-react';
import '@googlemaps/extended-component-library/place_picker.js';

// Assets
import crashIcon from '../../../image.png';
import screamIcon from '../../../scream.png';
import gunIcon from '../../../gun.png';

const API_KEY = 'XYZ';
const MAP_ID = 'DEMO_MAP_ID';

const incidentIcons = {
    explosion: null,
    gun: gunIcon,
    gunfire: gunIcon,
    crash: crashIcon,
    scream: screamIcon
};

const getEventColor = (type) => {
    switch (type?.toLowerCase()) {
        case 'crash': return '#ef4444';
        case 'explosion': return '#f97316';
        case 'gun': return '#dc2626';
        case 'scream': return '#eab308';
        default: return '#a855f7';
    }
};

// Internal component to handle map logic without re-rendering the parent
const MapHandler = ({ currentEvent, userLocation }) => {
    const map = useMap();
    const lastTimestampRef = useRef(null);
    const hasCenteredRef = useRef(false);

    // 1. Handle Start-up Center (User Location)
    useEffect(() => {
        if (!map || !userLocation) return;

        // Only center once on load
        if (!hasCenteredRef.current) {
            map.moveCamera({
                center: userLocation,
                zoom: 18,
                tilt: 45
            });
            hasCenteredRef.current = true;
        }
    }, [map, userLocation]);

    // 2. Handle New Events
    useEffect(() => {
        if (!map || !currentEvent || !currentEvent.lat) return;

        // Only move if meaningful new event (timestamp check)
        if (currentEvent.timestamp !== lastTimestampRef.current) {
            map.moveCamera({
                center: { lat: currentEvent.lat, lng: currentEvent.lng },
                zoom: 19,
                tilt: 60,
                heading: 0,
            });
            lastTimestampRef.current = currentEvent.timestamp;
        }
    }, [map, currentEvent]);

    return null;
};

// Controls component inside APIProvider
const MapControls = ({ autoRotate, setAutoRotate }) => {
    const map = useMap();
    const [is3D, setIs3D] = useState(true);

    useEffect(() => {
        if (!map) return;
        let interval;
        if (autoRotate) {
            interval = setInterval(() => {
                const heading = map.getHeading() || 0;
                map.setHeading((heading + 0.4) % 360);
            }, 20); // Smooth 50fps
        }
        return () => clearInterval(interval);
    }, [map, autoRotate]);

    const toggle3D = () => {
        if (!map) return;
        const currentTilt = map.getTilt();
        const newTilt = currentTilt === 0 ? 45 : 0;
        map.setTilt(newTilt);
        setIs3D(newTilt !== 0);
    };

    const handleZoom = (delta) => {
        if (!map) return;
        map.setZoom((map.getZoom() || 17) + delta);
    };

    return (
        <div style={{ position: 'absolute', bottom: '2rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10 }}>
            <button onClick={toggle3D}
                style={{ background: is3D ? 'var(--accent-primary)' : 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Rotate3D size={16} /> {is3D ? '3D' : '2D'}
            </button>
            <button onClick={() => setAutoRotate(!autoRotate)}
                style={{ background: autoRotate ? '#f43f5e' : 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Compass size={16} className={autoRotate ? "spin" : ""} /> SCAN
            </button>
            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button onClick={() => handleZoom(1)} style={{ padding: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><Plus size={20} /></button>
                <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                <button onClick={() => handleZoom(-1)} style={{ padding: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><Minus size={20} /></button>
            </div>
        </div>
    );
};

export default function MapComponent({ currentEvent, events }) {
    const [autoRotate, setAutoRotate] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    // Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // Stop rotation on new event interaction
    useEffect(() => {
        if (currentEvent) setAutoRotate(false);
    }, [currentEvent]);

    return (
        <div className="card" style={{ height: '100%', padding: 0, overflow: 'hidden', position: 'relative', background: '#0a0e17' }}>
            <APIProvider apiKey={API_KEY} libraries={['places', 'marker']}>
                <Map
                    style={{ width: '100%', height: '100%' }}
                    defaultCenter={{ lat: 40.7128, lng: -74.0060 }}
                    defaultZoom={17}
                    defaultTilt={45}
                    mapId={MAP_ID}
                    disableDefaultUI={true}
                    renderingType={'VECTOR'}
                    reuseMaps={true}
                    colorScheme={'DARK'}
                    gestureHandling={'greedy'}
                >
                    <MapHandler currentEvent={currentEvent} userLocation={userLocation} />
                    <MapControls autoRotate={autoRotate} setAutoRotate={setAutoRotate} />

                    {/* User Location */}
                    {userLocation && (
                        <AdvancedMarker position={userLocation}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid red', opacity: 0.75, position: 'absolute', animation: 'ping 1s infinite' }}></div>
                                <div style={{ width: '16px', height: '16px', background: 'red', borderRadius: '50%', border: '2px solid white', zIndex: 20 }}></div>
                                <div style={{ position: 'absolute', top: '-30px', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', whiteSpace: 'nowrap' }}>YOU</div>
                            </div>
                        </AdvancedMarker>
                    )}

                    {/* Events */}
                    {events.map((ev, i) => {
                        if (!ev.lat || !ev.lng) return null;
                        const color = getEventColor(ev.type);
                        const icon = incidentIcons[ev.type?.toLowerCase()];

                        return (
                            <AdvancedMarker key={i} position={{ lat: ev.lat, lng: ev.lng }}>
                                <div className="group" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'rgba(255,255,255,0.95)',
                                        borderRadius: '8px', border: `2px solid ${color}`,
                                        boxShadow: `0 0 25px rgba(255,255,255,0.8)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden', zIndex: 20
                                    }}>
                                        {icon ?
                                            <img src={icon} alt={ev.type} style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> :
                                            <AlertCircle color={color} size={24} />
                                        }
                                    </div>
                                    <div style={{ width: '2px', height: '30px', background: color, zIndex: 10 }}></div>
                                    <div style={{
                                        position: 'absolute', top: '-25px', background: 'black', color: 'white',
                                        fontSize: '10px', padding: '2px 4px', borderRadius: '4px',
                                        border: `1px solid ${color}`, whiteSpace: 'nowrap'
                                    }}>
                                        {ev.type}
                                    </div>
                                </div>
                            </AdvancedMarker>
                        );
                    })}
                </Map>
            </APIProvider>

            <style>{`
                @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
                .spin { animation: spin 4s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
