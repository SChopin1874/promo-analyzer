const fs = require('fs');
const vm = require('vm');

const js = fs.readFileSync('C:/Users/Administrator/promo-site/promo_check.js', 'utf-8');

// Minimal browser mocks
const mockContext = {
  console: { log: () => {}, error: () => {}, warn: () => {} },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  fetch: async () => { throw new Error('fetch not available'); },
  AbortController: AbortController,
  AbortSignal: { timeout: (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; } },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  alert: () => {},
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    createElement: () => ({}),
    addEventListener: () => {},
  },
  FileReader: function() { this.onload = null; this.readAsText = () => {}; this.readAsArrayBuffer = () => {}; },
  Blob: function() {},
  URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
  XMLHttpRequest: function() {},
  XLSX: { read: () => ({ Sheets: {}, SheetNames: [] }), utils: { sheet_to_json: () => [] } },
  Chart: function() { this.destroy = () => {}; },
  Image: function() {},
  requestAnimationFrame: () => {},
};

// Add missing constructors
mockContext.window = mockContext;
mockContext.self = mockContext;
mockContext.globalThis = mockContext;

try {
  const result = vm.runInNewContext(js, mockContext, { timeout: 10000 });
  console.log('SUCCESS: Script executed without errors');
} catch (e) {
  console.log('ERROR:', e.constructor.name);
  console.log('Message:', e.message.substring(0, 200));
  if (e.stack) {
    const stackLines = e.stack.split('\n');
    for (let i = 0; i < Math.min(6, stackLines.length); i++) {
      console.log(stackLines[i]);
    }
  }
}
