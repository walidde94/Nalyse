import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CloudUpload,
  BrainCircuit,
  LayoutGrid,
  Settings,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface Step {
  title: string;
  content: string;
  icon: React.ReactNode;
  target?: string; // CSS selector of the element to highlight
}

export const OnboardingTour = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number, left: number, transform: string }>({ top: 50, left: 50, transform: 'translate(-50%, -50%)' });
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const steps: Step[] = [
    {
      title: "Executive Briefing: Nalyse Apex",
      content: "Welcome to the future of institutional intelligence. You have just deployed a tier-1 analytical infrastructure. This deep-dive demo will transform you from a user into a data-strategic architect in 90 seconds.",
      icon: <Sparkles size={32} className="text-primary" />
    },
    {
      title: "1. The Workspace (Manual Intake)",
      content: "This is your staging area. Upload raw CSV or Excel files here for immediate processing. Nalyse uses 'Neural Schema Mapping' to automatically understand your column headers, dates, and currency values with no manual configuration required.",
      icon: <LayoutGrid size={32} className="text-info-custom" />,
      target: "#tour-ws-link"
    },
    {
      title: "2. Strategic Data Connectors",
      content: "Scaling beyond manual uploads? Link your enterprise tech-stack directly (PostgreSQL, Salesforce, Shopify). Nalyse creates a live 'Intelligence Stream' that refreshes autonomously, ensuring your findings are never stale.",
      icon: <CloudUpload size={32} className="text-accent-custom" />,
      target: "#tour-connectors-link"
    },
    {
      title: "3. Nexus AI: The Global Core",
      content: "This is your primary interface. Instead of complex SQL queries, type plain English: 'Compare our Q3 logistics costs to Q4 revenue.' Nexus synthesizes the answer across all sources and generates a live report instantly.",
      icon: <BrainCircuit size={32} className="text-primary" />,
      target: "#tour-nexus-ai"
    },
    {
      title: "4. The Correlation Engine",
      content: "Find the 'Why' behind the 'What.' This engine scans for hidden links between disparate files. For example, it might discover that warehouse delays in Berlin are directly causing customer churn in Tokyo—links no human analyst could spot manually.",
      icon: <Zap size={32} className="text-warning-custom" />,
      target: "#tour-correlate-link"
    },
    {
      title: "5. BI Dashboard Studio",
      content: "Transform data into narrative. Build presentation-ready dashboards for board meetings. Use 'Dynamic Variables' to create interactive views that your team can explore without altering the underlying data integrity.",
      icon: <Sparkles size={32} className="text-success-custom" />,
      target: "#tour-bi-link"
    },
    {
      title: "6. The Strategic Board",
      content: "The system's autonomous nerve center. While you are offline, our AI agents scan for anomalies, fraud patterns, and emerging opportunities. Check this board daily for 'Pre-Emptive Signals' that require executive attention.",
      icon: <LayoutGrid size={32} className="text-info-custom" />,
      target: "#tour-sb-link"
    },
    {
      title: "7. Spatial Road Intelligence",
      content: "Specialized for logistics and global trade. Map your supply chain routes in 3D. Identify 'High-Friction Corridors' and optimize your routing logic based on real-world latency data piped through our spatial engine.",
      icon: <BrainCircuit size={32} className="text-accent-custom" />,
      target: "#tour-logistics-link"
    },
    {
      title: "8. Institutional API Layer",
      content: "For engineering teams: Every feature in Nalyse is available via our REST API. Seamlessly integrate our AI synthesis engine into your own internal apps or customer-facing portals.",
      icon: <Settings size={32} className="text-secondary" />,
      target: "#tour-dev-link"
    },
    {
      title: "Command Finalized",
      content: "Preparation is complete. The platform is calibrated. Your first move: Upload a raw asset to the Workspace to trigger the initial neural sync. Welcome to the Apex Tier.",
      icon: <CheckCircle2 size={32} className="text-success-custom" />
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      const step = steps[currentStep];
      if (step.target) {
        const el = document.querySelector(step.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          setSpotlightRect(rect);

          // Position popover relative to target
          let top = rect.bottom + 20;
          let left = rect.left + rect.width / 2;
          let transform = 'translateX(-50%)';

          // Flip to top if near bottom of screen
          if (top + 300 > window.innerHeight) {
            top = rect.top - 20;
            transform = 'translate(-50%, -100%)';
          }

          // Adjust if near horizontal edges
          if (left < 200) {
            left = 20;
            transform = top + 300 > window.innerHeight ? 'translateY(-100%)' : '';
          } else if (left > window.innerWidth - 200) {
            left = window.innerWidth - 460; // Max width is 440
            transform = top + 300 > window.innerHeight ? 'translateY(-100%)' : '';
          }

          setPopoverPos({ top: Math.max(20, top), left: Math.max(20, left), transform });
          return;
        }
      }
      // Revert to center
      setSpotlightRect(null);
      setPopoverPos({ top: 50, left: 50, transform: 'translate(-50%, -50%)' });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 500);
  };

  if (!isVisible && currentStep === 0) return null;

  return (
    <div className={`onboarding-overlay ${isVisible ? 'active' : ''} ${spotlightRect ? 'has-spotlight' : ''}`}>
      {/* Dynamic SVG Spotlight Mask */}
      {spotlightRect && (
        <svg className="spotlight-svg">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlightRect.x - 8}
                y={spotlightRect.y - 8}
                width={spotlightRect.width + 16}
                height={spotlightRect.height + 16}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(2, 6, 23, 0.75)" mask="url(#spotlight-mask)" />
        </svg>
      )}

      <div
        className="onboarding-modal"
        style={{
          position: 'fixed',
          top: spotlightRect ? `${popoverPos.top}px` : '50%',
          left: spotlightRect ? `${popoverPos.left}px` : '50%',
          transform: popoverPos.transform,
          zIndex: 10001
        }}
      >
        <button className="close-tour" onClick={handleComplete} aria-label="Skip tour">
          <X size={20} />
        </button>

        <div className="onboarding-progress">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`prog-bar ${idx <= currentStep ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="onboarding-body">
          <div className="tour-icon-frame">
            {steps[currentStep].icon}
            <div className="icon-pulse"></div>
          </div>

          <h2 className="tour-title">{steps[currentStep].title}</h2>
          <p className="tour-text">{steps[currentStep].content}</p>
        </div>

        <div className="onboarding-footer">
          <button
            className={`btn-tour-secondary ${currentStep === 0 ? 'invisible' : ''}`}
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            style={{ pointerEvents: 'auto', zIndex: 10002 }}
          >
            <ChevronLeft size={18} /> Back
          </button>

          <button
            className="btn-tour-primary"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            style={{ pointerEvents: 'auto', zIndex: 10002 }}
          >
            {currentStep === steps.length - 1 ? (
              <>Finish Tour <Zap size={18} fill="currentColor" /></>
            ) : (
              <>Next Step <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .onboarding-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(8px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
        }

        .onboarding-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }

        .onboarding-overlay.has-spotlight {
          background: transparent;
          backdrop-filter: none;
        }

        .spotlight-svg {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10000;
        }

        .onboarding-modal {
          width: 440px;
          background: var(--bg-card);
          border: 1px solid var(--border-highlight);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.5), 0 0 100px var(--primary-subtle);
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
          z-index: 10001;
          max-height: 85vh;
          overflow-y: auto;
        }

        .close-tour {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          transition: color 0.3s;
          z-index: 10003;
        }

        .close-tour:hover { color: var(--text-primary); }

        .onboarding-progress {
          display: flex;
          gap: 6px;
          margin-bottom: 24px;
        }

        .prog-bar {
          flex: 1;
          height: 4px;
          background: var(--border-subtle);
          border-radius: 2px;
          transition: all 0.4s ease;
        }

        .prog-bar.active {
          background: var(--primary);
          box-shadow: 0 0 8px var(--primary-glow);
        }

        .onboarding-body {
          text-align: center;
          margin-bottom: 32px;
          flex-grow: 1;
        }

        .tour-icon-frame {
          width: 64px;
          height: 64px;
          background: var(--bg-surface);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          position: relative;
          border: 1px solid var(--border-subtle);
        }

        .icon-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 22px;
          border: 2px solid var(--primary);
          opacity: 0.2;
          animation: tour-pulse 2s infinite ease-out;
        }

        @keyframes tour-pulse {
          0% { transform: scale(1); opacity: 0.2; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        .tour-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }

        .tour-text {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .onboarding-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          border-top: 1px solid var(--border-subtle);
          margin-top: 8px;
          flex-shrink: 0;
        }

        .btn-tour-primary {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          box-shadow: 0 4px 12px var(--primary-glow);
        }

        .btn-tour-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px var(--primary-glow);
          filter: brightness(1.1);
        }

        .btn-tour-secondary {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          padding: 11px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }

        .btn-tour-secondary:hover {
          background: var(--bg-surface);
          color: var(--text-primary);
        }

        .invisible {
          opacity: 0;
          pointer-events: none;
        }

        .text-info-custom { color: #3b82f6; }
        .text-accent-custom { color: #8b5cf6; }
        .text-warning-custom { color: #f59e0b; }
        .text-success-custom { color: #10b981; }

        [data-theme='light'] .onboarding-overlay {
          background: rgba(255, 255, 255, 0.4);
        }
        
        [data-theme='light'] .onboarding-modal {
          background: white;
          box-shadow: 0 32px 64px rgba(0,0,0,0.1), 0 0 100px var(--primary-subtle);
        }
      `}</style>
    </div>
  );
};
