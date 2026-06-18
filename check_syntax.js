const fs = require('fs');
const js = fs.readFileSync('C:/Users/Administrator/promo-site/promo_check.js', 'utf-8');

// Properly count unescaped single quotes
let unescapedSQ = 0;
let inSingle = false;
let inDouble = false;
let lastBackslash = false;

for (let i = 0; i < js.length; i++) {
    const ch = js[i];
    const isEscaped = lastBackslash;

    if (ch === '\\' && !lastBackslash) {
        lastBackslash = true;
        continue;
    }

    if (ch === "'" && !inDouble && !isEscaped) {
        inSingle = !inSingle;
        unescapedSQ++;
    }
    if (ch === '"' && !inSingle && !isEscaped) {
        inDouble = !inDouble;
    }

    lastBackslash = false;
}

console.log("Unescaped single quotes:", unescapedSQ, unescapedSQ % 2 === 0 ? "OK" : "UNCLOSED!");
console.log("In single string at end:", inSingle);
console.log("In double string at end:", inDouble);

// Check for unclosed multi-line comments
let inComment = false;
let commentStart = 0;
for (let i = 0; i < js.length - 1; i++) {
    if (!inComment && js[i] === '/' && js[i+1] === '*') {
        inComment = true;
        commentStart = i;
        i++;
        continue;
    }
    if (inComment && js[i] === '*' && js[i+1] === '/') {
        inComment = false;
        i++;
        continue;
    }
}
if (inComment) {
    console.log("UNCLOSED MULTI-LINE COMMENT starting at", commentStart);
    console.log("Context:", js.substring(commentStart, commentStart + 100));
} else {
    console.log("No unclosed comments");
}

// Find the exact line with the error by splitting and testing
// Focus on the advTX function we edited recently
const advIdx = js.indexOf('function advTX(');
if (advIdx >= 0) {
    // Find the closing brace
    let depth = 0;
    let funcEnd = advIdx;
    for (let i = advIdx; i < js.length; i++) {
        if (js[i] === '{') depth++;
        if (js[i] === '}') { depth--; if (depth === 0) { funcEnd = i+1; break; } }
    }
    const advFunc = js.substring(advIdx, funcEnd);
    console.log("\nadvTX function length:", advFunc.length);

    // Check for unclosed single quotes within
    let sq = 0, inS = false, inD = false, lb = false;
    for (let i = 0; i < advFunc.length; i++) {
        const ch = advFunc[i];
        if (ch === '\\' && !lb) { lb = true; continue; }
        if (ch === "'" && !inD && !lb) { inS = !inS; sq++; }
        if (ch === '"' && !inS && !lb) { inD = !inD; }
        lb = false;
    }
    console.log("advTX single quotes:", sq, sq % 2 === 0 ? "OK" : "UNCLOSED!");
    console.log("advTX in string at end:", inS, inD);
}
