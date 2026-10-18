const { spawnSync } = require('node:child_process');
const path = require('node:path');

const expo = path.join(__dirname, '..', 'node_modules', '.bin', 'expo');

function ensureExpoLogin(run = spawnSync) {
  const currentAccount = run(expo, ['whoami'], { stdio: 'ignore' });
  if (currentAccount.status === 0) return 0;

  const login = run(expo, ['login'], { stdio: 'inherit' });
  return login.status ?? 1;
}

if (require.main === module) process.exitCode = ensureExpoLogin();

module.exports = ensureExpoLogin;
