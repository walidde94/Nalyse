import { useState, useRef } from 'react';

interface BiSelectionViewProps {
    onLoadDemo: (type: string) => void;
    onUploadFile: (file: File, type: string) => void;
}

export const BiSelectionView = ({ onLoadDemo, onUploadFile }: BiSelectionViewProps) => {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedType) {
            onUploadFile(e.target.files[0], selectedType);
            setSelectedType(null); // Close modal
        }
    };

    const TEMPLATES = [
        { id: 'sales', icon: '📈', title: 'Sales & Revenue', desc: 'Columns needed: Date, Product, Revenue, Units Sold' },
        { id: 'retention', icon: '👥', title: 'Customer Retention', desc: 'Columns needed: Plan, Retention Score, Last Login' },
        { id: 'supply', icon: '📦', title: 'Supply Chain', desc: 'Columns needed: Stock Level, Reorder Point, Supplier' },
        { id: 'marketing', icon: '📢', title: 'Marketing ROI', desc: 'Columns needed: Channel, Spend, Leads, Cost Per Lead' },
        { id: 'product', icon: '⚙️', title: 'Product Analytics', desc: 'Columns needed: Feature, Active Users, Avg Session' },
        { id: 'executive', icon: '💼', title: 'Executive Reporting', desc: 'Columns needed: Month, Revenue, Profit, Expenses' },
    ];

    return (
        <div className="flex-col gap-8 fade-in h-full relative">
            <div className="text-center mb-4">
                <h2 className="text-h2">Business Intelligence Dashboards</h2>
                <p className="text-secondary mt-2">Select a use case to generate a dashboard from your data.</p>
            </div>

            <div className="grid grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {TEMPLATES.map((t) => (
                    <div
                        key={t.id}
                        className="card card-hover flex-col gap-4"
                        style={{ padding: '32px', cursor: 'pointer' }}
                        onClick={() => setSelectedType(t.id)}
                    >
                        <div style={{ fontSize: '42px', marginBottom: '8px' }}>{t.icon}</div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-h3" style={{ fontSize: '20px' }}>{t.title}</h3>
                            <span style={{ fontSize: '18px', opacity: 0.5 }}>→</span>
                        </div>
                        <p className="text-secondary" style={{ lineHeight: '1.6' }}>{t.desc}</p>
                    </div>
                ))}
            </div>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".csv,.xlsx,.json"
                onChange={handleFileChange}
            />

            {/* Selection Modal */}
            {selectedType && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setSelectedType(null)}>
                    <div
                        className="card flex-col gap-6"
                        style={{ width: '400px', padding: '32px', animation: 'scaleIn 0.2s ease' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-h2 text-center">Data Source</h3>
                        <p className="text-secondary text-center">
                            How would you like to load data for the <b>{TEMPLATES.find(t => t.id === selectedType)?.title}</b> dashboard?
                        </p>

                        <div className="flex-col gap-4 mt-4">
                            <button
                                className="btn btn-primary btn-lg"
                                style={{ height: '56px' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                📂 Upload My File
                            </button>
                            <button
                                className="btn btn-secondary btn-lg"
                                style={{ height: '56px' }}
                                onClick={() => { onLoadDemo(selectedType); setSelectedType(null); }}
                            >
                                🧪 Use Demo Data
                            </button>
                        </div>

                        <button onClick={() => setSelectedType(null)} className="btn btn-ghost btn-sm mt-2">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
