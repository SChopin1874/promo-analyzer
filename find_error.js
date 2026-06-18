const fs = require('fs');
const js = fs.readFileSync('C:/Users/Administrator/promo-site/promo_check.js', 'utf-8');

// Systematically find what doesn't parse
let good = "";
let bad = "";
let goodIdx = 0;

for (let i = 1; i <= 90; i++) {
    const test = js.split('\n').slice(0, i).join('\n') + '\n;void 0;';
    try {
        new Function(test);
        good = test;
        goodIdx = i;
    } catch(e) {
        bad = test;
        console.log("BREAKS at line", i);
        console.log("Error:", e.message.substring(0, 120));
        const lineContent = js.split('\n')[i-1];
        console.log("Line", i, ":", lineContent.substring(0, 200));
        break;
    }
}
