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
    let codeLines = originalCode.split('\n');
    let updated = false;

    for (let i = 0; i < codeLines.length; i++) {
        let line = codeLines[i];
        let origLine = line;

        // Check if the line likely represents a colored button or badge. If so, skip text color replacements.
        const isColoredBg = /linear-gradient|var\(--primary\)|var\(--accent\)|#6366f1|#8b5cf6|#3b82f6|#10b981|#ef4444|#f59e0b/.test(line);

        if (!isColoredBg) {
            line = line.replace(/color:\s*['"]#fff['"]/g, "color: 'var(--text-primary)'");
            line = line.replace(/color:\s*['"]#ffffff['"]/g, "color: 'var(--text-primary)'");
            line = line.replace(/color:\s*['"]#000['"]/g, "color: 'var(--text-inverse)'");
            line = line.replace(/color:\s*['"]#000000['"]/g, "color: 'var(--text-inverse)'");
            
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.7\)['"]/g, "color: 'var(--text-secondary)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.6\)['"]/g, "color: 'var(--text-secondary)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.5\)['"]/g, "color: 'var(--text-muted)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.45\)['"]/g, "color: 'var(--text-muted)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.4\)['"]/g, "color: 'var(--text-muted)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.35\)['"]/g, "color: 'var(--text-muted)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.3\)['"]/g, "color: 'var(--text-muted)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.25\)['"]/g, "color: 'var(--text-disabled)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.2\)['"]/g, "color: 'var(--text-disabled)'");
            line = line.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.15\)['"]/g, "color: 'var(--text-disabled)'");
            line = line.replace(/color:\s*['"]rgba\(15,\s*23,\s*42,\s*0\.7\)['"]/g, "color: 'var(--text-secondary)'");
            line = line.replace(/color:\s*['"]rgba\(15,\s*23,\s*42,\s*0\.5\)['"]/g, "color: 'var(--text-muted)'");
            line = line.replace(/color:\s*['"]rgba\(15,\s*23,\s*42,\s*0\.4\)['"]/g, "color: 'var(--text-muted)'");
        }

        // Safe background replacements
        line = line.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.015\)['"]/g, "background: 'var(--bg-surface-hover)'");
        line = line.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.02\)['"]/g, "background: 'var(--bg-surface)'");
        line = line.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.03\)['"]/g, "background: 'var(--bg-surface)'");
        line = line.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.04\)['"]/g, "background: 'var(--bg-surface-hover)'");
        line = line.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.05\)['"]/g, "background: 'var(--bg-surface-hover)'");
        line = line.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.1\)['"]/g, "background: 'var(--bg-elevated)'");
        line = line.replace(/background:\s*['"]#121212['"]/g, "background: 'var(--bg-main)'");
        line = line.replace(/background:\s*['"]#0f172a['"]/g, "background: 'var(--bg-main)'");
        line = line.replace(/background:\s*['"]rgba\(0,\s*0,\s*0,\s*0\.6\)['"]/g, "background: 'var(--bg-card)'");
        
        // Borders
        line = line.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.03\)['"]/g, "border: '1px solid var(--border-subtle)'");
        line = line.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.04\)['"]/g, "border: '1px solid var(--border-subtle)'");
        line = line.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.05\)['"]/g, "border: '1px solid var(--border-default)'");
        line = line.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.06\)['"]/g, "border: '1px solid var(--border-default)'");
        line = line.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.08\)['"]/g, "border: '1px solid var(--border-default)'");
        line = line.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.1\)['"]/g, "border: '1px solid var(--border-default)'");
        
        // Border edges
        line = line.replace(/borderBottom:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.03\)['"]/g, "borderBottom: '1px solid var(--border-subtle)'");
        line = line.replace(/borderBottom:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.05\)['"]/g, "borderBottom: '1px solid var(--border-default)'");
        line = line.replace(/borderTop:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*0\.05\)['"]/g, "borderTop: '1px solid var(--border-default)'");

        // Common isDark ternaries remaining
        line = line.replace(/isDark \? ['"]var\(--bento-glass-hover\)['"] : ['"]rgba\(0,0,0,0\.03\)['"]/g, "'var(--bg-surface-hover)'");
        line = line.replace(/isDark \? ['"]var\(--bento-glass\)['"] : ['"]rgba\(0,0,0,0\.02\)['"]/g, "'var(--bg-surface)'");
        line = line.replace(/isDark \? ['"]var\(--bento-border\)['"] : ['"]rgba\(0,0,0,0\.04\)['"]/g, "'var(--border-default)'");

        if (line !== origLine) {
            updated = true;
        }
        codeLines[i] = line;
    }

    if (updated) {
        fs.writeFileSync(filePath, codeLines.join('\n'));
        console.log("Updated:", filePath);
    }
}

walk('/Users/admin/Documents/Nalyse/frontend/src', refactorFile);
