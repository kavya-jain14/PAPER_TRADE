const fs = require('fs');
const path = require('path');

const files = [
    'frontend/src/pages/Leaderboard.jsx',
    'frontend/src/pages/History.jsx',
    'frontend/src/pages/Academy.jsx',
    'frontend/src/pages/AIPage.jsx'
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import if not present
    if (!content.includes('useMarketStatus')) {
        content = content.replace(/import \{ AppShell \} from '\.\.\/components\/AppShell';/g, "import { AppShell } from '../components/AppShell';\nimport useMarketStatus from '../hooks/useMarketStatus';");
    }

    // Replace the block
    const blockRegex = /const \[isMarketOpen, setIsMarketOpen\] = useState\(false\);\s*useEffect\(\(\) => \{\s*const checkMarketStatus = \(\) => \{[\s\S]*?\}\s*checkMarketStatus\(\);\s*const interval = setInterval\(checkMarketStatus, 60000\);\s*return \(\) => clearInterval\(interval\);\s*\}, \[\]\);/m;
    
    // In Academy, it doesn't have the clear interval sometimes, let's use a more robust regex or string replacement.
    // Actually, let's just use string replacement for the common prefix.
    const startStr = "const [isMarketOpen, setIsMarketOpen] = useState(false);";
    
    // Custom replace
    content = content.replace(blockRegex, 'const isMarketOpen = useMarketStatus();');

    // If it didn't match perfectly, let's try a broader regex for Academy
    const academyRegex = /const \[isMarketOpen, setIsMarketOpen\] = useState\(false\);\s*useEffect\(\(\) => \{\s*const checkMarketStatus = \(\) => \{[\s\S]*?setInterval\(checkMarketStatus, 60000\);\s*\}, \[\]\);/m;
    content = content.replace(academyRegex, 'const isMarketOpen = useMarketStatus();');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated hooks in ${file}`);
});
