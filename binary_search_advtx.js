const fs = require('fs');
const { execSync } = require('child_process');

const js = fs.readFileSync('C:/Users/Administrator/promo-site/rebuilt_check.js', 'utf-8');

const advStart = js.indexOf('function advTX(');
let depth = 0, advEnd = advStart;
for (let i = advStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { advEnd = i + 1; break; } }
}

const advFunc = js.substring(advStart, advEnd);
const body = advFunc; // full function including signature

// Binary search for error location
let lo = 0;
let hi = body.length;
let lastOk = 0;

while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const chunk = body.substring(0, mid);
    // Make sure we don't break in the middle of a string
    const testCode = chunk + '\n;void 0;\n// terminate';
    const tmpFile = 'C:/Users/Administrator/promo-site/tmp_bs_adv.js';
    fs.writeFileSync(tmpFile, testCode);

    try {
        execSync('node --check "' + tmpFile + '"', { stdio: 'pipe', timeout: 3000 });
        lastOk = mid;
        lo = mid + 1;
        if (mid % 500 === 0) console.log('OK at', mid);
    } catch(e) {
        hi = mid;
        if (mid % 500 === 0) console.log('FAIL at', mid);
    }
}

console.log('\nLast OK:', lastOk);
console.log('First failure at:', lastOk + 1);
const errStart = Math.max(0, lastOk - 50);
const errEnd = Math.min(body.length, lastOk + 100);
console.log('Context around error:');
console.log(body.substring(errStart, errEnd));

// Show character codes
console.log('\nCharacter analysis:');
for (let i = lastOk - 5; i <= lastOk + 5; i++) {
    if (i >= 0 && i < body.length) {
        console.log('  [' + i + '] code=' + body.charCodeAt(i) + ' char=' + JSON.stringify(body[i]));
    }
}
