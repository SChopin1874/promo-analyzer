const fs = require('fs');
const { execSync } = require('child_process');

const js = fs.readFileSync('C:/Users/Administrator/promo-site/rebuilt_check.js', 'utf-8');

// Get advTX body
const advStart = js.indexOf('function advTX(');
let depth = 0, advEnd = advStart;
for (let i = advStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { advEnd = i + 1; break; } }
}
const body = js.substring(advStart + 38, advEnd - 1); // between { and }

// Get loadAllData
const loadStart = js.indexOf('async function loadAllData');
depth = 0;
let loadEnd = loadStart;
for (let i = loadStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { loadEnd = i + 1; break; } }
}
const loadFunc = js.substring(loadStart, loadEnd);

// Everything else
const beforeAdv = js.substring(0, advStart);
const afterLoad = js.substring(loadEnd);

// Write advTX with explicit newlines every 200 chars to help parsing
let bodyWithNewlines = '';
for (let i = 0; i < body.length; i += 200) {
    bodyWithNewlines += body.substring(i, Math.min(i + 200, body.length)) + '\n';
}

const newAdvWithNl = 'function advTX(ap,curCPA,dInq,pjDaily){\n' + bodyWithNewlines + '}';
const combinedNl = beforeAdv + newAdvWithNl + loadFunc + afterLoad;
fs.writeFileSync('C:/Users/Administrator/promo-site/tmp_nl_adv.js', combinedNl);
try {
    execSync('node --check C:/Users/Administrator/promo-site/tmp_nl_adv.js', { stdio: 'pipe', timeout: 5000 });
    console.log('With newlines: OK');
} catch(e) {
    console.log('With newlines: FAIL');
    console.log(e.stderr ? e.stderr.toString().split('\n')[0] : '');
}

// Write advTX with strict function syntax (prevent ASI issues)
const newAdvBody = body
    .replace(/\r/g, '') // strip CR
    .replace(/\n/g, ' ') // replace any newlines with spaces
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/;}/g, '}'); // remove unnecessary semicolons before }

const newAdv = 'function advTX(ap,curCPA,dInq,pjDaily){' + newAdvBody + '}';
const combined = beforeAdv + newAdv + loadFunc + afterLoad;
fs.writeFileSync('C:/Users/Administrator/promo-site/tmp_clean_adv.js', combined);
try {
    execSync('node --check C:/Users/Administrator/promo-site/tmp_clean_adv.js', { stdio: 'pipe', timeout: 5000 });
    console.log('Cleaned version: OK');
} catch(e) {
    console.log('Cleaned version: FAIL');
    console.log(e.stderr ? e.stderr.toString().split('\n')[0] : '');

    // Clean ONE MORE TIME - try to detect invisible chars
    const issues = [];
    for (let i = 0; i < newAdvBody.length; i++) {
        const cc = newAdvBody.charCodeAt(i);
        if ((cc < 32 || cc === 127) && cc !== 10 && cc !== 13) {
            issues.push({pos:i, code:cc, hex:'0x'+cc.toString(16), ctx: newAdvBody.substring(Math.max(0,i-5),i+10)});
        }
    }
    if (issues.length) {
        console.log('Found', issues.length, 'control chars:');
        issues.slice(0, 5).forEach(issue => console.log('', JSON.stringify(issue)));
    }
}
