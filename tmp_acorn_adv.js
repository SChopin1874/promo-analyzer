
const acorn = require('acorn');
try {
    const code = require('fs').readFileSync('C:/Users/Administrator/promo-site/tmp_adv_rebuilt.js', 'utf-8');
    acorn.parse(code, { ecmaVersion: 2022 });
    console.log('Acorn: OK');
} catch(e) {
    console.log('Acorn: ' + e.message);
    console.log('Line: ' + e.loc.line + ' Col: ' + e.loc.column);
    const lines = code.split('\n');
    if (e.loc && e.loc.line) {
        const l = lines[e.loc.line - 1];
        console.log('Context: ' + l.substring(Math.max(0, e.loc.column - 40), Math.min(l.length, e.loc.column + 40)));
    }
}