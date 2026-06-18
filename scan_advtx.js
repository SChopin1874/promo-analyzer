const fs = require('fs');
const js = fs.readFileSync('C:/Users/Administrator/promo-site/rebuilt_check.js', 'utf-8');

const advStart = js.indexOf('function advTX(');
let depth = 0, advEnd = advStart;
for (let i = advStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { advEnd = i + 1; break; } }
}

const body = js.substring(advStart, advEnd);

// Scan for control characters and odd Unicode
let inStr = false;
let inComment = false;
let report = [];

for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    const code = ch.charCodeAt(0);

    // Track string state
    if (ch === '"') inStr = !inStr;

    // Check for control characters outside strings
    if (!inStr && !inComment) {
        if ((code < 32 && code !== 10 && code !== 13) || code === 127) {
            report.push({pos:i, code:code, hex:'0x'+code.toString(16), type:'control', ctx: body.substring(Math.max(0,i-5), i+5)});
        }
        if (code >= 0x2000 && code <= 0x206F) {
            report.push({pos:i, code:code, hex:'U+'+code.toString(16), type:'unicode-special', ctx: body.substring(Math.max(0,i-5), i+5)});
        }
    }
}

if (report.length === 0) {
    console.log('No hidden characters found in advTX');
} else {
    report.forEach(r => console.log(r.type + ' at ' + r.pos + ': ' + r.hex + ' context: ' + JSON.stringify(r.ctx)));
}

// Now try to find the issue by testing the function as an expression
// Perhaps the issue is a reserved word or strict mode issue
// Let's check for 'let' or 'const' that might conflict
const letMatch = body.match(/\blet\b/g);
const constMatch = body.match(/\bconst\b/g);
console.log('\nlet count:', letMatch ? letMatch.length : 0);
console.log('const count:', constMatch ? constMatch.length : 0);

// Check for 'with' or 'delete' that might be strict-mode issues
console.log('Has with:', body.includes('with'));
console.log('Has delete:', body.includes('delete'));

// Check for octal literals
const octalMatch = body.match(/0[0-7]+/g);
console.log('Octal literals:', octalMatch ? octalMatch.slice(0, 5) : 'none');
