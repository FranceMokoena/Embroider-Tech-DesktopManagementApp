const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const roots = ['src', 'public', 'desktop-backend/src'];
const allowedFetchFiles = new Set([path.normalize('src/services/apiClient.js')]);

const forbiddenPatterns = [
  { label: 'forbidden endpoint', pattern: new RegExp('/api/' + 'scan', 'i') },
  { label: 'forbidden endpoint', pattern: new RegExp('/api/' + 'sessions', 'i') },
  { label: 'forbidden endpoint', pattern: new RegExp('/api/' + 'admin', 'i') },
  { label: 'legacy field access', pattern: new RegExp('scan\\.' + 'bar' + 'code', 'i') },
  { label: 'legacy session identity', pattern: new RegExp('\\b' + 'session' + 'Id\\b') },
  { label: 'legacy collection model', pattern: new RegExp('\\bTask' + 'Session\\b', 'i') },
  { label: 'legacy identity term', pattern: new RegExp('\\bbar' + 'codes?\\b', 'i') },
  { label: 'legacy route', pattern: new RegExp('scan-' + 'history', 'i') }
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'build', 'dist', '.git'].includes(entry.name)) return [];
      return walk(fullPath);
    }
    return [fullPath];
  });
}

function isTextFile(file) {
  return /\.(js|jsx|ts|tsx|css|html|json|md)$/.test(file);
}

const findings = [];

for (const root of roots) {
  const absoluteRoot = path.join(repoRoot, root);
  if (!fs.existsSync(absoluteRoot)) continue;

  for (const file of walk(absoluteRoot).filter(isTextFile)) {
    const relative = path.normalize(path.relative(repoRoot, file));
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (/\bfetch\s*\(/.test(line) && !allowedFetchFiles.has(relative)) {
        findings.push({ file: relative, line: index + 1, label: 'direct network call', text: line.trim() });
      }

      forbiddenPatterns.forEach(({ label, pattern }) => {
        if (pattern.test(line)) {
          findings.push({ file: relative, line: index + 1, label, text: line.trim() });
        }
      });
    });
  }
}

if (findings.length) {
  console.error('Legacy RFID ERP contamination detected:\n');
  findings.forEach(item => {
    console.error(`${item.file}:${item.line} [${item.label}] ${item.text}`);
  });
  console.error(`\nTotal findings: ${findings.length}`);
  process.exit(1);
}

console.log('RFID ERP enforcement passed. No legacy frontend/backend contamination found.');
