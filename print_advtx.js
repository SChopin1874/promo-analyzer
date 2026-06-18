const fs = require('fs');
const js = fs.readFileSync('C:/Users/Administrator/promo-site/rebuilt_check.js', 'utf-8');

const advStart = js.indexOf('function advTX(');
let depth = 0, advEnd = advStart;
for (let i = advStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { advEnd = i + 1; break; } }
}

const advFunc = js.substring(advStart, advEnd);
console.log('advTX full:');
console.log(advFunc);
