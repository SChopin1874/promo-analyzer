const fs = require('fs');
const { execSync } = require('child_process');

// Read current HTML
const html = fs.readFileSync('index.html', 'utf-8');

// Find advTX function boundary
const advStart = html.indexOf('function advTX(');
let depth = 0, advEnd = advStart;
for (let i = advStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') { depth--; if (depth === 0) { advEnd = i + 1; break; } }
}

// Read the known-good script from our test build
const goodJs = fs.readFileSync('tmp_combined_final.js', 'utf-8');

// Extract the advTX function from the good file
const goodAdvStart = goodJs.indexOf('function advTX(');
depth = 0;
let goodAdvEnd = goodAdvStart;
for (let i = goodAdvStart; i < goodJs.length; i++) {
    if (goodJs[i] === '{') depth++;
    if (goodJs[i] === '}') { depth--; if (depth === 0) { goodAdvEnd = i + 1; break; } }
}

const goodAdv = goodJs.substring(goodAdvStart, goodAdvEnd);

// Replace in HTML - but keep the exact formatting of the original (no newlines)
// Minify the replacement
const minified = goodAdv.replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ');

// Replace in HTML
const oldAdv = html.substring(advStart, advEnd);
const newHtml = html.replace(oldAdv, minified);

fs.writeFileSync('index.html', newHtml, 'utf-8');
console.log('index.html updated');

// Verify: extract JS and check
const newCheckStart = newHtml.indexOf('>', newHtml.indexOf('<script', 10000)) + 1;
const newCheckEnd = newHtml.indexOf('</script>', newCheckStart);
const newJs = newHtml.substring(newCheckStart, newCheckEnd);
fs.writeFileSync('final_check.js', newJs);

try {
    execSync('node --check final_check.js', { stdio: 'pipe', timeout: 5000 });
    console.log('FINAL file: OK!');
} catch(e) {
    console.log('FINAL file: FAIL');
    console.log(e.stderr ? e.stderr.toString().split('\n')[0] : '');
}
