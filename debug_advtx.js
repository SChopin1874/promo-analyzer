const fs = require('fs');
const js = fs.readFileSync('C:/Users/Administrator/promo-site/promo_check.js', 'utf-8');

// Get advTX function
const advStart = js.indexOf('function advTX(');
let depth = 0, advEnd = advStart;
for (let i = advStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { advEnd = i + 1; break; } }
}
const advTX = js.substring(advStart, advEnd);
console.log('advTX length:', advTX.length);
console.log('Starts with:', advTX.substring(0, 50));
console.log('Ends with:', advTX.substring(advTX.length-50));

// Check all brace/paren/bracket balance within advTX
let braceDepth = 0;
let parenDepth = 0;
let bracketDepth = 0;
let minParen = 0, minParenPos = 0;
let inS = false, inD = false, inBt = false, esc = false;

for (let i = 0; i < advTX.length; i++) {
    const ch = advTX[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\" && (inS || inD || inBt)) { esc = true; continue; }
    if (ch === "'" && !inD && !inBt) { inS = !inS; continue; }
    if (ch === '"' && !inS && !inBt) { inD = !inD; continue; }
    if (ch === '`' && !inS && !inD) { inBt = !inBt; continue; }
    if (inS || inD || inBt) continue;

    if (ch === '(') { parenDepth++; }
    if (ch === ')') { parenDepth--; if (parenDepth < minParen) { minParen = parenDepth; minParenPos = i; } }
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
    if (ch === '[') bracketDepth++;
    if (ch === ']') bracketDepth--;
}

console.log('Brace depth:', braceDepth, '(should be 0)');
console.log('Paren depth:', parenDepth, '(should be 0)');
console.log('Bracket depth:', bracketDepth, '(should be 0)');
console.log('String state: single=' + inS + ' double=' + inD + ' backtick=' + inBt);

if (minParenPos > 0) {
    console.log('Min paren at pos', minParenPos, 'depth', minParen);
    console.log('Context:', JSON.stringify(advTX.substring(Math.max(0,minParenPos-30), minParenPos+30)));
}

// Check the content around any problem areas
// Look for unusual patterns like // in strings, regex patterns, etc.
