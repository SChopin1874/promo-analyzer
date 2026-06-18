const fs = require('fs');
const { execSync } = require('child_process');

const js = fs.readFileSync('C:/Users/Administrator/promo-site/rebuilt_check.js', 'utf-8');

// Binary search for the error location
let lo = 0;
let hi = js.length;

while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const chunk = js.substring(0, mid) + '\n;void 0;\n//rest';
    const tmpFile = 'C:/Users/Administrator/promo-site/tmp_test.js';
    fs.writeFileSync(tmpFile, chunk);

    try {
        execSync('node --check "' + tmpFile + '"', { stdio: 'pipe', timeout: 5000 });
        // It parses OK -> error is later
        lo = mid + 1;
        console.log('OK up to', mid, '(' + Math.round(mid/js.length*100) + '%)');
    } catch (e) {
        // It fails -> error is before mid
        hi = mid;
        console.log('FAIL at', mid, '(' + Math.round(mid/js.length*100) + '%)');
    }
}

console.log('\nError found near position:', lo);
const start = Math.max(0, lo - 200);
const end = Math.min(js.length, lo + 200);
console.log('Context:');
console.log(js.substring(start, end));
