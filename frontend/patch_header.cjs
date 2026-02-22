const fs = require('fs');

try {
    const filePath = './src/components/layout/Header.tsx';
    let content = fs.readFileSync(filePath, 'utf-8');

    let newContent = content;

    // 1. Search Box Background & Border
    newContent = newContent.replace(
        /background: searchFocused \? 'rgba\(15, 15, 25, 0\.9\)' /g,
        "background: searchFocused ? (theme === 'dark' ? 'rgba(15, 15, 25, 0.9)' : 'rgba(255,255,255,0.9)') "
    );

    newContent = newContent.replace(
        /border: `1px solid \$\{searchFocused \? 'rgba\(99, 102, 241, 0\.5\)' : 'rgba\(255,255,255,0\.08\)'\}`/g,
        "border: `1px solid ${searchFocused ? 'rgba(99, 102, 241, 0.5)' : (theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`"
    );

    // 2. Linear Gradient in main header
    newContent = newContent.replace(
        /background: 'linear-gradient\(180deg, rgba\(5, 5, 10, 0\.95\) 0%, rgba\(5, 5, 10, 0\.7\) 100%\)',/,
        "background: theme === 'dark' ? 'linear-gradient(180deg, rgba(5, 5, 10, 0.95) 0%, rgba(5, 5, 10, 0.7) 100%)' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)',"
    );

    // 3. Dropdown Box Shadow
    newContent = newContent.replace(
        /boxShadow: '0 30px 60px -12px rgba\(0,0,0,0\.8\), 0 0 0 1px rgba\(255,255,255,0\.05\)',/g,
        "boxShadow: theme === 'dark' ? '0 30px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' : '0 30px 60px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',"
    );

    // 4. Hover background replacements (onMouseEnter)
    newContent = newContent.replace(
        /e.currentTarget.style.background = '([^']+)';/g,
        (match, p1) => {
            if (p1.includes('rgba(255,255,255')) {
                const lightVariant = p1.replace('255,255,255', '0,0,0');
                return `e.currentTarget.style.background = theme === 'dark' ? '${p1}' : '${lightVariant}';`;
            }
            return match;
        }
    );
    newContent = newContent.replace(
        /e.currentTarget.style.borderColor = '([^']+)';/g,
        (match, p1) => {
            if (p1.includes('rgba(255,255,255')) {
                const lightVariant = p1.replace('255,255,255', '0,0,0');
                return `e.currentTarget.style.borderColor = theme === 'dark' ? '${p1}' : '${lightVariant}';`;
            }
            return match;
        }
    );

    // 5. General Replacements for literal colors
    // Need to use regex to replace precisely and avoid matching things inside already modified template literals
    // Easiest is to split on exact strings.
    const reverseColorMap = {
        "'#fff'": "theme === 'dark' ? '#fff' : '#0f172a'",
        "'rgba(255,255,255,0.8)'": "theme === 'dark' ? 'rgba(255,255,255,0.8)' : '#1e293b'",
        "'rgba(255,255,255,0.7)'": "theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155'",
        "'rgba(255,255,255,0.6)'": "theme === 'dark' ? 'rgba(255,255,255,0.6)' : '#475569'",
        "'rgba(255,255,255,0.5)'": "theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748b'",
        "'rgba(255,255,255,0.4)'": "theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#94a3b8'",
        "'rgba(255,255,255,0.3)'": "theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#cbd5e1'",
        "'rgba(255,255,255,0.1)'": "theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'",
        "'rgba(255,255,255,0.08)'": "theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'",
        "'rgba(255, 255, 255, 0.05)'": "theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.05)'",
        "'rgba(255,255,255,0.05)'": "theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'",
        "'rgba(255,255,255,0.03)'": "theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'",
        "'rgba(255,255,255,0.02)'": "theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'",
        "'rgba(15, 15, 25, 0.9)'": "theme === 'dark' ? 'rgba(15, 15, 25, 0.9)' : 'rgba(255, 255, 255, 0.9)'",
        "'rgba(10, 10, 16, 0.85)'": "theme === 'dark' ? 'rgba(10, 10, 16, 0.85)' : 'rgba(255, 255, 255, 0.95)'",
        "'rgba(0, 0, 0, 0.3)'": "theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)'",
        "'rgba(0,0,0,0.2)'": "theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.5)'"
    };

    // To avoid replacing things twice, we replace them with placeholders.
    const placeholders = {};
    let idx = 0;
    for (const [literal, replacement] of Object.entries(reverseColorMap)) {
        const p = `__PLACEHOLDER_${idx}__`;
        // Only replace matching string literals (surrounded by colons, commas or simply the whole string)
        newContent = newContent.split(literal).join(p);
        placeholders[p] = replacement;
        idx++;
    }

    for (const [p, r] of Object.entries(placeholders)) {
        newContent = newContent.split(p).join(r);
    }

    // 6. Style tag adjustments (for hover states and icon buttons)
    newContent = newContent.replace(
        /\\.nexus-icon-btn \\{[\s\S]*?\\}/g,
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

    newContent = newContent.replace(
        /\\.nexus-icon-btn:hover \\{[\s\S]*?\\}/g,
        `.nexus-icon-btn:hover {
                    background: \${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
                    border-color: \${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
                    color: \${theme === 'dark' ? '#fff' : '#0f172a'};
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px \${theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'};
                }`
    );

    // Minor fix for user profile button
    // It's using 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' for un-pro accounts
    newContent = newContent.replace(
        /'linear-gradient\\(135deg, #334155 0%, #0f172a 100%\\)'/g,
        "theme === 'dark' ? 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' : 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)'"
    );
    newContent = newContent.replace(
        /#09090b/g,
        "theme === 'dark' ? '#09090b' : '#ffffff'"
    );

    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log("Header.tsx patched successfully!");

} catch (e) {
    console.error(e);
}
