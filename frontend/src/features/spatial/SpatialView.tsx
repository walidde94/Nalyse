import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Map as MapIcon, Compass, Navigation, Database, Maximize2, Crosshair, 
    Zap, RefreshCw, AlertTriangle, Layers, Filter
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { API_URL } from '../../config';

// ─── Theme Config ──────────────────────────────────────────────
// CartoDB Dark Matter tile layer for an enterprise dark mode feel
const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const MAP_ATTR = '&copy; <a href="https://carto.com/">CartoDB</a>';

interface SpatialData {
    lat: number;
    lng: number;
    label?: string;
    magnitude?: number;
    raw?: any;
}

interface Props {
    files: { id: string; filename: string; size: number; createdAt: string }[];
    token: string;
}

// Map Updater Component to automatically recenter map on new data
const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.5 });
    }, [center, zoom, map]);
    return null;
};

export const SpatialView = ({ files, token }: Props) => {
    const { addToast } = useToast();
    const [selectedFile, setSelectedFile] = useState('');
    const [loading, setLoading] = useState(false);
    const [mapData, setMapData] = useState<SpatialData[]>([]);
    const [center, setCenter] = useState<[number, number]>([20, 0]);
    const [zoom, setZoom] = useState(2);
    const [renderStyle, setRenderStyle] = useState<'heat' | 'points'>('points');
    const [mapKey] = useState(() => `spatial-map-${Math.random()}`);

    const fetchSpatialData = useCallback(async () => {
        if (!selectedFile) return;
        setLoading(true);

        try {
            // For now we will hit the preview endpoint which gets raw data
            // In a full implementation, we'd have a dedicated /api/files/:id/spatial endpoint fetching 1000s of rows
            const res = await fetch(`${API_URL}/api/files/${selectedFile}/preview`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) {
                if (res.status === 422) {
                    const err = await res.json();
                    if (err.error === 'FILE_NOT_FOUND') {
                        throw new Error('STORAGE_RESET');
                    }
                }
                throw new Error('Extraction failed');
            }
            const result = await res.json();
            
            const structuredData: SpatialData[] = [];
            // Let's do a naive search for Lat/Long columns
            const rows = result.rows || [];
            if (rows.length === 0) throw new Error('Data is empty');

            const keys = Object.keys(rows[0]);
            let latKey = keys.find(k => k.toLowerCase().includes('lat'));
            let lngKey = keys.find(k => k.toLowerCase().includes('lon') || k.toLowerCase().includes('lng'));
            
            if (!latKey || !lngKey) {
                throw new Error('No geospatial coordinates (Latitude/Longitude) detected in this dataset. To map this data, ensure your file contains columns named "Lat" and "Long".');
            } else {
                for (const row of rows) {
                    const lat = parseFloat(row[latKey]);
                    const lng = parseFloat(row[lngKey]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        structuredData.push({ lat, lng, raw: row });
                    }
                }
            }

            if (structuredData.length > 0) {
                setMapData(structuredData);
                // Simple average center
                const avgLat = structuredData.reduce((sum, d) => sum + d.lat, 0) / structuredData.length;
                const avgLng = structuredData.reduce((sum, d) => sum + d.lng, 0) / structuredData.length;
                setCenter([avgLat, avgLng]);
                setZoom(3);
                addToast(`Plotted ${structuredData.length} spatial points`, 'success');
            } else {
                throw new Error('No valid coordinate pairs could be parsed');
            }

        } catch (e: any) {
            if (e.message === 'STORAGE_RESET') {
                addToast('Server storage reset. Please re-upload this dataset to enable Mapping.', 'error');
            } else {
                addToast(e.message || 'Spatial extraction failed', 'error');
            }
            setMapData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedFile, token, addToast]);

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(16px, 3vw, 32px)' }}>
            
            {/* ─── Header ────────────────────────────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Compass size={24} style={{ color: '#60a5fa' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Geospatial Intelligence
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Vector mapping • Density projections • Geographical analytics
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Configuration Panel ───────────────────────────── */}
            <div style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #60a5fa, #c084fc)' }} />
                
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 flex-wrap" style={{ flex: 1 }}>
                        <div style={{ minWidth: '250px', flex: 1 }}>
                            <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Database size={12} /> Target Dataset
                            </label>
                            <select value={selectedFile} onChange={e => setSelectedFile(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: `1px solid ${selectedFile ? 'rgba(96,165,250,0.4)' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                                <option value="">Select a dataset to map…</option>
                                {files.map(f => <option key={f.id} value={f.id}>{(f as any).originalName || f.filename}</option>)}
                            </select>
                        </div>

                        <div style={{ minWidth: '150px' }}>
                            <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Layers size={12} /> Render Style
                            </label>
                            <select value={renderStyle} onChange={e => setRenderStyle(e.target.value as any)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                                <option value="points">Vector Points</option>
                                <option value="heat">Proximity Heat</option>
                            </select>
                        </div>
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchSpatialData}
                        disabled={loading || !selectedFile}
                        style={{ padding: '10px 24px', height: '40px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #60a5fa, #c084fc)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!selectedFile) ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(96,165,250,0.25)', whiteSpace: 'nowrap', marginTop: '22px' }}>
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <Navigation size={15} />}
                        {loading ? 'Plotting Vectors…' : 'Extract & Plot'}
                    </motion.button>
                </div>
            </div>

            {/* ─── Map Container ──────────────────────────────────── */}
            <div style={{ height: '65vh', minHeight: '500px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-default)', overflow: 'hidden', position: 'relative' }}>
                
                {/* Overlay Loader */}
                <AnimatePresence>
                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,14,0.7)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(192,132,252,0.15)', borderTop: '3px solid #c084fc' }} className="animate-spin" />
                            <div style={{ marginTop: '16px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c084fc' }}>Scanning Vectors</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Leaflet instance */}
                <MapContainer key={mapKey} center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                    <TileLayer url={MAP_TILES} attribution={MAP_ATTR} />
                    <MapUpdater center={center} zoom={zoom} />

                    {mapData.map((d, i) => (
                        <CircleMarker 
                            key={i} 
                            center={[d.lat, d.lng]} 
                            radius={renderStyle === 'heat' ? (d.magnitude || 20) : 6}
                            fillColor={renderStyle === 'heat' ? '#c084fc' : '#60a5fa'}
                            fillOpacity={renderStyle === 'heat' ? 0.3 : 0.8}
                            stroke={renderStyle !== 'heat'}
                            color="#fff"
                            weight={1.5}
                        >
                            <Popup className="premium-popup">
                                <div style={{ padding: '4px' }}>
                                    <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
                                        Spatial Node {i+1}
                                    </h4>
                                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                        Lat: {d.lat.toFixed(4)} <br/>
                                        Lng: {d.lng.toFixed(4)}
                                    </div>
                                    {d.raw && (
                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)' }}>
                                            {Object.entries(d.raw).slice(0, 3).map(([k, v]) => (
                                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>{String(k).substring(0, 10)}</span>
                                                    <span style={{ fontWeight: 600 }}>{String(v).substring(0, 15)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>

                {/* Status Bar */}
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none' }}>
                    
                    <div style={{ background: 'rgba(8,8,14,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '16px', pointerEvents: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: mapData.length > 0 ? '#34d399' : '#f87171', boxShadow: `0 0 10px ${mapData.length > 0 ? '#34d399' : '#f87171'}` }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Nodes Active:</span>
                            <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{mapData.length}</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(8,8,14,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '6px', display: 'flex', gap: '4px', pointerEvents: 'auto' }}>
                        <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setZoom(z => Math.min(z + 1, 18))}><Maximize2 size={14} /></button>
                        <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setCenter([20,0])}><Crosshair size={14} /></button>
                    </div>

                </div>

                {/* Empty State Overlay */}
                {!loading && mapData.length === 0 && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 400, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center', maxWidth: '300px' }}>
                            <MapIcon size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No Spatial Data</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Select a dataset to automatically parse geographic vectors and plot them on the map.</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .premium-popup .leaflet-popup-content-wrapper {
                    background: rgba(8,8,14,0.96) !important;
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: white;
                    border-radius: 12px;
                    box-shadow: 0 24px 48px -8px rgba(0,0,0,0.7);
                }
                .premium-popup .leaflet-popup-tip {
                    background: rgba(8,8,14,0.96) !important;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                .leaflet-container {
                    background: #08080E;
                }
            `}</style>
        </div>
    );
};

export default SpatialView;
