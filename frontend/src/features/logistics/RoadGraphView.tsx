import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { Upload, X, MapPin, Satellite, Plane, Play, Pause, FastForward } from 'lucide-react';

interface TrackPoint {
    lat: number;
    lng: number;
    timestamp?: string;
    speed?: number;
    altitude?: number;
    [key: string]: any;
}

const MapContent = ({ bounds }: { bounds: L.LatLngBounds | null }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [bounds, map]);
    return null;
};

const RoadGraphView = ({ onClose }: { onClose: () => void }) => {
    const [trackData, setTrackData] = useState<TrackPoint[]>([]);

    // Configurations
    const [lineColor, setLineColor] = useState('#6366f1');
    const [lineWidth, setLineWidth] = useState(6);
    const [colorBySpeed, setColorBySpeed] = useState(false);
    const [neonGlow, setNeonGlow] = useState(true);
    const [mapStyle, setMapStyle] = useState('dark'); // dark, satellite, light
    const [playbackIndex, setPlaybackIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Auto Play Logic
    useEffect(() => {
        let interval: any;
        if (isPlaying && playbackIndex < trackData.length - 1) {
            interval = setInterval(() => {
                setPlaybackIndex(prev => {
                    if (prev >= trackData.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000 / playbackSpeed);
        } else if (playbackIndex >= trackData.length - 1) {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, playbackIndex, trackData.length, playbackSpeed]);

    const MAP_LAYERS: Record<string, string> = {
        dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const points = Array.isArray(json) ? json : (json.tracks || json.points || json.data || []);
                const normalized = points.map((p: any) => ({
                    lat: parseFloat(p.lat || p.latitude),
                    lng: parseFloat(p.lng || p.longitude || p.lon),
                    timestamp: p.timestamp || p.time,
                    speed: p.speed || p.velocity || 0,
                    altitude: p.alt || p.altitude || 0,
                    ...p
                })).filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng));

                setTrackData(normalized);
                setPlaybackIndex(-1);
            } catch (err) {
                alert("Invalid metadata. Please upload valid GPS JSON.");
            }
        };
        reader.readAsText(file);
    };

    const polylinePositions = useMemo(() => trackData.map(p => [p.lat, p.lng] as [number, number]), [trackData]);

    const bounds = useMemo(() => {
        if (polylinePositions.length === 0) return null;
        return L.latLngBounds(polylinePositions);
    }, [polylinePositions]);

    const getSpeedColor = (speed: number) => {
        if (speed > 100) return '#ef4444'; // Hot
        if (speed > 50) return '#f59e0b';  // Mid
        return '#10b981'; // Optimal
    };

    return (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-main)', zIndex: 1000, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <style>{`
                .leaflet-container { background: #050505 !important; }
                .backdrop-blur { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
                input[type=range] { accent-color: var(--primary); height: 4px; pointer-events: auto; }
                .neo-btn { background: var(--bg-surface-hover); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary); padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 11px; }
                .neo-btn:hover { background: var(--bg-elevated); border-color: var(--primary); }
                .neo-btn.active { background: var(--primary); border-color: var(--primary); color: var(--text-primary); }
                .neon-glow { filter: drop-shadow(0 0 8px var(--primary)) drop-shadow(0 0 15px var(--primary)); opacity: 0.9 !important; }
            `}</style>

            {/* Premium Header */}
            <div className="backdrop-blur" style={{
                height: '70px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #10b981)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                        <MapPin size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Road Intelligence Studio</h1>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {trackData.length > 0 ? `${trackData.length} track points analyzed` : 'Waiting for track data...'}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input type="file" id="track-upload-main" style={{ display: 'none' }} accept=".json" onChange={handleFileUpload} />
                    <button
                        onClick={() => document.getElementById('track-upload-main')?.click()}
                        style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '10px 20px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Upload size={16} /> Upload Track JSON
                    </button>
                    <button
                        onClick={onClose}
                        style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Main Full-Screen Map */}
            <div style={{ flex: 1, position: 'relative' }}>
                {trackData.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
                        <div style={{ textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ marginBottom: '20px', color: 'var(--primary)' }}>
                                <Satellite size={64} />
                            </div>
                            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Global Tracking Active</h2>
                            <p>Upload a GPS recorded drive to begin visualization</p>
                        </div>
                    </div>
                ) : (
                    <MapContainer
                        key={`${trackData.length > 0 ? 'active' : 'idle'}-${mapStyle}`} // Force remount on data load or style change to prevent reuse errors
                        center={[0, 0]}
                        zoom={3}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; CARTO / Esri'
                            url={MAP_LAYERS[mapStyle]}
                        />

                        {!colorBySpeed ? (
                            <Polyline
                                positions={polylinePositions}
                                color={lineColor}
                                weight={lineWidth}
                                opacity={0.6}
                                className={neonGlow ? 'neon-glow' : ''}
                            />
                        ) : (
                            trackData.map((p, i) => i > 0 && (
                                <Polyline
                                    key={i}
                                    positions={[[trackData[i - 1].lat, trackData[i - 1].lng], [p.lat, p.lng]]}
                                    color={getSpeedColor(p.speed || 0)}
                                    weight={lineWidth}
                                    className={neonGlow ? 'neon-glow' : ''}
                                />
                            ))
                        )}

                        {/* Playback Indicator */}
                        {playbackIndex >= 0 && trackData[playbackIndex] && (
                            <CircleMarker
                                center={[trackData[playbackIndex].lat, trackData[playbackIndex].lng]}
                                radius={12}
                                fillColor={"#fff"}
                                fillOpacity={1}
                                color={getSpeedColor(trackData[playbackIndex].speed || 0)}
                                weight={15}
                                className="neon-glow"
                            >
                                <Tooltip permanent direction="top" offset={[0, -15]}>
                                    <div style={{ padding: '4px 8px' }}>
                                        <b style={{ color: 'var(--primary)' }}>{trackData[playbackIndex].speed} km/h</b><br />
                                        <small style={{ opacity: 0.6 }}>{trackData[playbackIndex].timestamp?.split('T')[1]?.substring(0, 5)}</small>
                                    </div>
                                </Tooltip>
                            </CircleMarker>
                        )}

                        <MapContent bounds={bounds} />
                    </MapContainer>
                )}

                {/* Floating Controls View (Like Graph View) */}
                <div className="backdrop-blur" style={{
                    position: 'absolute', top: '24px', right: '24px', width: '280px',
                    background: 'rgba(20, 20, 30, 0.85)', border: '1px solid var(--border-default)',
                    borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px',
                    zIndex: 1000
                }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Visual Matrix</div>
                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '11px', opacity: 0.6 }}>BASE TILE STYLE</label>
                                <div className="flex gap-2">
                                    {Object.keys(MAP_LAYERS).map(s => (
                                        <button key={s} className={`neo-btn ${mapStyle === s ? 'active' : ''}`} onClick={() => setMapStyle(s)}>{s.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-col gap-2">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                    <span>LINE WEIGHT</span>
                                    <span>{lineWidth}px</span>
                                </div>
                                <input type="range" min="2" max="25" value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} style={{ width: '100%' }} />
                            </div>

                            <div className="flex-col gap-3">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px' }}>SPEED HEATMAP</span>
                                    <input type="checkbox" checked={colorBySpeed} onChange={e => setColorBySpeed(e.target.checked)} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px' }}>NEON PULSE</span>
                                    <input type="checkbox" checked={neonGlow} onChange={e => setNeonGlow(e.target.checked)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {trackData.length > 0 && (
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Route Dynamics</div>
                            <div className="flex-col gap-3">
                                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOP VELOCITY</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>{Math.max(...trackData.map(p => p.speed || 0))} <small>km/h</small></div>
                                </div>
                                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EST. DISTANCE</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>{(trackData.length * 0.12).toFixed(2)} km</div>
                                </div>
                                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AVG SPEED</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700 }}>
                                        {(trackData.reduce((acc, p) => acc + (p.speed || 0), 0) / trackData.length).toFixed(1)} <small>km/h</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mini Speed Chart integration */}
                    {trackData.length > 0 && (
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Speed Intel</div>
                            <div className="card" style={{ padding: '4px', height: '80px', background: 'var(--bg-surface)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trackData.map((d, i) => ({ i, speed: d.speed }))}>
                                        <defs>
                                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="speed" stroke="var(--primary)" fill="url(#chartGrad)" />
                                        {playbackIndex >= 0 && (
                                            <XAxis dataKey="i" hide domain={[0, trackData.length - 1]} />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Timeline Overlay */}
                {trackData.length > 0 && (
                    <div className="backdrop-blur" style={{
                        position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                        width: '70%', background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                        borderRadius: '20px', padding: '16px 32px', zIndex: 1000, boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                            </button>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>
                                    <span>TIMELINE ANALYTICS</span>
                                    <span>{playbackIndex + 1} / {trackData.length} POINTS</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={trackData.length - 1}
                                    value={playbackIndex}
                                    onChange={e => setPlaybackIndex(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                            </div>

                            <div className="flex-col items-end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace' }}>
                                    {playbackIndex >= 0 ? trackData[playbackIndex].timestamp?.split('T')[1]?.substring(0, 8) : '00:00:00'}
                                </div>
                                <div className="flex gap-2 mt-1" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    {[1, 2, 5].map(s => (
                                        <button key={s} className={`neo-btn ${playbackSpeed === s ? 'active' : ''}`} onClick={() => setPlaybackSpeed(s)} style={{ opacity: playbackSpeed === s ? 1 : 0.6 }}>{s}x</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoadGraphView;
