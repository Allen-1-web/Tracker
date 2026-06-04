/**
 * Production-like web server for Playwright:
 * loads e2e/.env.e2e, builds frontend with SUPABASE_* inlined, starts next on E2E port.
 */
import { spawn } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const envFile = process.env.E2E_ENV_FILE ?? path.join(root, 'e2e/.env.e2e')
dotenv.config({ path: envFile, override: true })

const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3099'
const port = new URL(baseUrl).port || '3099'

const env = {
  ...process.env,
  E2E_BASE_URL: baseUrl,
  PORT: port,
  SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.E2E_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? process.env.E2E_SUPABASE_ANON_KEY ?? '',
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME ?? '',
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? root,
      env,
      stdio: 'inherit',
      shell: true,
    })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))))
  })
}

if (process.env.E2E_SKIP_CLEAN_BUILD !== '1') {
  try {
    rmSync(path.join(root, 'frontend', '.next'), { recursive: true, force: true })
  } catch {
    // ignore
  }
}

await run('npm', ['run', 'build:frontend'])

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
const nextCmd = existsSync(nextBin) ? process.execPath : process.platform === 'win32' ? 'npx.cmd' : 'npx'
const nextArgs = existsSync(nextBin)
  ? [nextBin, 'start', '-p', port]
  : ['next', 'start', '-p', port]

const server = spawn(nextCmd, nextArgs, {
  cwd: path.join(root, 'frontend'),
  env,
  stdio: 'inherit',
  shell: !existsSync(nextBin),
})

server.on('error', (err) => {
  console.error('Failed to start Next.js:', err)
  process.exit(1)
})

server.on('exit', (code) => {
  process.exit(code ?? 0)
})

// Keep parent alive for Playwright webServer.
process.on('SIGINT', () => server.kill('SIGINT'))
process.on('SIGTERM', () => server.kill('SIGTERM'))
