import React from 'react';

interface LogoProps {
    className?: string;
    style?: React.CSSProperties;
    hideText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, style, hideText = false }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }} className={className}>
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Background Grid */}
                <path d="M4 28H28M4 4V28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />

                {/* Scatter Points */}
                <circle cx="10" cy="22" r="2.5" fill="url(#logo-grad-1)" className="logo-point-1" />
                <circle cx="16" cy="14" r="2.5" fill="url(#logo-grad-2)" className="logo-point-2" />
                <circle cx="22" cy="11" r="2.5" fill="url(#logo-grad-1)" className="logo-point-3" />
                <circle cx="25" cy="20" r="2.5" fill="url(#logo-grad-2)" className="logo-point-4" />
                <circle cx="12" cy="8" r="2.5" fill="url(#logo-grad-1)" className="logo-point-5" />

                <style>{`
                    .logo-point-1 { animation: pulsePoints 3s infinite ease-in-out; }
                    .logo-point-2 { animation: pulsePoints 3s infinite ease-in-out 0.5s; }
                    .logo-point-3 { animation: pulsePoints 3s infinite ease-in-out 1s; }
                    .logo-point-4 { animation: pulsePoints 3s infinite ease-in-out 1.5s; }
                    .logo-point-5 { animation: pulsePoints 3s infinite ease-in-out 2s; }
                    @keyframes pulsePoints {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.2); opacity: 0.7; }
                    }
                `}</style>

                {/* Connecting Trend Line (Subtle) */}
                <path
                    d="M6 26C10 22 14 18 16 14C18 10 20 12 22 11"
                    stroke="url(#logo-grad-main)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0px 0px 4px rgba(59, 130, 246, 0.5))' }}
                />

                <defs>
                    <linearGradient id="logo-grad-main" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3B82F6" />
                        <stop offset="1" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient id="logo-grad-1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#60A5FA" />
                        <stop offset="1" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="logo-grad-2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#A78BFA" />
                        <stop offset="1" stopColor="#8B5CF6" />
                    </linearGradient>
                </defs>
            </svg>

            {!hideText && (
                <span style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    fontFamily: 'var(--font-heading, "Inter", sans-serif)',
                    color: 'var(--text-primary)',
                    background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--primary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex',
                    alignItems: 'baseline'
                }}>
                    Nalyse
                </span>
            )}
        </div>
    );
};
