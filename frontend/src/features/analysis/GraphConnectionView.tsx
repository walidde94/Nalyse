import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Network, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    type: 'dimension' | 'measure';
    value?: number;
    group: number;
    // D3 Props
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
    value: number;
    type: 'correlation' | 'dependency' | 'frequency';
    // D3 Props
    index?: number;
}

interface GraphConnectionViewProps {
    data: any[];
    dimensions: string[];
    measures: string[];
    onClose: () => void;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        numerator += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
    }
    const denom = Math.sqrt(denomX * denomY);
    return denom === 0 ? 0 : numerator / denom;
}

function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

function getNodeColor(type: 'dimension' | 'measure'): string {
    return type === 'measure' ? '#818cf8' : '#34d399'; // Indigo & Emerald
}

function getLinkColor(type: 'correlation' | 'dependency' | 'frequency'): string {
    switch (type) {
        case 'correlation': return '#f472b6'; // Pink
        case 'dependency': return '#fbbf24'; // Amber
        case 'frequency': return '#38bdf8'; // Sky
        default: return '#6366f1';
    }
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const GraphConnectionView = ({ data, dimensions, measures, onClose }: GraphConnectionViewProps) => {
    const { t } = useLanguage();
    // Refs
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<SVGGElement>(null);

    // State
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Controls
    const [layoutType, setLayoutType] = useState<'force' | 'radial' | 'hierarchical' | 'grid'>('force');
    const [showLabels, setShowLabels] = useState(true);
    const [linkStrengthThreshold, setLinkStrengthThreshold] = useState(0.5); // Default higher for clarity
    const [animationSpeed, setAnimationSpeed] = useState(1);



    // ----------------------------------------------------------------------
    // 1. Data Processing
    // ----------------------------------------------------------------------
    const graphData = useMemo(() => {
        if (!data || data.length === 0) return { nodes: [], links: [] };

        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const allColumns = [...dimensions, ...measures];

        // Create nodes
        allColumns.forEach((col) => {
            const isMeasure = measures.includes(col);
            const uniqueValues = new Set(data.map(row => row[col]));
            nodes.push({
                id: col,
                label: col,
                type: isMeasure ? 'measure' : 'dimension',
                value: uniqueValues.size,
                group: isMeasure ? 1 : 0
            });
        });

        // 1. Correlations (Measure <-> Measure)
        for (let i = 0; i < measures.length; i++) {
            for (let j = i + 1; j < measures.length; j++) {
                const col1 = measures[i];
                const col2 = measures[j];
                const v1 = data.map(r => parseFloat(r[col1]) || 0);
                const v2 = data.map(r => parseFloat(r[col2]) || 0);
                const corr = calculateCorrelation(v1, v2);

                if (Math.abs(corr) > 0.5) {
                    links.push({
                        source: col1,
                        target: col2,
                        value: Math.abs(corr),
                        type: 'correlation'
                    });
                }
            }
        }

        // 2. Dependencies (Dimension -> Measure)
        dimensions.forEach(dim => {
            measures.forEach(measure => {
                const groups = new Map<any, number[]>();
                data.forEach(row => {
                    const key = row[dim];
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key)!.push(parseFloat(row[measure]) || 0);
                });

                const allVals = data.map(r => parseFloat(r[measure]) || 0);
                const totalVar = calculateVariance(allVals);
                let withinVar = 0;
                groups.forEach(gVals => {
                    withinVar += calculateVariance(gVals) * gVals.length;
                });
                withinVar /= data.length;
                const dep = totalVar > 0 ? 1 - (withinVar / totalVar) : 0;

                if (dep > 0.5) {
                    links.push({ source: dim, target: measure, value: dep, type: 'dependency' });
                }
            });
        });

        // 3. Co-occurrence (Dim <-> Dim)
        for (let i = 0; i < dimensions.length; i++) {
            for (let j = i + 1; j < dimensions.length; j++) {
                const c1 = dimensions[i];
                const c2 = dimensions[j];
                const combs = new Set(data.map(r => `${r[c1]}|${r[c2]}`));
                const u1 = new Set(data.map(r => r[c1]));
                const u2 = new Set(data.map(r => r[c2]));
                const mi = combs.size / (u1.size * u2.size); // Basic proxy

                if (mi < 0.5) {
                    links.push({ source: c1, target: c2, value: 1 - mi, type: 'frequency' });
                }
            }
        }

        return {
            nodes,
            links: links.filter(l => l.value >= linkStrengthThreshold)
        };
    }, [data, dimensions, measures, linkStrengthThreshold]);

    // ----------------------------------------------------------------------
    // 2. D3 Simulation & Rendering
    // ----------------------------------------------------------------------

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth || window.innerWidth;
        const height = svgRef.current.clientHeight || window.innerHeight;

        // Clear previous
        svg.selectAll('*').remove();

        // --- Setup Definitions (Gradients/Filters) ---
        const defs = svg.append('defs');

        // Glow Filter (Optimized: Reduced stdDeviation and area)
        const filter = defs.append('filter')
            .attr('id', 'glow-optimized')
            .attr('x', '-20%')
            .attr('y', '-20%')
            .attr('width', '140%')
            .attr('height', '140%');
        filter.append('feGaussianBlur')
            .attr('stdDeviation', '2.5')
            .attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Link Gradients
        graphData.links.forEach((l, i) => {
            const grad = defs.append('linearGradient')
                .attr('id', `link-grad-${i}`)
                .attr('gradientUnits', 'userSpaceOnUse');
            grad.append('stop').attr('offset', '0%').attr('stop-color', getLinkColor(l.type)).attr('stop-opacity', 0.6);
            grad.append('stop').attr('offset', '100%').attr('stop-color', getLinkColor(l.type)).attr('stop-opacity', 0.8);
        });

        // --- Container Group (Zoomable) ---
        const container = svg.append('g').attr('class', 'graph-container');
        (containerRef as any).current = container.node();

        // Zoom Behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .on('zoom', (e) => container.attr('transform', e.transform));
        svg.call(zoom as any);
        svg.call(zoom.transform as any, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8)); // Initial center


        // --- Simulation Setup ---
        let simulation: d3.Simulation<GraphNode, GraphLink>;

        const initializeSimulation = () => {
            // Re-initialize node positions nicely if they don't exist
            graphData.nodes.forEach(n => {
                if (n.x === undefined) {
                    n.x = Math.random() * 100 - 50;
                    n.y = Math.random() * 100 - 50;
                }
            });

            simulation = d3.forceSimulation<GraphNode, GraphLink>(graphData.nodes)
                .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links).id(d => d.id).distance(100))
                .force('charge', d3.forceManyBody().strength(-400))
                .force('collide', d3.forceCollide().radius(40).strength(0.7));

            simulation.on('tick', () => {
                link
                    .attr('x1', d => (d.source as GraphNode).x!)
                    .attr('y1', d => (d.source as GraphNode).y!)
                    .attr('x2', d => (d.target as GraphNode).x!)
                    .attr('y2', d => (d.target as GraphNode).y!);

                connectionFlow
                    .attr('x1', d => (d.source as GraphNode).x!)
                    .attr('y1', d => (d.source as GraphNode).y!)
                    .attr('x2', d => (d.target as GraphNode).x!)
                    .attr('y2', d => (d.target as GraphNode).y!);

                node
                    .attr('transform', d => `translate(${d.x},${d.y})`);

                labels
                    .attr('x', d => d.x!)
                    .attr('y', d => d.y!);
            });

            updateLayoutForces();
        };

        const updateLayoutForces = () => {
            if (!simulation) return;

            // Reset standard forces
            simulation.force('center', null).force('x', null).force('y', null).force('radial', null);

            switch (layoutType) {
                case 'force':
                    simulation.force('center', d3.forceCenter(0, 0)) // 0,0 because we translate container
                        .force('charge', d3.forceManyBody().strength(-500))
                        .alphaDecay(0.02 * animationSpeed);
                    break;
                case 'radial':
                    simulation.force('radial', d3.forceRadial(250, 0, 0).strength(0.8))
                        .force('charge', d3.forceManyBody().strength(-200));
                    break;
                case 'hierarchical':
                    // Dimensions Left, Measures Right
                    simulation.force('x', d3.forceX((d: GraphNode) => d.type === 'dimension' ? -300 : 300).strength(0.6))
                        .force('y', d3.forceY(0).strength(0.05))
                        .force('collide', d3.forceCollide().radius(50));
                    break;
                case 'grid':
                    const cols = Math.ceil(Math.sqrt(graphData.nodes.length));
                    const spacing = 120;
                    simulation.force('x', d3.forceX((d, i) => ((i % cols) - cols / 2) * spacing).strength(0.9))
                        .force('y', d3.forceY((d, i) => (Math.floor(i / cols) - cols / 2) * spacing).strength(0.9));
                    break;
            }
            simulation.alpha(1).restart();
        };

        initializeSimulation();

        // --- Elements ---

        // Links Group
        const linkGroup = container.append('g').attr('class', 'links');
        const link = linkGroup.selectAll('line')
            .data(graphData.links)
            .join('line')
            .attr('stroke', (_d, i) => `url(#link-grad-${i})`)
            .attr('stroke-width', d => Math.max(1, d.value * 5))
            .attr('opacity', 0.6)
            .style('transition', 'opacity 0.2s');

        // Link Traffic (CSS Animation is smoother than D3 attrTween)
        // We clone the path for the animated dash effect
        const connectionFlow = linkGroup.selectAll('line.flow')
            .data(graphData.links)
            .join('line')
            .attr('class', 'flow')
            .attr('stroke', d => getLinkColor(d.type))
            .attr('stroke-width', d => Math.max(1, d.value * 5))
            .attr('stroke-dasharray', '8 12')
            .attr('opacity', 0.8)
            .style('pointer-events', 'none')
            .style('mix-blend-mode', 'screen');

        // Nodes Group
        const nodeGroup = container.append('g').attr('class', 'nodes');

        // Node Container G
        const node = nodeGroup.selectAll('g')
            .data(graphData.nodes)
            .join('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .call(d3.drag<SVGGElement, GraphNode>()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended) as any
            );

        // Node Glow (Outer)
        node.append('circle')
            .attr('r', d => 15 + (d.value ? Math.log(d.value) * 3 : 0))
            .attr('fill', d => getNodeColor(d.type))
            .attr('opacity', 0.2)
            .style('filter', 'url(#glow-optimized)');

        // Node Body (Inner)
        node.append('circle')
            .attr('r', d => 10 + (d.value ? Math.log(d.value) * 2 : 0))
            .attr('fill', '#1e1b4b') // Dark inner
            .attr('stroke', d => getNodeColor(d.type))
            .attr('stroke-width', 2);

        // Icons/Text in Node
        node.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', '10px')
            .style('pointer-events', 'none')
            .text(d => d.type === 'measure' ? '#' : 'Aa');

        // Labels
        const labels = container.append('g').attr('class', 'labels')
            .selectAll('text')
            .data(graphData.nodes)
            .join('text')
            .text(d => d.label)
            .attr('dy', d => 28 + (d.value ? Math.log(d.value) * 3 : 0))
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .style('font-size', '11px')
            .style('font-weight', 600)
            .style('letter-spacing', '0.5px')
            .style('text-transform', 'uppercase')
            .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)')
            .style('opacity', showLabels ? 0.7 : 0)
            .style('pointer-events', 'none')
            .style('transition', 'opacity 0.3s');

        // --- Interaction Handlers ---

        node.on('mouseenter', (e, d) => {
            setHoveredNode(d);
            // Highlight connections
            link.attr('opacity', l => (l.source === d || l.target === d) ? 1 : 0.1);
            connectionFlow.attr('opacity', l => (l.source === d || l.target === d) ? 1 : 0.05);
            labels.attr('opacity', n => (n === d || isConnected(d, n)) ? 1 : 0.1);
            node.attr('opacity', n => (n === d || isConnected(d, n)) ? 1 : 0.2);
        }).on('mouseleave', () => {
            setHoveredNode(null);
            // Reset
            link.attr('opacity', 0.6);
            connectionFlow.attr('opacity', 0.8);
            labels.attr('opacity', showLabels ? 1 : 0);
            node.attr('opacity', 1);
        }).on('click', (e, d) => {
            e.stopPropagation();
            setSelectedNode(curr => curr?.id === d.id ? null : d);
        });

        const isConnected = (a: GraphNode, b: GraphNode) => {
            return graphData.links.some(l =>
                (l.source === a && l.target === b) ||
                (l.source === b && l.target === a)
            );
        };




        // --- Dragging ---
        function dragstarted(event: any, d: GraphNode) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: GraphNode) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: any, d: GraphNode) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return () => {
            simulation.stop();
        };
    }, [graphData, layoutType, showLabels, animationSpeed, linkStrengthThreshold]);


    // ----------------------------------------------------------------------
    // 3. User Interface (React)
    // ----------------------------------------------------------------------



    const handleExport = () => {
        if (!svgRef.current) return;
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgRef.current);
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nalyse-graph.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-main)', zIndex: 1000, color: 'var(--text-primary)' }}>
            {/* CSS for Smoothness */}
            <style>{`
                @keyframes dash-flow {
                    from { stroke-dashoffset: 20; }
                    to { stroke-dashoffset: 0; }
                }
                line.flow {
                    animation: dash-flow ${1 / animationSpeed}s linear infinite;
                }
                .backdrop-blur {
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
            `}</style>

            {/* Ambient Backlight */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%)' }} />
            </div>

            {/* Header / Nav */}
            <div className="backdrop-blur" style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '70px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                        <Network size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{t('graph.title')}</h1>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('graph.subtitle').replace('{nodes}', graphData.nodes.length.toString()).replace('{links}', graphData.links.length.toString())}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                        <input
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                // Simple search logic: highlight first match
                                const match = graphData.nodes.find(n => n.label.toLowerCase().includes(e.target.value.toLowerCase()));
                                if (match && e.target.value.length > 2) setSelectedNode(match);
                            }}
                            placeholder={t('graph.searchPlaceholder')}
                            style={{
                                background: 'var(--bg-surface-hover)',
                                border: '1px solid var(--border-default)',
                                borderRadius: '8px',
                                padding: '8px 12px 8px 32px',
                                color: 'var(--text-primary)',
                                width: '200px',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button onClick={handleExport} className="hover-btn" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px' }}>
                        📥 {t('graph.export')}
                    </button>

                    <button onClick={onClose} style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                        {t('common.close')}
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <svg ref={svgRef} style={{ width: '100vw', height: '100vh', cursor: 'grab' }} />

            {/* Controls Panel */}
            <div className="backdrop-blur" style={{
                position: 'absolute', top: '90px', right: '24px', width: '280px',
                background: 'rgba(20, 20, 30, 0.85)', border: '1px solid var(--border-default)',
                borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('graph.layout')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {(['force', 'radial', 'hierarchical', 'grid'] as const).map(l => (
                            <button
                                key={l}
                                onClick={() => setLayoutType(l)}
                                style={{
                                    padding: '8px', borderRadius: '6px', border: 'none',
                                    background: layoutType === l ? '#6366f1' : 'var(--bg-surface-hover)',
                                    color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>{t('graph.threshold')}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{Math.round(linkStrengthThreshold * 100)}%</span>
                    </div>
                    <input type="range" min="0.05" max="0.9" step="0.05" value={linkStrengthThreshold} onChange={e => setLinkStrengthThreshold(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>{t('graph.animationSpeed')}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{animationSpeed}x</span>
                    </div>
                    <input type="range" min="0.5" max="3" step="0.5" value={animationSpeed} onChange={e => setAnimationSpeed(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ec4899' }} />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', background: 'var(--bg-surface-hover)', padding: '6px 10px', borderRadius: '8px', flex: 1 }}>
                        <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} style={{ accentColor: '#6366f1' }} />
                        {t('graph.labels')}
                    </label>
                    <button
                        onClick={() => {
                            graphData.nodes.forEach(n => { n.x = undefined; n.y = undefined; });
                            setLayoutType('force');
                        }}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                    >
                        {t('graph.reset')}
                    </button>
                </div>
            </div>

            {/* Selected Node Details */}
            {(selectedNode || hoveredNode) && (
                <div className="backdrop-blur" style={{
                    position: 'absolute', bottom: '24px', left: '24px', width: '320px',
                    background: 'rgba(20, 20, 30, 0.85)', border: '1px solid var(--border-default)',
                    borderRadius: '16px', padding: '24px', transform: 'translateY(0)', transition: 'transform 0.3s'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getNodeColor((selectedNode || hoveredNode)!.type) }} />
                        <span style={{ fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>{(selectedNode || hoveredNode)?.type}</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>{(selectedNode || hoveredNode)?.label}</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>{t('graph.uniqueness')}</div>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{(selectedNode || hoveredNode)?.value}</div>
                        </div>
                        <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>{t('graph.connections')}</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#ec4899' }}>
                                {graphData.links.filter(l => l.source === (selectedNode || hoveredNode) || l.target === (selectedNode || hoveredNode)).length}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend (Minimal) */}
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', gap: '16px', fontSize: '12px', background: 'var(--bg-elevated)', padding: '8px 16px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} /> {t('graph.measure')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> {t('graph.dimension')}</div>
            </div>

        </div>
    );
};
