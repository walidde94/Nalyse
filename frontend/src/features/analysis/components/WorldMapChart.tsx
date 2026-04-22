import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    ZoomableGroup
} from 'react-simple-maps';
import {
    Globe2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Maximize2,
    Layers,
    MapPin,
    TrendingUp,
    BarChart3,
    X,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

// ─── GeoJSON URL for world map ─────────────────────────────────────────────
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ─── Country / Region name → ISO code mapping (for matching data) ──────────
const COUNTRY_COORDS: Record<string, [number, number]> = {
    'afghanistan': [67, 33], 'albania': [20, 41], 'algeria': [3, 28], 'argentina': [-64, -34],
    'australia': [133, -25], 'austria': [14, 47.5], 'bangladesh': [90, 24], 'belgium': [4.5, 50.5],
    'brazil': [-51, -10], 'canada': [-106, 56], 'chile': [-71, -30], 'china': [105, 35],
    'colombia': [-72, 4], 'czech republic': [15.5, 49.8], 'czechia': [15.5, 49.8],
    'denmark': [10, 56], 'egypt': [30, 27], 'ethiopia': [40, 9], 'finland': [26, 64],
    'france': [2, 47], 'germany': [10, 51], 'greece': [22, 39], 'india': [77, 20],
    'indonesia': [120, -5], 'iran': [53, 32], 'iraq': [44, 33], 'ireland': [-8, 53],
    'israel': [35, 31.5], 'italy': [12.5, 42.5], 'japan': [138, 36], 'kenya': [38, 1],
    'malaysia': [102, 4], 'mexico': [-102, 23], 'morocco': [-5, 32], 'netherlands': [5.75, 52.5],
    'new zealand': [174, -41], 'nigeria': [8, 10], 'norway': [8, 62], 'pakistan': [70, 30],
    'peru': [-76, -10], 'philippines': [122, 13], 'poland': [20, 52], 'portugal': [-8, 39.5],
    'romania': [25, 46], 'russia': [105, 60], 'saudi arabia': [45, 25], 'south africa': [24, -29],
    'south korea': [128, 36], 'korea': [128, 36], 'spain': [-4, 40], 'sweden': [18, 62],
    'switzerland': [8, 47], 'taiwan': [121, 24], 'thailand': [101, 15], 'turkey': [35, 39],
    'ukraine': [32, 49], 'united arab emirates': [54, 24], 'uae': [54, 24],
    'united kingdom': [-3, 55], 'uk': [-3, 55], 'great britain': [-3, 55],
    'united states': [-98, 38], 'usa': [-98, 38], 'us': [-98, 38], 'america': [-98, 38],
    'vietnam': [108, 16], 'venezuela': [-66, 7],
    // Cities
    'new york': [-74, 40.7], 'los angeles': [-118.2, 34], 'chicago': [-87.6, 41.9],
    'london': [-0.12, 51.5], 'paris': [2.35, 48.9], 'berlin': [13.4, 52.5],
    'tokyo': [139.7, 35.7], 'shanghai': [121.5, 31.2], 'beijing': [116.4, 39.9],
    'mumbai': [72.9, 19.1], 'delhi': [77.2, 28.6], 'bangalore': [77.6, 13],
    'sydney': [151.2, -33.9], 'melbourne': [145, -37.8], 'singapore': [103.8, 1.35],
    'hong kong': [114.2, 22.3], 'dubai': [55.3, 25.2], 'toronto': [-79.4, 43.7],
    'moscow': [37.6, 55.8], 'istanbul': [29, 41], 'cairo': [31.2, 30],
    'são paulo': [-46.6, -23.5], 'sao paulo': [-46.6, -23.5], 'rio de janeiro': [-43.2, -22.9],
    'lagos': [3.4, 6.5], 'nairobi': [36.8, -1.3], 'johannesburg': [28, -26.2],
    'bangkok': [100.5, 13.8], 'seoul': [127, 37.6], 'osaka': [135.5, 34.7],
    'san francisco': [-122.4, 37.8], 'seattle': [-122.3, 47.6], 'miami': [-80.2, 25.8],
    'amsterdam': [4.9, 52.4], 'zurich': [8.5, 47.4], 'munich': [11.6, 48.1],
    'madrid': [-3.7, 40.4], 'barcelona': [2.17, 41.4], 'rome': [12.5, 41.9],
    'milan': [9.19, 45.5], 'stockholm': [18.1, 59.3], 'copenhagen': [12.6, 55.7],
    'vienna': [16.4, 48.2], 'warsaw': [21, 52.2], 'prague': [14.4, 50.1],
    'lisbon': [-9.14, 38.7], 'dublin': [-6.26, 53.3], 'helsinki': [24.9, 60.2],
    'brussels': [4.35, 50.8], 'athens': [23.7, 37.97], 'buenos aires': [-58.4, -34.6],
    'santiago': [-70.6, -33.4], 'lima': [-77, -12], 'bogota': [-74.1, 4.7],
    'kuala lumpur': [101.7, 3.14], 'jakarta': [106.8, -6.2], 'manila': [121, 14.6],
    'hanoi': [105.85, 21], 'ho chi minh': [106.7, 10.8],
    // Continents
    'north america': [-100, 45], 'south america': [-60, -15], 'europe': [15, 50],
    'africa': [20, 5], 'asia': [90, 35], 'oceania': [140, -25], 'antarctica': [0, -80],
    // Regions
    'middle east': [45, 28], 'southeast asia': [110, 5], 'east asia': [115, 35],
    'western europe': [5, 48], 'eastern europe': [28, 50], 'central america': [-85, 15],
    'caribbean': [-70, 18], 'scandinavia': [15, 62], 'nordic': [15, 62],
    'latin america': [-65, -5], 'sub-saharan africa': [25, -5], 'mena': [35, 28],
    'apac': [115, 10], 'emea': [20, 40], 'americas': [-80, 15]
};

// ─── Premium color palette ─────────────────────────────────────────────────
const HEATMAP_COLORS = [
    '#0c1445',  // very low
    '#1a237e',  // low
    '#283593',
    '#3949ab',
    '#5c6bc0',  // medium-low
    '#7986cb',
    '#42a5f5',  // medium
    '#29b6f6',
    '#26c6da',
    '#26a69a',  // medium-high
    '#66bb6a',
    '#9ccc65',
    '#d4e157',  // high
    '#ffee58',
    '#ffa726',  // very high
    '#ef5350'   // hotspot
];

const getHeatmapColor = (value: number, min: number, max: number): string => {
    if (max === min) return HEATMAP_COLORS[8];
    const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
    const idx = Math.round(ratio * (HEATMAP_COLORS.length - 1));
    return HEATMAP_COLORS[idx];
};

// ─── Interfaces ────────────────────────────────────────────────────────────
interface MapDataPoint {
    name: string;
    value: number;
    coords?: [number, number];
}

interface WorldMapChartProps {
    data: any[];
    title?: string;
    onClose?: () => void;
    standalone?: boolean;
}

// ─── Main Component ────────────────────────────────────────────────────────
export const WorldMapChart: React.FC<WorldMapChartProps> = ({
    data,
    title = 'Geospatial Intelligence',
    onClose,
    standalone = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
        coordinates: [10, 20],
        zoom: 1
    });
    const [hoveredGeo, setHoveredGeo] = useState<string | null>(null);
    const [hoveredMarker, setHoveredMarker] = useState<MapDataPoint | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [showMarkers, setShowMarkers] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [expanded, setExpanded] = useState(false);

    // ─── Parse data into map format ────────────────────────────────
    const mapData: MapDataPoint[] = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data
            .filter(d => d && (d.name || d.label || d.country || d.city || d.region || d.location))
            .map(d => {
                const name = (d.name || d.label || d.country || d.city || d.region || d.location || '').toString();
                const value = parseFloat(d.value || d.count || d.amount || d.total || d.revenue || d.sales || 0);
                const key = name.toLowerCase().trim();
                const coords = COUNTRY_COORDS[key] || null;
                return { name, value: isNaN(value) ? 0 : value, coords: coords as [number, number] | undefined };
            })
            .filter(d => d.coords); // Only include data with known coordinates
    }, [data]);

    const { minVal, maxVal, totalVal } = useMemo(() => {
        if (mapData.length === 0) return { minVal: 0, maxVal: 0, totalVal: 0 };
        const vals = mapData.map(d => d.value);
        return {
            minVal: Math.min(...vals),
            maxVal: Math.max(...vals),
            totalVal: vals.reduce((a, b) => a + b, 0)
        };
    }, [mapData]);

    // Country name matching for choropleth
    const countryValues = useMemo(() => {
        const map = new Map<string, number>();
        mapData.forEach(d => {
            const key = d.name.toLowerCase().trim();
            map.set(key, d.value);
        });
        return map;
    }, [mapData]);

    const getCountryValue = useCallback((geoName: string): number | null => {
        const name = geoName.toLowerCase().trim();
        if (countryValues.has(name)) return countryValues.get(name)!;
        // Try partial match
        for (const [key, val] of countryValues.entries()) {
            if (name.includes(key) || key.includes(name)) return val;
        }
        return null;
    }, [countryValues]);

    // ─── Zoom controls ─────────────────────────────────────────────
    const handleZoomIn = () => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 12) }));
    const handleZoomOut = () => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
    const handleReset = () => setPosition({ coordinates: [10, 20], zoom: 1 });
    const handleMoveEnd = (pos: any) => setPosition(pos);

    // ─── Marker size ───────────────────────────────────────────────
    const getMarkerSize = useCallback((value: number): number => {
        if (maxVal === minVal) return 8;
        const ratio = (value - minVal) / (maxVal - minVal);
        return 4 + ratio * 18;
    }, [minVal, maxVal]);

    // Format numbers
    const formatValue = (val: number): string => {
        if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
        if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
        return val.toLocaleString();
    };

    // ─── Sorted data for leaderboard ───────────────────────────────
    const leaderboard = useMemo(() =>
        [...mapData].sort((a, b) => b.value - a.value).slice(0, 10),
        [mapData]
    );

    if (mapData.length === 0) {
        return (
            <div style={{
                height: standalone ? '100%' : '500px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '16px', opacity: 0.4
            }}>
                <Globe2 size={48} />
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    No geographic data detected
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Include columns like country, city, or region in your data
                </span>
            </div>
        );
    }

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                width: '100%',
                height: expanded ? '100vh' : (standalone ? '100%' : '600px'),
                position: expanded ? 'fixed' : 'relative',
                inset: expanded ? 0 : undefined,
                zIndex: expanded ? 9999 : 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(180deg, #040918 0%, #0a0f24 40%, #0d1630 100%)',
                borderRadius: expanded ? 0 : '20px',
                overflow: 'hidden',
                border: expanded ? 'none' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
        >
            {/* ─── Header ─── */}
            <div style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-primary)', boxShadow: '0 4px 12px -2px rgba(59,130,246,0.3)'
                    }}>
                        <Globe2 size={18} />
                    </div>
                    <div>
                        <h3 style={{
                            fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)',
                            letterSpacing: '-0.02em', margin: 0
                        }}>{title}</h3>
                        <p style={{
                            fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
                            textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0
                        }}>
                            {mapData.length} locations • {formatValue(totalVal)} total
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapButton onClick={() => setShowMarkers(!showMarkers)} active={showMarkers} title="Toggle Markers">
                        <MapPin size={14} />
                    </MapButton>
                    <MapButton onClick={() => setShowHeatmap(!showHeatmap)} active={showHeatmap} title="Toggle Heatmap">
                        <Layers size={14} />
                    </MapButton>
                    <div style={{ width: '1px', height: '20px', background: 'var(--border-default)', margin: '0 4px' }} />
                    <MapButton onClick={handleZoomIn} title="Zoom In"><ZoomIn size={14} /></MapButton>
                    <MapButton onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={14} /></MapButton>
                    <MapButton onClick={handleReset} title="Reset View"><RotateCcw size={14} /></MapButton>
                    <MapButton onClick={() => setExpanded(!expanded)} title="Fullscreen">
                        <Maximize2 size={14} />
                    </MapButton>
                    {onClose && (
                        <MapButton onClick={onClose} title="Close">
                            <X size={14} />
                        </MapButton>
                    )}
                </div>
            </div>

            {/* ─── Map + Sidebar ─── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

                {/* ─── Map Canvas ─── */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
                    onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                >
                    {/* Ambient glow effects */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                        background: 'radial-gradient(ellipse at 30% 30%, rgba(59,130,246,0.04) 0%, transparent 70%)'
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                        background: 'radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.03) 0%, transparent 70%)'
                    }} />

                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ scale: 140, center: [0, 20] }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <ZoomableGroup
                            center={position.coordinates}
                            zoom={position.zoom}
                            onMoveEnd={handleMoveEnd}
                            filterZoomEvent={(evt: any) => {
                                if ('touches' in evt) return evt.touches.length === 2;
                                return evt.type !== 'wheel' || !evt.ctrlKey;
                            }}
                        >
                            {/* ─── Country Polygons ─── */}
                            <Geographies geography={GEO_URL}>
                                {({ geographies }: any) =>
                                    geographies.map((geo: any) => {
                                        const geoName = geo.properties.name || '';
                                        const val = showHeatmap ? getCountryValue(geoName) : null;
                                        const isHovered = hoveredGeo === geo.rsmKey;
                                        const isSelected = selectedRegion === geoName;

                                        let fill = 'rgba(30, 40, 70, 0.6)';
                                        if (val !== null && showHeatmap) {
                                            fill = getHeatmapColor(val, minVal, maxVal);
                                        }

                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={isHovered || isSelected ? '#4f7cff' : fill}
                                                stroke='var(--border-default)'
                                                strokeWidth={0.4}
                                                style={{
                                                    default: { outline: 'none', transition: 'fill 0.3s ease' },
                                                    hover: { outline: 'none', cursor: 'pointer' },
                                                    pressed: { outline: 'none' }
                                                }}
                                                onMouseEnter={() => setHoveredGeo(geo.rsmKey)}
                                                onMouseLeave={() => setHoveredGeo(null)}
                                                onClick={() => {
                                                    setSelectedRegion(geoName === selectedRegion ? null : geoName);
                                                    const coords = COUNTRY_COORDS[geoName.toLowerCase()];
                                                    if (coords) {
                                                        setPosition({ coordinates: coords, zoom: 4 });
                                                    }
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>

                            {/* ─── Data Markers ─── */}
                            {showMarkers && mapData.map((point, idx) => {
                                if (!point.coords) return null;
                                const size = getMarkerSize(point.value);
                                const isHovered = hoveredMarker?.name === point.name;

                                return (
                                    <Marker
                                        key={`marker-${idx}`}
                                        coordinates={point.coords}
                                        onMouseEnter={() => setHoveredMarker(point)}
                                        onMouseLeave={() => setHoveredMarker(null)}
                                        onClick={() => {
                                            setSelectedRegion(point.name);
                                            setPosition({ coordinates: point.coords!, zoom: 5 });
                                        }}
                                    >
                                        {/* Pulse ring */}
                                        <circle
                                            r={size + 4}
                                            fill="none"
                                            stroke={getHeatmapColor(point.value, minVal, maxVal)}
                                            strokeWidth="0.5"
                                            opacity={0.3}
                                        >
                                            <animate
                                                attributeName="r"
                                                from={size}
                                                to={size + 10}
                                                dur="2.5s"
                                                repeatCount="indefinite"
                                            />
                                            <animate
                                                attributeName="opacity"
                                                from="0.4"
                                                to="0"
                                                dur="2.5s"
                                                repeatCount="indefinite"
                                            />
                                        </circle>
                                        {/* Main dot */}
                                        <circle
                                            r={isHovered ? size + 2 : size}
                                            fill={getHeatmapColor(point.value, minVal, maxVal)}
                                            stroke='var(--text-muted)'
                                            strokeWidth={isHovered ? 1.5 : 0.5}
                                            opacity={0.85}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                filter: isHovered ? `drop-shadow(0 0 8px ${getHeatmapColor(point.value, minVal, maxVal)})` : 'none'
                                            }}
                                        />
                                        {/* Label (only at higher zoom or on hover) */}
                                        {(position.zoom > 2.5 || isHovered) && (
                                            <text
                                                y={-size - 6}
                                                textAnchor="middle"
                                                style={{
                                                    fontSize: `${Math.max(8, 11 / position.zoom * 2)}px`,
                                                    fontWeight: 700,
                                                    fill: 'var(--text-primary)',
                                                    paintOrder: 'stroke',
                                                    stroke: 'rgba(0,0,0,0.8)',
                                                    strokeWidth: 3,
                                                    fontFamily: 'Inter, system-ui, sans-serif',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                {point.name}
                                            </text>
                                        )}
                                    </Marker>
                                );
                            })}
                        </ZoomableGroup>
                    </ComposableMap>

                    {/* ─── Floating Tooltip ─── */}
                    <AnimatePresence>
                        {hoveredMarker && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'fixed',
                                    left: tooltipPos.x + 16,
                                    top: tooltipPos.y - 10,
                                    pointerEvents: 'none',
                                    zIndex: 99999,
                                    background: 'var(--bg-card)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '14px',
                                    padding: '14px 18px',
                                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
                                    minWidth: '180px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: getHeatmapColor(hoveredMarker.value, minVal, maxVal),
                                        boxShadow: `0 0 8px ${getHeatmapColor(hoveredMarker.value, minVal, maxVal)}`
                                    }} />
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                        {hoveredMarker.name}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '22px', fontWeight: 900, color: getHeatmapColor(hoveredMarker.value, minVal, maxVal),
                                    fontFamily: 'var(--font-mono, monospace)',
                                    letterSpacing: '-0.02em'
                                }}>
                                    {formatValue(hoveredMarker.value)}
                                </div>
                                <div style={{
                                    fontSize: '9px', fontWeight: 700, color: 'var(--text-disabled)',
                                    textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '4px'
                                }}>
                                    {totalVal > 0 ? `${((hoveredMarker.value / totalVal) * 100).toFixed(1)}% of total` : '—'}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ─── Zoom Level Badge ─── */}
                    <div style={{
                        position: 'absolute', bottom: '12px', left: '12px',
                        padding: '4px 10px', borderRadius: '8px',
                        background: 'var(--bg-elevated)', backdropFilter: 'blur(10px)',
                        border: '1px solid var(--border-default)',
                        fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono, monospace)',
                        textTransform: 'uppercase', letterSpacing: '0.15em'
                    }}>
                        {position.zoom.toFixed(1)}x Zoom
                    </div>

                    {/* ─── Gradient Legend ─── */}
                    {showHeatmap && (
                        <div style={{
                            position: 'absolute', bottom: '12px', right: '12px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: 'var(--bg-elevated)', backdropFilter: 'blur(10px)',
                            border: '1px solid var(--border-default)'
                        }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {formatValue(minVal)}
                            </span>
                            <div style={{
                                width: '100px', height: '6px', borderRadius: '3px',
                                background: `linear-gradient(90deg, ${HEATMAP_COLORS[0]}, ${HEATMAP_COLORS[4]}, ${HEATMAP_COLORS[8]}, ${HEATMAP_COLORS[12]}, ${HEATMAP_COLORS[15]})`
                            }} />
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {formatValue(maxVal)}
                            </span>
                        </div>
                    )}
                </div>

                {/* ─── Sidebar: Leaderboard ─── */}
                <div style={{
                    width: '260px',
                    flexShrink: 0,
                    borderLeft: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Sidebar Header */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--border-default)',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <TrendingUp size={14} style={{ color: '#3b82f6' }} />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            Top Regions
                        </span>
                    </div>

                    {/* Leaderboard Items */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                        {leaderboard.map((item, idx) => {
                            const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
                            const isActive = selectedRegion === item.name;

                            return (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    onClick={() => {
                                        setSelectedRegion(item.name === selectedRegion ? null : item.name);
                                        if (item.coords) {
                                            setPosition({ coordinates: item.coords, zoom: 4 });
                                        }
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        marginBottom: '4px',
                                        cursor: 'pointer',
                                        background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                                        border: `1px solid ${isActive ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                    whileHover={{ background: 'var(--bg-surface)' }}
                                >
                                    {/* Rank */}
                                    <div style={{
                                        width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', fontWeight: 900,
                                        background: idx === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                            idx === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                                                idx === 2 ? 'linear-gradient(135deg, #b45309, #92400e)' :
                                                    'var(--bg-surface-hover)',
                                        color: idx < 3 ? 'white' : 'var(--text-muted)',
                                        border: idx >= 3 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                                    }}>
                                        {idx + 1}
                                    </div>

                                    {/* Name & Value */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>
                                            {item.name}
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px'
                                        }}>
                                            {/* Progress bar */}
                                            <div style={{
                                                flex: 1, height: '3px', borderRadius: '2px',
                                                background: 'var(--bg-surface-hover)'
                                            }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ delay: idx * 0.05 + 0.3, duration: 0.6, ease: 'easeOut' }}
                                                    style={{
                                                        height: '100%', borderRadius: '2px',
                                                        background: getHeatmapColor(item.value, minVal, maxVal)
                                                    }}
                                                />
                                            </div>
                                            <span style={{
                                                fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)',
                                                fontFamily: 'var(--font-mono, monospace)',
                                                flexShrink: 0
                                            }}>
                                                {pct.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Value */}
                                    <div style={{
                                        fontSize: '12px', fontWeight: 900, flexShrink: 0,
                                        color: getHeatmapColor(item.value, minVal, maxVal),
                                        fontFamily: 'var(--font-mono, monospace)'
                                    }}>
                                        {formatValue(item.value)}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Sidebar Footer Stats */}
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid var(--border-default)',
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: '8px'
                    }}>
                        <div style={{
                            padding: '8px', borderRadius: '8px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#3b82f6', fontFamily: 'var(--font-mono, monospace)' }}>
                                {mapData.length}
                            </div>
                            <div style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Locations
                            </div>
                        </div>
                        <div style={{
                            padding: '8px', borderRadius: '8px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#8b5cf6', fontFamily: 'var(--font-mono, monospace)' }}>
                                {formatValue(totalVal)}
                            </div>
                            <div style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Total
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Reusable button component ─────────────────────────────────────────────
const MapButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    title?: string;
    children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            width: '32px', height: '32px', borderRadius: '9px', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: active ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)',
            color: active ? '#3b82f6' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = active ? 'rgba(59,130,246,0.2)' : 'var(--border-default)';
            e.currentTarget.style.color = active ? '#60a5fa' : 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = active ? 'rgba(59,130,246,0.15)' : 'var(--bg-surface)';
            e.currentTarget.style.color = active ? '#3b82f6' : 'var(--text-muted)';
        }}
    >
        {children}
    </button>
);

export default WorldMapChart;
