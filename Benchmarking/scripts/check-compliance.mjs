#!/usr/bin/env node
/**
 * Local mirror of .github/workflows/compliance.yml.
 *
 * Runs the same checks CI runs, so the feedback loop does not require a push.
 * Every check here exists because something was found missing in the licence
 * review; the point is that it cannot regress quietly.
 *
 * Usage:  pnpm compliance
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = resolve(APP, '..')

let failed = false

function section(title) {
  console.log(`── ${title} ${'─'.repeat(Math.max(0, 62 - title.length))}`)
}
function ok(message) {
  console.log(`  ok — ${message}`)
}
function fail(message) {
  console.log(`  FAIL — ${message}`)
  failed = true
}

// ── LICENSE ──────────────────────────────────────────────────────────────────
section('LICENSE')
{
  const path = join(REPO, 'LICENSE')
  if (!existsSync(path)) {
    fail('LICENSE is missing')
  } else {
    const text = readFileSync(path, 'utf8')
    const size = Buffer.byteLength(text)

    // The 17-line notice meant for source-file headers is ~740 bytes and gets
    // classified NOASSERTION by every scanner. Enterprise licence tooling
    // treats that as unknown-licence and blocks ingestion.
    if (size < 10000) {
      fail(`LICENSE is ${size} bytes — too short to be the full Apache-2.0 text (~11 KB)`)
    } else {
      const required = [
        '2. Grant of Copyright License',
        '3. Grant of Patent License',
        '5. Submission of Contributions',
        '6. Trademarks',
        'END OF TERMS AND CONDITIONS',
      ]
      const missing = required.filter((s) => !text.includes(s))
      if (missing.length) fail(`LICENSE missing section(s): ${missing.join(', ')}`)
      else if (text.includes('[name of copyright owner]'))
        fail('LICENSE still has the placeholder copyright line in the appendix')
      else ok(`${size} bytes, all sections present, copyright filled in`)
    }
  }
}

// ── Required files ───────────────────────────────────────────────────────────
section('Required files')
for (const [label, path] of [
  ['NOTICE', join(REPO, 'NOTICE')],
  ['THIRD-PARTY-NOTICES.md', join(APP, 'THIRD-PARTY-NOTICES.md')],
  ['public/third-party-licences.txt', join(APP, 'public', 'third-party-licences.txt')],
]) {
  existsSync(path) ? ok(label) : fail(`missing ${label}`)
}

// ── package.json metadata ────────────────────────────────────────────────────
section('Package metadata')
{
  const pkg = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8'))
  // Without a license field, npm and every SBOM tool report UNLICENSED —
  // which reads as "all rights reserved", the opposite of what we intend.
  if (pkg.license !== 'Apache-2.0') fail(`package.json license is "${pkg.license}", expected Apache-2.0`)
  else ok('license: Apache-2.0')
}

// ── No third-party origins in the app ────────────────────────────────────────
section('No third-party asset origins')
{
  // CDN and Google Fonts references leak visitor IPs to a third party
  // (LG Muenchen I, 3 O 17493/20) and break in isolated networks. Assets are
  // bundled by Vite instead.
  //
  // Written as an allowlist rather than a blocklist of known CDN hostnames. A
  // blocklist has to enumerate jsdelivr, unpkg, esm.sh, skypack, typekit,
  // ajax.googleapis.com and whatever launches next month; the first one nobody
  // thought of passes silently. Any absolute URL that is *loaded* is suspect
  // unless it is on this list.
  const ALLOWED_ORIGINS = [
    'corespan.ai', // our own site
    'github.com', // the "star us" link
    'localhost',
    'example.invalid',
    'www.w3.org', // SVG/XML namespace declarations, never fetched
    'schema.org',
  ]

  // Any absolute URL that survives comment-stripping is treated as live: it is
  // in the source, in a string, and could be fetched.
  //
  // An earlier version tried to match only "loading positions" (src=, href=,
  // @import, url()). That missed `{ src: 'https://esm.sh/react' }` — an object
  // property, not a JSX attribute — which is exactly the shape config-driven
  // URLs take. Enumerating syntactic positions has the same weakness as
  // enumerating CDN hostnames: the case nobody pictured passes silently.
  // Strip comments, then flag every URL that is not allowlisted.
  const URL_RE = /https?:\/\/[^\s'"`)<>]+/g

  const stripComments = (text) =>
    text
      .replace(/\/\*[\s\S]*?\*\//g, '') // /* block */ and /** jsdoc */
      .replace(/^\s*\/\/.*$/gm, '') // whole-line //
      .replace(/([^:])\/\/[^\n'"`]*$/gm, '$1') // trailing // , sparing http://
      .replace(/<!--[\s\S]*?-->/g, '') // html comments

  const offenders = []

  const scan = (raw, label) => {
    // Strip line-by-line so reported line numbers still match the real file.
    stripComments(raw)
      .split('\n')
      .forEach((line, i) => {
        for (const match of line.matchAll(URL_RE)) {
          let host
          try {
            host = new URL(match[0]).hostname
          } catch {
            continue
          }
          const allowed = ALLOWED_ORIGINS.some((o) => host === o || host.endsWith(`.${o}`))
          if (!allowed) offenders.push(`${label}:${i + 1} → ${host}`)
        }
      })
  }

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) {
        walk(path)
      } else if (/\.(tsx?|jsx?|css|html)$/.test(entry)) {
        scan(readFileSync(path, 'utf8'), path.replace(`${APP}/`, ''))
      }
    }
  }
  walk(join(APP, 'src'))
  if (existsSync(join(APP, 'index.html'))) {
    scan(readFileSync(join(APP, 'index.html'), 'utf8'), 'index.html')
  }

  if (offenders.length) {
    fail(`asset loaded from a non-allowlisted origin:\n         ${offenders.join('\n         ')}`)
    console.log('         Bundle it via Vite, or add the origin to ALLOWED_ORIGINS with a reason.')
  } else {
    ok('no assets loaded from third-party origins')
  }
}

// ── Attribution is reachable from the UI ─────────────────────────────────────
section('In-app attribution')
{
  // The licence file existing in the repo is not the same as it reaching the
  // person who receives the bundle. The footer link is the delivery mechanism;
  // if someone removes it, the notices stop accompanying the distribution.
  const footer = join(APP, 'src', 'app', 'layout', 'AppFooter.tsx')
  if (!existsSync(footer)) {
    fail('AppFooter.tsx not found — cannot verify the attribution link')
  } else {
    const text = readFileSync(footer, 'utf8')

    // Checking for the bare identifier is not enough: deleting the <Anchor>
    // while leaving the import behind passes a substring test, and eslint only
    // warns on the unused import. Require it in an href position.
    if (!/href=\{\s*LICENCES_URL\s*\}/.test(text)) {
      fail(
        'AppFooter has no `href={LICENCES_URL}` — the attribution link is the only\n' +
          '         route by which the notices reach a visitor. Restore it.',
      )
    } else if (/visibleFrom=/.test(text.slice(text.indexOf('href={LICENCES_URL}') - 400, text.indexOf('href={LICENCES_URL}') + 200))) {
      // A mobile visitor receives the same bundle as a desktop one, so the
      // notices have to be reachable at every breakpoint. Hiding the link
      // would leave every other check in this file passing.
      fail('the licences link appears to be breakpoint-hidden — it must be visible on mobile too')
    } else {
      ok('footer links the third-party licences, at all breakpoints')
    }
  }
}

// ── Lockfile ─────────────────────────────────────────────────────────────────
section('Lockfile')
{
  if (!existsSync(join(APP, 'pnpm-lock.yaml'))) {
    fail('pnpm-lock.yaml is missing — transitive versions would float')
  } else {
    // package.json uses ^ ranges, which is fine *because* the lockfile pins the
    // resolved tree. That only holds if installs are frozen; an unfrozen
    // install silently resolves something else and the inventory stops
    // describing what ships.
    ok('pnpm-lock.yaml present (CI installs with --frozen-lockfile)')
  }
}

// ── Inventory freshness ──────────────────────────────────────────────────────
section('Third-party inventory')
try {
  execFileSync('node', [join(APP, 'scripts', 'generate-third-party-notices.mjs'), '--check'], {
    cwd: APP,
    stdio: 'inherit',
  })
  ok('inventory matches the installed production tree')
} catch {
  fail('inventory is stale — run `pnpm licences` and commit')
}

// ── Build output ─────────────────────────────────────────────────────────────
section('Build output')
{
  // The checks above all verify that files exist in the repository. Only this
  // one verifies the notices reach the person receiving the software, which is
  // what the obligation actually is.
  //
  // Building takes ~20s, so it is opt-in locally and always-on in CI. Without
  // it `pnpm compliance` can report green while the bundle ships no
  // attribution at all — the exact failure this whole change exists to fix.
  const dist = join(APP, 'dist', 'third-party-licences.txt')

  if (!process.argv.includes('--build')) {
    console.log('  skipped — run `pnpm compliance:full` to build and check the output')
    if (existsSync(dist)) {
      const notices = (readFileSync(dist, 'utf8').match(/Copyright/g) || []).length
      console.log(`  (stale dist/ from an earlier build has ${notices} notices)`)
    }
  } else {
    try {
      execFileSync('pnpm', ['build'], {
        cwd: APP,
        stdio: 'inherit',
        env: { ...process.env, VITE_API_URL: process.env.VITE_API_URL || 'https://example.invalid' },
      })
    } catch {
      fail('build failed')
    }

    if (!existsSync(dist)) {
      fail('dist/third-party-licences.txt was not emitted — Vite copies public/ into dist/')
    } else {
      const text = readFileSync(dist, 'utf8')
      const notices = (text.match(/Copyright/g) || []).length
      if (notices < 40) fail(`only ${notices} copyright notices in the built output, expected 40+`)
      else ok(`${notices} copyright notices in the built output`)

      // Apache-2.0 s4(d) — echarts ships a NOTICE that must be reproduced.
      if (text.includes('The Apache Software Foundation')) ok('Apache NOTICE attribution present')
      else fail('the Apache ECharts NOTICE attribution is missing (Apache-2.0 s4(d))')

      // OFL-1.1 s2 — Inter is bundled, so its licence must accompany it.
      if (/SIL OPEN FONT LICENSE/i.test(text)) ok('OFL-1.1 text present')
      else fail('the OFL-1.1 text is missing, but Inter is bundled (OFL s2)')
    }

    const bundles = join(APP, 'dist', 'assets')
    const linked =
      existsSync(bundles) &&
      readdirSync(bundles)
        .filter((f) => f.endsWith('.js'))
        .some((f) => readFileSync(join(bundles, f), 'utf8').includes('third-party-licences.txt'))
    if (linked) ok('the bundle references the licence file')
    else fail('no bundle references third-party-licences.txt — the link is unreachable')
  }
}

console.log('')
if (failed) {
  console.log('Compliance checks FAILED.')
  process.exit(1)
}
console.log('Compliance checks passed.')
