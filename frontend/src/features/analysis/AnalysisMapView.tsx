import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default markers not showing in Leaflet with React
// (Though we are using CircleMarkers for a premium aesthetic)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AnalysisMapViewProps {
    data: any[];
    onFilterByRegion?: (region: string) => void;
}

// Visual helper to recenter map when data changes
const MapRecenter = ({ bounds }: { bounds: L.LatLngBoundsExpression | null }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

export const AnalysisMapView = ({ data }: AnalysisMapViewProps) => {
    const [geoColumns, setGeoColumns] = useState<{ lat: string; lng: string } | null>(null);
    const [measureCol, setMeasureCol] = useState<string | null>(null);

    // Identify geographical columns
    useEffect(() => {
        if (!data || data.length === 0) return;
        const firstRow = data[0];
        const keys = Object.keys(firstRow);

        const latKey = keys.find(k => k.toLowerCase().match(/lat|latitude/));
        const lngKey = keys.find(k => k.toLowerCase().match(/lng|long|longitude/));

        // Find a numeric column for sizing
        const potentialMeasure = keys.find(k =>
            typeof firstRow[k] === 'number' &&
            !k.toLowerCase().includes('id') &&
            !k.toLowerCase().includes('lat') &&
            !k.toLowerCase().includes('lng')
        );

        if (latKey && lngKey) {
            setGeoColumns({ lat: latKey, lng: lngKey });
        }
        if (potentialMeasure) {
            setMeasureCol(potentialMeasure);
        }
    }, [data]);

    const processedData = useMemo(() => {
        if (!geoColumns) return [];
        return data.filter(row => {
            const lat = parseFloat(row[geoColumns.lat]);
            const lng = parseFloat(row[geoColumns.lng]);
            return !isNaN(lat) && !isNaN(lng);
        }).map(row => ({
            ...row,
            _lat: parseFloat(row[geoColumns.lat]),
            _lng: parseFloat(row[geoColumns.lng]),
            _val: measureCol ? parseFloat(row[measureCol]) || 0 : 10
        }));
    }, [data, geoColumns, measureCol]);

    const bounds = useMemo(() => {
        if (processedData.length === 0) return null;
        const group = L.featureGroup(processedData.map(d => L.marker([d._lat, d._lng])));
        return group.getBounds();
    }, [processedData]);

    if (!geoColumns) {
        return (
            <div className="flex items-center justify-center p-20 card" style={{ minHeight: '400px', background: 'var(--bg-surface)' }}>
                <div className="text-center flex-col gap-4">
                    <div style={{ color: 'var(--primary)' }}><MapPin size={48} /></div>
                    <h3 className="text-h3">No Geo Data Detected</h3>
                    <p className="text-sec">This dataset doesn't seem to contain lat/lng coordinates.</p>
                </div>
            </div>
        );
    }

    // Helper for bubble styling
    const getBubbleStyle = (val: number) => {
        const maxVal = Math.max(...processedData.map(d => d._val)) || 1;
        const radius = Math.max(5, (val / maxVal) * 20);
        return {
            radius,
            fillColor: '#34d399', // Emerald 400
            color: 'var(--text-primary)',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.5
        };
    };

    return (
        <div className="flex-col gap-4 fade-in" style={{ height: '100%', minHeight: '600px' }}>
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-h3">Geo-Spatial Intelligence</h3>
                    <p className="text-sm text-sec">Visualizing distribution across {processedData.length} locations</p>
                </div>
                <div className="flex gap-2">
                    <span className="badge badge-primary">Measure: {measureCol || 'Density'}</span>
                </div>
            </div>

            <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', border: 'none', borderRadius: '16px', position: 'relative' }}>
                <style>{`
                    .leaflet-container { 
                        background: var(--bg-main) !important; 
                        width: 100%; 
                        height: 100%; 
                    }
                    .leaflet-popup-content-wrapper {
                        background: var(--bg-surface) !important;
                        color: var(--text-primary) !important;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
                        border: 1px solid var(--border-default);
                        border-radius: 12px !important;
                        padding: 0 !important;
                    }
                    .leaflet-popup-content {
                        margin: 0 !important;
                    }
                    .leaflet-popup-tip {
                        background: var(--bg-surface) !important;
                        border: 1px solid var(--border-default);
                    }
                    .leaflet-right .leaflet-control {
                        border: none !important;
                        box-shadow: none !important;
                    }
                `}</style>
                <MapContainer
                    key={`map-${processedData.length > 0 ? processedData[0]._lat : 'empty'}`}
                    center={[20, 0]}
                    zoom={2}
                    scrollWheelZoom={true}
                    style={{ height: '600px', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {processedData.map((point, idx) => (
                        <CircleMarker
                            key={idx}
                            center={[point._lat, point._lng]}
                            {...getBubbleStyle(point._val)}
                        >
                            <Tooltip direction="top" offset={[0, -5]} opacity={1}>
                                <div className="flex-col gap-1" style={{ padding: '8px' }}>
                                    <strong style={{ color: 'var(--primary)' }}>{point.name || point.city || point.id}</strong><br />
                                    {measureCol && <span className="text-sm">{measureCol}: <strong>{point._val.toLocaleString()}</strong></span>}
                                </div>
                            </Tooltip>
                            <Popup>
                                <div className="flex-col gap-2" style={{ minWidth: '150px' }}>
                                    <h4 className="font-bold border-b border-subtle pb-1 mb-1">{point.city || point.name || 'Location Data'}</h4>
                                    {Object.entries(point).map(([k, v]) => {
                                        if (k.startsWith('_') || k === geoColumns.lat || k === geoColumns.lng) return null;
                                        return (
                                            <div key={k} className="flex justify-between gap-4 text-xs">
                                                <span className="opacity-60">{k}:</span>
                                                <span className="font-mono">{String(v)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                    <MapRecenter bounds={bounds as L.LatLngBoundsExpression} />
                </MapContainer>
            </div>
        </div>
    );
};
