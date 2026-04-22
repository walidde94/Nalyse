import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walk(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

function refactorFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let originalCode = fs.readFileSync(filePath, 'utf8');
    let code = originalCode;

    // Specifically for PrivateChatView.tsx and similar styles
    code = code.replace(/background: #020308;/g, "background: var(--bg-app);");
    code = code.replace(/background: rgba\(8, 12, 22, 0\.75\);/g, "background: var(--bg-surface);");
    code = code.replace(/background: rgba\(255, 255, 255, 0\.04\);/g, "background: var(--bg-surface-hover);");
    code = code.replace(/border: 1px solid rgba\(255, 255, 255, 0\.08\);/g, "border: 1px solid var(--border-default);");
    // Only replace literal color: #fff in css blocks (without quotes)
    code = code.replace(/color: #fff;/g, "color: var(--text-primary);");

    // Replace literal rgba strings anywhere (ternaries, objects, inline styles)
    // Texts/Icons
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.7\)['"]/g, "'var(--text-secondary)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.6\)['"]/g, "'var(--text-secondary)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.5\)['"]/g, "'var(--text-muted)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.45\)['"]/g, "'var(--text-muted)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.4\)['"]/g, "'var(--text-muted)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.35\)['"]/g, "'var(--text-muted)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.3\)['"]/g, "'var(--text-muted)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.25\)['"]/g, "'var(--text-disabled)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.2\)['"]/g, "'var(--text-disabled)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.15\)['"]/g, "'var(--text-disabled)'");

    // Backgrounds / Borders (low opacity)
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.1\)['"]/g, "'var(--bg-elevated)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.08\)['"]/g, "'var(--border-default)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.06\)['"]/g, "'var(--border-default)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.05\)['"]/g, "'var(--bg-surface-hover)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.04\)['"]/g, "'var(--bg-surface-hover)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.03\)['"]/g, "'var(--bg-surface)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.02\)['"]/g, "'var(--bg-surface)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.015\)['"]/g, "'var(--bg-surface)'");
    code = code.replace(/['"]rgba\(255,\s*255,\s*255,\s*0\.01\)['"]/g, "'var(--bg-surface)'");

    // Dark mode rgba overrides
    code = code.replace(/['"]rgba\(15,\s*23,\s*42,\s*0\.95\)['"]/g, "'var(--bg-card)'");
    code = code.replace(/['"]rgba\(0,\s*0,\s*0,\s*0\.5\)['"]/g, "'var(--bg-elevated)'");

    // General #fff in ternaries that aren't primary buttons
    // This is tricky, but let's replace `color: isActive ? '#818cf8' : '#fff'` etc
    // Only where '#fff' is an isolated string
    // Let's do a more careful replace for AutomationView tabs
    code = code.replace(/color:\s*activeTab === tab\.id \? '([^']+)' : '#fff'/g, "color: activeTab === tab.id ? '$1' : 'var(--text-primary)'");

    // In OrganizationView, the avatar color has "#fff": color: '#fff' -> color: 'var(--text-primary)'
    // I already did that in the previous script but only for lines without colored backgrounds.
    // Let's explicitly fix OrganizationView.tsx
    if (filePath.includes('OrganizationView.tsx')) {
        code = code.replace(/color:\s*['"]#fff['"]/g, "color: 'var(--text-primary)'");
        code = code.replace(/background:\s*['"]rgba\(255,255,255,0\.015\)['"]/g, "background: 'var(--bg-surface)'");
        code = code.replace(/background:\s*['"]#0d0d0d['"]/g, "background: 'var(--bg-main)'");
    }

    if (filePath.includes('AutomationView.tsx')) {
        code = code.replace(/color:\s*activeTab === tab\.id \? '#818cf8' : 'rgba\(255,255,255,0\.4\)'/g, "color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)'");
    }

    if (code !== originalCode) {
        fs.writeFileSync(filePath, code);
        console.log("Fixed light mode strings in:", filePath);
    }
}

walk('/Users/admin/Documents/Nalyse/frontend/src', refactorFile);
