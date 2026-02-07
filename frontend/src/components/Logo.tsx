import React from 'react';

export const Logo = ({ className, size = 32 }: { className?: string; size?: number }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="var(--primary, #3b82f6)" />
                    <stop offset="100%" stopColor="var(--accent, #8b5cf6)" />
                </linearGradient>
            </defs>
            {/* Three rising bars representing data analysis/growth */}
            <rect x="4" y="16" width="6" height="12" rx="2" fill="url(#logo-gradient)" fillOpacity="0.7" />
            <rect x="13" y="10" width="6" height="18" rx="2" fill="url(#logo-gradient)" fillOpacity="0.85" />
            <rect x="22" y="4" width="6" height="24" rx="2" fill="url(#logo-gradient)" />
        </svg>
    );
};
