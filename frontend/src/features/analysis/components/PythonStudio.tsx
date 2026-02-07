
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Terminal, Cpu, Database, Trash2, AlertCircle, CheckCircle2, Loader2, Brackets } from 'lucide-react';

interface PythonStudioProps {
    data: any[];
}

declare global {
    interface Window {
        loadPyodide: any;
    }
}

export const PythonStudio = ({ data }: PythonStudioProps) => {
    const [code, setCode] = useState(`# Python Intelligence Lab
# The 'data' variable contains your current analysis dataset as a list of dictionaries.
# 
# Example: 
# import json
# print(f"Processing {len(data)} records...")
# 
# result = [r for r in data if r.get('status') == 'error']
# print(f"Found {len(result)} errors")

def run_analysis():
    print("Initializing Intelligence Scan...")
    record_count = len(data)
    
    # You can return any object to visualize it below
    return {
        "status": "Success",
        "total_records": record_count,
        "summary": "Script executed successfully"
    }

run_analysis()
`);
    const [output, setOutput] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pyodide, setPyodide] = useState<any>(null);
    const [isPyodideLoading, setIsPyodideLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    // Load Pyodide from CDN
    useEffect(() => {
        const loadPy = async () => {
            if (window.loadPyodide) {
                console.log("Pyodide already loaded");
                try {
                    const py = await window.loadPyodide({
                        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
                    });
                    setPyodide(py);
                    setIsPyodideLoading(false);
                } catch (e) {
                    console.error("Failed to initialize pyodide", e);
                    setError("Failed to initialize Python Environment. Please check your connection.");
                    setIsPyodideLoading(false);
                }
                return;
            }

            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
            script.async = true;
            script.onload = async () => {
                try {
                    const py = await window.loadPyodide({
                        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
                    });
                    setPyodide(py);
                    setIsPyodideLoading(false);
                } catch (e) {
                    console.error("Failed to initialize pyodide", e);
                    setError("Failed to initialize Python Environment.");
                    setIsPyodideLoading(false);
                }
            };
            document.body.appendChild(script);
        };

        loadPy();
    }, []);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const runCode = async () => {
        if (!pyodide) return;

        setIsLoading(true);
        setError(null);
        setOutput([]);
        setResult(null);

        // Redirect Python stdout to our log
        pyodide.setStdout({
            batched: (text: string) => {
                setOutput(prev => [...prev, text]);
            }
        });

        try {
            // Provide data to Python
            pyodide.globals.set("data", pyodide.toPy(data));

            // Run the code
            const res = await pyodide.runPythonAsync(code);

            if (res && res.toJs) {
                setResult(res.toJs());
            } else {
                setResult(res);
            }

            setOutput(prev => [...prev, ">>> Execution Complete"]);
        } catch (e: any) {
            console.error("Python Error", e);
            setError(e.message);
            setOutput(prev => [...prev, `[ERROR] ${e.message}`]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-col gap-6 fade-in h-full" style={{ minHeight: '80vh' }}>
            {/* Environment Status Header */}
            <div className="flex items-center justify-between glass-morphism p-4 rounded-2xl border border-white/5 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${isPyodideLoading ? 'bg-primary/10 animate-pulse' : 'bg-primary/20'}`}>
                        <Cpu size={24} className={isPyodideLoading ? 'text-primary' : 'text-primary shadow-glow-primary'} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight-titles">Python Intelligence Lab</h2>
                        <div className="flex items-center gap-2 mt-1">
                            {isPyodideLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 size={12} className="animate-spin text-primary" />
                                    <span className="label-premium opacity-40">Allocating Neural Resources...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                    <span className="label-premium !text-success">V0.25.0 Runtime Ready</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="btn btn-secondary btn-sm hover-lift active-press"
                        onClick={() => setCode('')}
                    >
                        <Trash2 size={14} className="mr-2 opacity-60" /> Clear
                    </button>
                    <button
                        className="btn btn-primary btn-sm hover-lift active-press shadow-glow-primary px-6"
                        onClick={runCode}
                        disabled={isPyodideLoading || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin mr-2" />
                        ) : (
                            <Play size={16} className="mr-2" />
                        )}
                        Execute Script
                    </button>
                </div>
            </div>

            <div className="grid gap-6 h-full" style={{ gridTemplateColumns: 'minmax(0, 1fr) 350px', flex: 1 }}>
                {/* Editor Section */}
                <div className="flex flex-col gap-4">
                    <div className="card h-full flex flex-col p-0 overflow-hidden relative" style={{ background: '#0a0d17', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="absolute inset-0 glass-noise opacity-10 pointer-events-none" />

                        <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <Brackets size={14} className="text-primary" />
                                <span className="label-premium opacity-60">SCRIPT_EDITOR.PY</span>
                            </div>
                            <span className="label-premium opacity-20">PYTHON 3.11</span>
                        </div>

                        <div className="flex-1 relative flex">
                            {/* Simple line numbers */}
                            <div className="w-12 bg-black/20 flex flex-col items-center pt-5 border-r border-white/5 select-none">
                                {Array.from({ length: code.split('\n').length }).map((_, i) => (
                                    <span key={i} className="text-[10px] font-mono opacity-20 leading-6">{i + 1}</span>
                                ))}
                            </div>
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                spellCheck={false}
                                className="flex-1 bg-transparent p-5 font-data text-sm outline-none resize-none leading-6 w-full h-full"
                                style={{ color: '#e2e8f0', caretColor: 'var(--primary)' }}
                                placeholder="Write your Python script here..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar: Console & Results */}
                <div className="flex flex-col gap-6">
                    {/* Console Output */}
                    <div className="card flex-col p-0 overflow-hidden" style={{ minHeight: '300px', flex: 1, background: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px shadow-2xl' }}>
                        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2 bg-white/[0.02]">
                            <Terminal size={14} className="text-success" />
                            <span className="label-premium opacity-60">Intelligence Console</span>
                        </div>
                        <div
                            ref={outputRef}
                            className="p-5 font-mono text-xs leading-5 overflow-y-auto h-full flex-1 whitespace-pre-wrap"
                            style={{ color: '#6ee7b7' }}
                        >
                            {output.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-20 select-none">
                                    <Database size={40} className="mb-2" />
                                    <p>Awaiting Execution Output</p>
                                </div>
                            )}
                            {output.map((line, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                >
                                    {line}
                                </motion.div>
                            ))}
                            {error && (
                                <div className="text-danger mt-4 p-3 bg-danger/10 rounded-lg border border-danger/20 flex items-start gap-3">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">RUNTIME_EXCEPTION</p>
                                        <p className="opacity-80">{error}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result Preview Card */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card flex-col gap-3 p-5 shadow-glow-primary border-primary/20"
                            style={{ background: 'var(--bg-card)', borderRadius: '20px' }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-success" />
                                    <span className="label-premium">Return Object</span>
                                </div>
                                <span className="text-[10px] font-mono opacity-40">JSON_PREVIEW</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 max-h-[200px] overflow-auto">
                                <pre className="text-[11px] font-mono text-primary/80">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
