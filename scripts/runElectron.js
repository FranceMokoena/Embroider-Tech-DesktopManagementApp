const { spawn } = require('child_process');

delete process.env.ELECTRON_RUN_AS_NODE;

const electronPath = require('electron');
const child = spawn(electronPath, ['.'], {
  env: process.env,
  stdio: 'inherit',
  windowsHide: false
});

child.on('exit', code => {
  process.exit(code || 0);
});
