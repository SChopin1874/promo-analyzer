const fs = require('fs');
const { execSync } = require('child_process');
const js = fs.readFileSync('C:/Users/Administrator/promo-site/rebuilt_check.js', 'utf-8');

// Get advTX function
const advStart = js.indexOf('function advTX(');
let depth = 0, advEnd = advStart;
for (let i = advStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { advEnd = i + 1; break; } }
}

// Write JUST the function signature + empty body
const sig = js.substring(advStart, advStart + 38); // "function advTX(ap,curCPA,dInq,pjDaily)"

// Test with empty body
const emptyFunc = sig + "{}";
fs.writeFileSync('C:/Users/Administrator/promo-site/tmp_adv_empty.js', emptyFunc);
try {
    execSync('node --check C:/Users/Administrator/promo-site/tmp_adv_empty.js', { stdio: 'pipe', timeout: 3000 });
    console.log('Empty advTX: OK');
} catch(e) {
    console.log('Empty advTX: FAIL');
}

// Now get the body content between outer {} and try with it
const body = js.substring(advStart + 38, advEnd - 1);
console.log('Body length:', body.length);

// Write the function with body rebuilt
const rebuiltFunc = sig + '{' + body + '}';
fs.writeFileSync('C:/Users/Administrator/promo-site/tmp_adv_rebuilt.js', rebuiltFunc);
try {
    execSync('node --check C:/Users/Administrator/promo-site/tmp_adv_rebuilt.js', { stdio: 'pipe', timeout: 3000 });
    console.log('Rebuilt advTX: OK');
} catch(e) {
    console.log('Rebuilt advTX: FAIL');
    // Try to find the exact issue
    // Write as acorn test
    const acornTest = `
const acorn = require('acorn');
try {
    const code = require('fs').readFileSync('C:/Users/Administrator/promo-site/tmp_adv_rebuilt.js', 'utf-8');
    acorn.parse(code, { ecmaVersion: 2022 });
    console.log('Acorn: OK');
} catch(e) {
    console.log('Acorn: ' + e.message);
    console.log('Line: ' + e.loc.line + ' Col: ' + e.loc.column);
    const lines = code.split('\\n');
    if (e.loc && e.loc.line) {
        const l = lines[e.loc.line - 1];
        console.log('Context: ' + l.substring(Math.max(0, e.loc.column - 40), Math.min(l.length, e.loc.column + 40)));
    }
}`;
    fs.writeFileSync('C:/Users/Administrator/promo-site/tmp_acorn_adv.js', acornTest);
    const result = execSync('node C:/Users/Administrator/promo-site/tmp_acorn_adv.js', { stdio: 'pipe', timeout: 5000 });
    console.log(result.toString());
}

// Compare: is the original different from rebuilt?
console.log('\nOriginal vs rebuilt same?', advFunc === rebuiltFunc);
if (advFunc !== rebuiltFunc) {
    // Find where they differ
    for (let i = 0; i < Math.min(advFunc.length, rebuiltFunc.length); i++) {
        if (advFunc[i] !== rebuiltFunc[i]) {
            console.log('First diff at', i);
            console.log('Original:', advFunc.charCodeAt(i), JSON.stringify(advFunc[i]));
            console.log('Rebuilt:', rebuiltFunc.charCodeAt(i), JSON.stringify(rebuiltFunc[i]));
            break;
        }
    }
}
