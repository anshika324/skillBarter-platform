#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readPortFromEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return null;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    const portLine = lines.find((line) => line.trim().startsWith('PORT='));
    if (!portLine) return null;

    const value = portLine.split('=')[1]?.trim();
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getTargetPort() {
  const argPort = Number.parseInt(process.argv[2], 10);
  if (Number.isFinite(argPort)) return argPort;

  const envPort = Number.parseInt(process.env.PORT, 10);
  if (Number.isFinite(envPort)) return envPort;

  const filePort = readPortFromEnvFile();
  if (Number.isFinite(filePort)) return filePort;

  return 5001;
}

function listPidsOnPort(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim();

    if (!output) return [];

    return output
      .split(/\r?\n/)
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

function getProcessCommand(pid) {
  try {
    return execSync(`ps -p ${pid} -o command=`, {
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy wait for a very short period to keep script dependency-free.
  }
}

function terminatePid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return false;
  }

  const timeoutAt = Date.now() + 1200;
  while (Date.now() < timeoutAt) {
    if (!isRunning(pid)) return true;
    sleep(50);
  }

  try {
    process.kill(pid, 'SIGKILL');
    return true;
  } catch {
    return false;
  }
}

function main() {
  if (process.env.SKIP_FREE_PORT === 'true') {
    return;
  }

  if (process.platform === 'win32') {
    console.log('Port auto-clean is skipped on Windows.');
    return;
  }

  const port = getTargetPort();
  const pids = listPidsOnPort(port);

  if (pids.length === 0) {
    return;
  }

  const currentPid = process.pid;
  const parentPid = process.ppid;
  const killed = [];
  const skipped = [];

  for (const pid of pids) {
    if (pid === currentPid || pid === parentPid) continue;

    const command = getProcessCommand(pid);
    if (command && !/\b(node|nodemon)\b/i.test(command)) {
      skipped.push({ pid, command });
      continue;
    }

    if (terminatePid(pid)) {
      killed.push(pid);
    }
  }

  if (killed.length > 0) {
    console.log(`Freed port ${port} by stopping stale Node process(es): ${killed.join(', ')}`);
  }

  if (skipped.length > 0) {
    console.log(`Port ${port} is used by non-Node process(es).`);
    skipped.forEach((item) => {
      console.log(`   pid=${item.pid} command=${item.command}`);
    });
  }
}

main();
