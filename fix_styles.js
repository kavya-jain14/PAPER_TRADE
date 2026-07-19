const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Radius
    content = content.replace(/rounded-xl/g, 'rounded-lg');
    content = content.replace(/rounded-2xl/g, 'rounded-lg');
    content = content.replace(/rounded-\[8px\]/g, 'rounded-md');

    // Shadows
    content = content.replace(/shadow-sm/g, 'shadow-1');
    content = content.replace(/shadow-md/g, 'shadow-1');
    content = content.replace(/shadow-lg/g, 'shadow-2');
    content = content.replace(/shadow-2xl/g, 'shadow-3');

    // Hardcoded Colors
    // Note: this is a regex sweep. We only care about specific problematic strings found in Academy/Legal/Login
    content = content.replace(/bg-\[\#16181D\]/g, 'bg-surface-raised');
    content = content.replace(/bg-\[\#0B0D10\]/g, 'bg-bg');
    content = content.replace(/bg-\[\#0A0A0A\](\/[0-9]+)?/g, 'bg-bg');
    content = content.replace(/border-\[\#222222\]/g, 'border-border');
    
    // Gold replacements
    content = content.replace(/bg-\[\#D4A574\]\/10/g, 'bg-accent-gold-muted');
    content = content.replace(/bg-\[\#D4A574\]\/15/g, 'bg-accent-gold-muted');
    content = content.replace(/bg-\[\#D4A574\]/g, 'bg-accent-gold');
    content = content.replace(/text-\[\#D4A574\]/g, 'text-accent-gold');
    content = content.replace(/border-\[\#D4A574\]\/20/g, 'border-accent-gold/20');
    content = content.replace(/shadow-\[\#D4A574\]\/10/g, 'shadow-accent-gold/10');

    // White replacements
    content = content.replace(/text-\[\#E5E5E5\]\/40/g, 'text-text-secondary');
    content = content.replace(/text-\[\#E5E5E5\]\/50/g, 'text-text-secondary');
    content = content.replace(/text-\[\#E5E5E5\]/g, 'text-text-primary');
    content = content.replace(/bg-\[\#E5E5E5\]\/5/g, 'bg-surface-raised');
    content = content.replace(/bg-\[\#E5E5E5\]\/10/g, 'bg-surface-raised');
    content = content.replace(/bg-\[\#E5E5E5\]\/20/g, 'bg-border');
    content = content.replace(/border-\[\#E5E5E5\]\/5/g, 'border-border');
    content = content.replace(/border-\[\#E5E5E5\]\/10/g, 'border-border');
    content = content.replace(/border-\[\#E5E5E5\]\/20/g, 'border-border-strong');

    // Focus States
    content = content.replace(/focus:border-border-strong/g, 'focus:ring-1 focus:ring-accent focus:border-accent');
    content = content.replace(/outline-none/g, 'outline-none'); // Just ensuring we have it
    
    // Typography 
    content = content.replace(/text-xs uppercase tracking-widest/g, 'type-label');
    content = content.replace(/text-\[10px\] uppercase tracking-widest/g, 'type-label');
    content = content.replace(/text-\[11px\] font-bold uppercase tracking-wider/g, 'type-label');
    content = content.replace(/text-sm text-text-primary/g, 'type-body text-text-primary');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated styles in: ${path.basename(file)}`);
    }
});

console.log(`Successfully updated ${changedFiles} files for Token Consistency.`);
