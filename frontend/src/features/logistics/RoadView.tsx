import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Routing Engine Integration ---
const RoutingControl = ({ from, to }: { from: L.LatLng, to: L.LatLng }) => {
    const map = useMap();
    const routingControlRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;

        // Remove existing control if any
        if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
        }

        // Create new routing control
        routingControlRef.current = (L as any).Routing.control({
            waypoints: [from, to],
            lineOptions: {
                styles: [{ color: '#6366f1', weight: 6, opacity: 0.8 }]
            },
            show: true,
            addWaypoints: false,
            routeWhileDragging: true,
            draggableWaypoints: true,
            fitSelectedRoutes: true,
            showAlternatives: false,
            // Styling the routing container to match our UI
            containerClassName: 'routing-panel-container'
        }).addTo(map);

        return () => {
            if (routingControlRef.current) {
                map.removeControl(routingControlRef.current);
            }
        };
    }, [map, from, to]);

    return null;
};

export const RoadView = () => {
    const [fromPoint, setFromPoint] = useState<L.LatLng>(L.latLng(52.5200, 13.4050)); // Berlin
    const [toPoint, setToPoint] = useState<L.LatLng>(L.latLng(48.8566, 2.3522)); // Paris
    const [addressFrom, setAddressFrom] = useState('Berlin, Germany');
    const [addressTo, setAddressTo] = useState('Paris, France');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (type: 'from' | 'to', query: string) => {
        if (!query) return;
        setIsLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data && data[0]) {
                const newPoint = L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
                if (type === 'from') setFromPoint(newPoint);
                else setToPoint(newPoint);
            }
        } catch (e) {
            console.error('Geocoding failed', e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-col fade-in" style={{ height: 'calc(100vh - 100px)', padding: '24px' }}>
            <style>{`
                .routing-panel-container {
                    background: rgba(15, 17, 26, 0.9) !important;
                    color: white !important;
                    padding: 20px !important;
                    border-radius: 16px !important;
                    border: 1px solid rgba(99, 102, 241, 0.3) !important;
                    backdrop-filter: blur(12px) !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
                    max-height: 500px !important;
                    overflow-y: auto !important;
                    width: 340px !important;
                    font-size: 13px !important;
                    margin: 20px !important;
                }
                .leaflet-routing-alt {
                    background: transparent !important;
                    padding: 0 !important;
                }
                .leaflet-routing-alt-table { border-collapse: collapse; width: 100%; }
                .leaflet-routing-alt-table tr:hover { background: rgba(255,255,255,0.05); }
                .leaflet-routing-alt-table td { padding: 12px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .leaflet-routing-icon { filter: invert(1); opacity: 0.8; }
                .leaflet-routing-geocoders { display: none; }
                .leaflet-routing-instruction-distance { opacity: 0.5; font-size: 11px; }
            `}</style>

            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-h1">Road Intelligence</h1>
                    <p className="text-sec">Interactive routing and logistics path analysis.</p>
                </div>
                <div className="badge badge-primary">Standard Engine: OSRM</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
                {/* Search Sidebar */}
                <div className="card flex-col gap-6" style={{ height: 'fit-content' }}>
                    <h3 className="text-h3">Route Planning</h3>

                    <div className="flex-col gap-2">
                        <label className="text-xs font-bold text-tertiary">ORIGIN (A)</label>
                        <div className="flex gap-2">
                            <input
                                className="input"
                                value={addressFrom}
                                onChange={e => setAddressFrom(e.target.value)}
                                placeholder="Start location..."
                            />
                            <button className="btn btn-secondary btn-sm" onClick={() => handleSearch('from', addressFrom)}>🔍</button>
                        </div>
                    </div>

                    <div className="flex-col gap-2">
                        <label className="text-xs font-bold text-tertiary">DESTINATION (B)</label>
                        <div className="flex gap-2">
                            <input
                                className="input"
                                value={addressTo}
                                onChange={e => setAddressTo(e.target.value)}
                                placeholder="End location..."
                            />
                            <button className="btn btn-secondary btn-sm" onClick={() => handleSearch('to', addressTo)}>🔍</button>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-bg-surface border border-subtle mt-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-xs opacity-60">Calculated Distance</span>
                            <span className="text-sm font-bold text-primary">Pending...</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs opacity-60">EST. Duration</span>
                            <span className="text-sm font-bold text-primary">Pending...</span>
                        </div>
                    </div>

                    <button className="btn btn-primary w-full mt-2" disabled={isLoading} onClick={() => {
                        handleSearch('from', addressFrom);
                        handleSearch('to', addressTo);
                    }}>
                        {isLoading ? 'Recalculating...' : 'Optimize Route'}
                    </button>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-default)', position: 'relative', height: '100%' }}>
                    <MapContainer
                        center={[50, 10]}
                        zoom={5}
                        style={{ height: '100%', width: '100%', background: '#0b0e14' }}
                    >
                        <TileLayer
                            attribution='&copy; CARTO'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <RoutingControl from={fromPoint} to={toPoint} />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};
