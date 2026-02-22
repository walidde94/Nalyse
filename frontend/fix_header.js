const fs = require('fs');
let content = fs.readFileSync('./src/components/layout/Header.tsx', 'utf-8');

// 1. Header Background
content = content.replace(
    /background: 'linear-gradient\(180deg, rgba\(5, 5, 10, 0\.95\) 0%, rgba\(5, 5, 10, 0\.7\) 100%\)',/g,
    `background: theme === 'dark' ? 'linear-gradient(180deg, rgba(5, 5, 10, 0.95) 0%, rgba(5, 5, 10, 0.7) 100%)' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)',`
);

// 2. Global text/border RGBA replacements (using regex to catch most UI text elements)
content = content.replace(
    /color: '#fff'/g,
    `color: theme === 'dark' ? '#fff' : '#0f172a'`
);
content = content.replace(
    /color: 'rgba\(255,255,255,0\.8\)'/g,
    `color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : '#1e293b'`
);
content = content.replace(
    /color: 'rgba\(255,255,255,0\.7\)'/g,
    `color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155'`
);
content = content.replace(
    /color: 'rgba\(255,255,255,0\.6\)'/g,
    `color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : '#475569'`
);
content = content.replace(
    /color: 'rgba\(255,255,255,0\.5\)'/g,
    `color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748b'`
);
content = content.replace(
    /color: 'rgba\(255,255,255,0\.4\)'/g,
    `color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#64748b'`
);
content = content.replace(
    /color: 'rgba\(255,255,255,0\.3\)'/g,
    `color: theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#94a3b8'`
);

// Dividers and borders
content = content.replace(
    /background: 'rgba\(255,255,255,0\.1\)'/g,
    `background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'`
);
content = content.replace(
    /background: 'rgba\(255,255,255,0\.08\)'/g,
    `background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'`
);
content = content.replace(
    /background: 'rgba\(255,255,255,0\.05\)'/g,
    `background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'`
);
content = content.replace(
    /background: 'rgba\(255,255,255,0\.03\)'/g,
    `background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'`
);
content = content.replace(
    /background: 'rgba\(255,255,255,0\.02\)'/g,
    `background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'`
);

content = content.replace(
    /border: '1px solid rgba\(255,255,255,0\.1\)'/g,
    `border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'`
);
content = content.replace(
    /border: '1px solid rgba\(255,255,255,0\.08\)'/g,
    `border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'`
);
content = content.replace(
    /border: '1px solid rgba\(255, 255, 255, 0\.05\)'/g,
    `border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0,0,0,0.05)'`
);
content = content.replace(
    /border: '1px solid rgba\(255,255,255,0\.05\)'/g,
    `border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'`
);

// Search input wrapper
content = content.replace(
    /background: searchFocused \? 'rgba\(15, 15, 25, 0\.9\)' /g,
    `background: searchFocused ? (theme === 'dark' ? 'rgba(15, 15, 25, 0.9)' : 'rgba(255,255,255,0.9)') `
);
content = content.replace(
    /border: `1px solid \$\{searchFocused \? 'rgba\(99, 102, 241, 0\.5\)' : 'rgba\(255,255,255,0\.08\)'\}`/g,
    `border: \`1px solid \${searchFocused ? 'rgba(99, 102, 241, 0.5)' : (theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}\``
);

// Telemetry background
content = content.replace(
    /background: 'rgba\(0, 0, 0, 0\.3\)'/g,
    `background: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)'`
);

// Language Switcher background
content = content.replace(
    /background: 'rgba\(0,0,0,0\.2\)'/g,
    `background: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.5)'`
);

// Dropdowns background
content = content.replace(
    /background: 'rgba\(10, 10, 16, 0\.85\)'/g,
    `background: theme === 'dark' ? 'rgba(10, 10, 16, 0.85)' : 'rgba(255, 255, 255, 0.95)'`
);
content = content.replace(
    /boxShadow: '0 30px 60px -12px rgba\(0,0,0,0\.8\), 0 0 0 1px rgba\(255,255,255,0\.05\)'/g,
    `boxShadow: theme === 'dark' ? '0 30px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' : '0 30px 60px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'`
);

// Fix Hover states in buttons (UserMenu Identity items)
// The onMouseEnter e.currentTarget overrides
content = content.replace(
    /e\.currentTarget\.style\.background = 'rgba\(255,255,255,0\.04\)';/g,
    `e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';`
);
content = content.replace(
    /e\.currentTarget\.style\.background = 'rgba\(255,255,255,0\.08\)';/g,
    `e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';`
);
content = content.replace(
    /e\.currentTarget\.style\.borderColor = 'rgba\(255,255,255,0\.15\)';/g,
    `e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';`
);
content = content.replace(
    /e\.currentTarget\.style\.borderColor = 'rgba\(255,255,255,0\.08\)';/g,
    `e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';`
);
content = content.replace(
    /e\.currentTarget\.style\.borderColor = 'rgba\(255,255,255,0\.05\)';/g,
    `e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';`
);
content = content.replace(
    /e\.currentTarget\.style\.background = 'rgba\(255,255,255,0\.03\)';/g,
    `e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';`
);

// Update style tags
content = content.replace(
    /\.nexus-icon-btn \{([\s\S]*?)\}/,
    `.nexus-icon-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: \${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
                    border: 1px solid \${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
                    color: \${theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'};
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    cursor: pointer;
                }`
);

content = content.replace(
    /\.nexus-icon-btn:hover \{([\s\S]*?)\}/,
    `.nexus-icon-btn:hover {
                    background: \${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
                    border-color: \${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
                    color: \${theme === 'dark' ? '#fff' : '#0f172a'};
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }`
);

fs.writeFileSync('./src/components/layout/Header.tsx', content);
console.log('Script completed');
