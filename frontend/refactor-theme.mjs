import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

function refactorFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let originalCode = fs.readFileSync(filePath, 'utf8');
    let code = originalCode;

    // Hardcoded ternaries
    code = code.replace(/isDark\s*\?\s*['"]#fff['"]\s*:\s*['"]#0f172a['"]/g, "'var(--text-primary)'");
    code = code.replace(/isDark\s*\?\s*['"]#fff['"]\s*:\s*['"]#000['"]/g, "'var(--text-primary)'");
    code = code.replace(/isDark\s*\?\s*['"]#ffffff['"]\s*:\s*['"]#000000['"]/g, "'var(--text-primary)'");
    
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,\s*255,\s*255,\s*0\.7\)['"]\s*:\s*['"]rgba\(15,\s*23,\s*42,\s*0\.7\)['"]/g, "'var(--text-secondary)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.7\)['"]\s*:\s*['"]rgba\(15,23,42,0\.7\)['"]/g, "'var(--text-secondary)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.5\)['"]\s*:\s*['"]rgba\(15,23,42,0\.5\)['"]/g, "'var(--text-secondary)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.4\)['"]\s*:\s*['"]rgba\(15,23,42,0\.4\)['"]/g, "'var(--text-muted)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.35\)['"]\s*:\s*['"]rgba\(15,23,42,0\.35\)['"]/g, "'var(--text-muted)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.3\)['"]\s*:\s*['"]rgba\(15,23,42,0\.3\)['"]/g, "'var(--text-muted)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.8\)['"]\s*:\s*['"]rgba\(15,23,42,0\.8\)['"]/g, "'var(--text-primary)'");
    
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.08\)['"]\s*:\s*['"]rgba\(0,0,0,0\.08\)['"]/g, "'var(--border-subtle)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.06\)['"]\s*:\s*['"]rgba\(0,0,0,0\.06\)['"]/g, "'var(--border-subtle)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.04\)['"]\s*:\s*['"]rgba\(0,0,0,0\.04\)['"]/g, "'var(--bento-border)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.03\)['"]\s*:\s*['"]rgba\(0,0,0,0\.03\)['"]/g, "'var(--bento-glass)'");
    
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.1\)['"]\s*:\s*['"]rgba\(0,0,0,0\.05\)['"]/g, "'var(--bg-surface-hover)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.1\)['"]\s*:\s*['"]rgba\(0,0,0,0\.06\)['"]/g, "'var(--bg-surface-hover)'");
    code = code.replace(/isDark\s*\?\s*['"]rgba\(255,255,255,0\.1\)['"]\s*:\s*['"]rgba\(0,0,0,0\.1\)['"]/g, "'var(--bg-surface-hover)'");
    
    code = code.replace(/isDark\s*\?\s*['"]#09090b['"]\s*:\s*['"]#ffffff['"]/g, "'var(--bg-main)'");
    code = code.replace(/isDark\s*\?\s*['"]linear-gradient\(135deg,\s*#334155\s*0%,\s*#1e293b\s*100%\)['"]\s*:\s*['"]linear-gradient\(135deg,\s*#e2e8f0\s*0%,\s*#f1f5f9\s*100%\)['"]/g, "'var(--bg-surface)'");
    
    code = code.replace(/isDark\s*\?\s*['"]rgba\(0,0,0,0\.15\)['"]\s*:\s*['"]rgba\(255,255,255,0\.5\)['"]/g, "'var(--bg-surface)'");
    
    code = code.replace(/isMidnight\s*\?\s*['"]var\(--primary-subtle\)['"]\s*:\s*isDark\s*\?\s*['"]rgba\(255,255,255,0\.08\)['"]\s*:\s*['"]rgba\(0,0,0,0\.08\)['"]/g, "'var(--border-subtle)'");

    // Also template literals
    code = code.replace(/isMidnight\s*\?\s*['"]rgba\(14, 10, 4, 0\.6\)['"]\s*:\s*isDark\s*\?\s*['"]rgba\(3, 7, 17, 0\.5\)['"]\s*:\s*['"]rgba\(255, 255, 255, 0\.6\)['"]/g, "'var(--bg-header)'");

    if (code !== originalCode) {
        fs.writeFileSync(filePath, code);
        console.log("Updated:", filePath);
    }
}

walk('/Users/admin/Documents/Nalyse/frontend/src', refactorFile);
