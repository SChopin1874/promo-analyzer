const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

// Extract the inline script
const start = html.indexOf('>', html.indexOf('<script', 10000)) + 1;
const end = html.indexOf('</script>', start);
const js = html.substring(start, end);

console.log('JS length:', js.length);

// Check for non-printable characters outside strings
let inSingle = false, inDouble = false, inBacktick = false, escape = false;
let foundIssue = false;

for (let i = 0; i < js.length; i++) {
    const ch = js[i];
    const code = ch.charCodeAt(0);

    if (escape) { escape = false; continue; }
    if (ch === "\\" && (inSingle || inDouble || inBacktick)) { escape = true; continue; }
    if (ch === "'" && !inDouble && !inBacktick) { inSingle = !inSingle; continue; }
    if (ch === '"' && !inSingle && !inBacktick) { inDouble = !inDouble; continue; }
    if (ch === "`" && !inSingle && !inDouble) { inBacktick = !inBacktick; continue; }

    if (!inSingle && !inDouble && !inBacktick) {
        if (code === 0 || (code < 32 && code !== 10 && code !== 13)) {
            console.log("Non-printable char at " + i + ": code=" + code + " hex=0x" + code.toString(16));
            console.log("Context: " + JSON.stringify(js.substring(Math.max(0,i-20), i+20)));
            foundIssue = true;
        }
    }
}

console.log("String state at end: inSingle=" + inSingle + " inDouble=" + inDouble + " inBacktick=" + inBacktick);
if (!foundIssue) console.log("No non-printable issues found");

// Also check the exact last 50 chars
console.log("\nLast 100 chars:");
console.log(JSON.stringify(js.substring(js.length-100)));

// Check end of file
const lines = js.split("\n");
console.log("\nLine count:", lines.length);
console.log("Last line length:", lines[lines.length-1].length);
console.log("Last line:", JSON.stringify(lines[lines.length-1].substring(0, 200)));

// Check for trailing spaces or odd characters at line ends
for (let i = 0; i < lines.length; i++) {
    const lastChar = lines[i].charCodeAt(lines[i].length - 1);
    if (lastChar === 13) {
        // CR at line end is OK (Windows line endings)
    } else if (lastChar < 32 && lastChar !== 10 && lastChar !== 0) {
        console.log("Line " + (i+1) + " ends with odd char: code=" + lastChar);
    }
}
