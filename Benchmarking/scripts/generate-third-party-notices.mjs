#!/usr/bin/env node
/**
 * Generate the third-party licence artifacts for aistudio-app.
 *
 * WHY THIS EXISTS
 *
 * This app is deployed publicly. Every visitor's browser receives a minified
 * bundle containing ~54 third-party packages. Serving that bundle is
 * distribution, and essentially every permissive licence conditions
 * distribution on carrying the copyright notice:
 *
 *   MIT           "The above copyright notice and this permission notice shall
 *                  be included in all copies or substantial portions."
 *   BSD-2/3       "Redistributions in binary form must reproduce the above
 *                  copyright notice ... in the documentation and/or other
 *                  materials provided with the distribution."
 *   ISC           Equivalent notice-retention wording.
 *   Apache-2.0    Section 4(d) — if the work ships a NOTICE file, derivative
 *                  distributions must include a readable copy of its
 *                  attributions. echarts ships one.
 *   OFL-1.1       Section 2 — the copyright and licence must accompany the
 *                  fonts. @fontsource/inter bundles Inter into the build.
 *
 * 0BSD is the exception and is deliberately not in that list: it is the
 * public-domain-equivalent BSD variant with the retention clause removed, so
 * tslib imposes no condition on us. It is still reproduced below, because
 * over-attributing costs nothing and an inventory with holes invites the
 * question of what else was left out.
 *
 * Vite minifies with esbuild, which strips comments — so before this script
 * existed the production bundle contained zero attribution. Verified: grep for
 * "Copyright" across dist/assets/*.js returned 0 matches.
 *
 * TWO OUTPUTS, DELIBERATELY
 *
 *   THIRD-PARTY-NOTICES.md          Committed summary. For humans reading the
 *                                   repo and for licence scanners.
 *   public/third-party-licences.txt Full verbatim licence texts. Copied into
 *                                   dist/ by Vite and served alongside the app,
 *                                   so the notices actually accompany the
 *                                   distributed bundle rather than merely
 *                                   existing in a repo the visitor never sees.
 *
 * Only PRODUCTION dependencies are included. devDependencies (eslint, vitest,
 * typescript) are build tooling and are never conveyed to anyone, so no notice
 * obligation attaches to them.
 *
 * Usage:
 *   node scripts/generate-third-party-notices.mjs
 *   node scripts/generate-third-party-notices.mjs --check   # CI: fail if stale
 */

import { execFileSync, execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MARKDOWN_OUT = join(ROOT, 'THIRD-PARTY-NOTICES.md')
const TEXT_OUT = join(ROOT, 'public', 'third-party-licences.txt')

const CHECK = process.argv.includes('--check')

/**
 * Distinct exit codes, because "the inventory drifted" and "there is no
 * dependency tree to compare against" need opposite instructions — `pnpm
 * licences` versus `pnpm install` — and a caller that sees only non-zero has to
 * guess which. check-compliance.mjs reported every failure here as stale,
 * printing "run `pnpm licences` and commit" at somebody who had not installed
 * yet. Anything reading these codes still treats both as failure, so CI is
 * unaffected; only the advice changes.
 */
const EXIT_STALE = 1
const EXIT_NOT_INSTALLED = 2

/**
 * Normalise line endings and trailing whitespace.
 *
 * Some upstream packages ship licence files with CRLF — nine of the 54 here do.
 * Copying those bytes through verbatim breaks the freshness check in a way that
 * is genuinely baffling to debug: git's `text=auto eol=lf` normalises them on
 * commit, so the committed blob has LF, the checked-out file has LF, and the
 * generator keeps producing CR. `--check` then reports the file stale on a
 * clean checkout with a diff that looks empty.
 *
 * Normalising here rather than reaching for `-text` in .gitattributes keeps the
 * artifacts diffable and reviewable, which for a compliance document matters
 * more than byte-preserving somebody's line endings.
 */
const normalise = (text) => text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '')

/**
 * Run pnpm and capture its output, on Windows as well as POSIX.
 *
 * `pnpm` on PATH is a shim: an extensionless script on POSIX, `pnpm.cmd` on
 * Windows. Since Node 20.12 (the CVE-2024-27980 fix) spawning a `.cmd` without
 * a shell is refused, so `execFileSync('pnpm', ...)` failed here with ENOENT —
 * which the catch below reported as "run `pnpm install` first", sending anyone
 * who hit it after an install that had worked fine.
 *
 * Windows therefore needs a shell. Passing an args array *and* `shell: true`
 * concatenates them unescaped and warns (DEP0190), so the command is built as
 * one string instead. Every argument here is a literal — nothing is
 * interpolated from the environment or the lockfile — so there is nothing for
 * cmd.exe to misparse. POSIX keeps the no-shell path, which is what CI runs.
 */
function runPnpm(args, options) {
  return process.platform === 'win32'
    ? execSync(`pnpm ${args.join(' ')}`, options)
    : execFileSync('pnpm', args, options)
}

/** Filenames that hold a licence text, in order of preference. */
const LICENCE_FILENAMES = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'LICENCE',
  'LICENCE.md',
  'LICENCE.txt',
  'LICENSE-MIT',
  'LICENSE-MIT.txt',
  'LICENSE-BSD',
  'license',
  'license.md',
  'license.txt',
]

/**
 * Licences whose presence would be a genuine decision rather than routine
 * attribution. None are expected in a browser bundle; if one appears, it needs
 * a human, because shipping copyleft to every visitor is a different question
 * from shipping MIT.
 */
const NEEDS_REVIEW = /GPL|AGPL|LGPL|MPL|SSPL|BUSL|CC-BY-NC|Commons-Clause|UNLICENSED|UNKNOWN/i

function readProductionPackages() {
  // `pnpm licenses list` resolves the real production tree, including
  // transitive deps, and gives us the on-disk path for each one so the actual
  // licence text can be read rather than guessed from an SPDX string.
  let raw
  try {
    raw = runPnpm(['licenses', 'list', '--prod', '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (error) {
    console.error('ERROR: `pnpm licenses list --prod --json` failed.')
    console.error('Run `pnpm install` first.')
    console.error(String(error.stderr || error.message).trim())
    process.exit(EXIT_NOT_INSTALLED)
  }

  const byLicence = JSON.parse(raw)
  const packages = []

  for (const [licence, entries] of Object.entries(byLicence)) {
    for (const entry of entries) {
      const path = entry.paths?.[0]
      packages.push({
        name: entry.name,
        version: (entry.versions || []).join(', '),
        licence,
        author: typeof entry.author === 'string' ? entry.author : '',
        homepage: entry.homepage || `https://www.npmjs.com/package/${entry.name}`,
        text: path ? readLicenceText(path) : null,
        notice: path ? readNotice(path) : null,
      })
    }
  }

  packages.sort((a, b) => a.name.localeCompare(b.name))
  return packages
}

/**
 * Read the licence text a package ships on disk.
 *
 * Every filename decision below goes through one `readdirSync` listing rather
 * than `existsSync` probes. That is deliberate, and it is the fix for a bug
 * that only appeared once this script was first run on Windows:
 *
 *   NTFS is case-insensitive, so `existsSync('.../LICENSE-MIT')` returns true
 *   for a file actually named `license-mit`. `type-fest` is dual `MIT OR
 *   CC0-1.0` and ships both `license-mit` and `license-cc0`. On Linux the
 *   preference list missed both and the fallback picked CC0; on Windows
 *   `LICENSE-MIT` matched case-insensitively and won. Same commit, same
 *   lockfile, 120 lines of difference — and `--check` called the committed
 *   artifact stale on a clean checkout.
 *
 * Matching against the real listing makes the preference list mean what it
 * says on both platforms. `readdirSync` order is filesystem-defined, so the
 * fallback sorts before choosing; without that the output would still depend
 * on the machine that produced it.
 */
function readLicenceText(pkgPath) {
  if (!existsSync(pkgPath)) return null

  let entries
  try {
    entries = readdirSync(pkgPath)
  } catch {
    return null // unreadable directory — reported as missing below
  }

  const read = (filename) => {
    try {
      return normalise(readFileSync(join(pkgPath, filename), 'utf8')).trim()
    } catch {
      return null
    }
  }

  for (const filename of LICENCE_FILENAMES) {
    if (!entries.includes(filename)) continue
    const text = read(filename)
    if (text) return text
  }

  // Some packages name the file unpredictably (LICENSE-APACHE, COPYING, ...).
  // A package that ships more than one is telling us something — usually that
  // it is dual-licensed — so reproduce all of them, labelled, rather than
  // picking one and discarding the choice the manifest advertises.
  const matches = entries.filter((f) => /^(licen[cs]e|copying)/i.test(f)).sort()

  if (matches.length === 1) return read(matches[0])

  if (matches.length > 1) {
    const texts = matches
      .map((f) => ({ f, text: read(f) }))
      .filter(({ text }) => text)
      .map(({ f, text }) => `── ${f} ──\n\n${text}`)
    if (texts.length) return texts.join('\n\n')
  }

  return null
}

function readNotice(pkgPath) {
  // Apache-2.0 section 4(d): a NOTICE file's attributions must be reproduced
  // in derivative distributions. This is the one obligation that is easy to
  // miss because it is separate from the licence text itself.
  const candidate = join(pkgPath, 'NOTICE')
  if (!existsSync(candidate)) return null
  try {
    return normalise(readFileSync(candidate, 'utf8')).trim()
  } catch {
    return null
  }
}

function renderText(packages) {
  const lines = []
  lines.push('AI Studio — third-party licences')
  lines.push('='.repeat(72))
  lines.push('')
  lines.push('This application bundles the open-source packages listed below.')
  lines.push('Each is reproduced with its full licence text, as those licences')
  lines.push('require when the software is distributed.')
  lines.push('')
  lines.push("Corespan Systems, Inc's own source is licensed Apache-2.0 and is not")
  lines.push('covered by the notices below. See the LICENSE file in the repository.')
  lines.push('')
  lines.push(`Packages: ${packages.length}`)
  lines.push('')
  lines.push('-'.repeat(72))
  lines.push('')

  for (const pkg of packages) {
    lines.push(`${pkg.name}@${pkg.version}`)
    lines.push(`Licence: ${pkg.licence}`)
    if (pkg.author) lines.push(`Author:  ${pkg.author}`)
    lines.push(`Source:  ${pkg.homepage}`)
    lines.push('')

    if (pkg.notice) {
      lines.push('NOTICE (reproduced per Apache-2.0 section 4(d)):')
      lines.push('')
      lines.push(indent(pkg.notice))
      lines.push('')
    }

    if (pkg.text) {
      lines.push(indent(pkg.text))
    } else {
      lines.push(
        indent(
          `No licence file was distributed with this package. It declares ` +
            `${pkg.licence}; the canonical text of that licence applies. ` +
            `See ${pkg.homepage}.`,
        ),
      )
    }

    lines.push('')
    lines.push('-'.repeat(72))
    lines.push('')
  }

  return lines.join('\n')
}

function indent(text) {
  return text
    .split('\n')
    .map((line) => (line.trim() ? `    ${line}` : ''))
    .join('\n')
}

function renderMarkdown(packages) {
  const counts = new Map()
  for (const pkg of packages) counts.set(pkg.licence, (counts.get(pkg.licence) || 0) + 1)

  const flagged = packages.filter((p) => NEEDS_REVIEW.test(p.licence))
  const missingText = packages.filter((p) => !p.text)
  const withNotice = packages.filter((p) => p.notice)

  const out = []
  const versionUnits = packages.reduce(
    (total, pkg) => total + pkg.version.split(',').length,
    0,
  )

  out.push('# Third-Party Notices — aistudio-app\n')
  out.push(
    '\nThe production dependency tree of the AI Studio web app — the packages\n' +
      'Vite resolves when building the bundle served to visitors.\n',
  )
  out.push(`\nPackages: ${packages.length} · Distinct licences: ${counts.size}\n`)
  if (versionUnits !== packages.length) {
    out.push(
      `\n${versionUnits - packages.length} package(s) resolve to more than one version; ` +
        `those are listed once with every version noted, giving ${versionUnits} ` +
        'distinct name@version units in total.\n',
    )
  }
  out.push(
    '\n> Generated by `scripts/generate-third-party-notices.mjs`. Regenerate with\n' +
      '> `pnpm licences`. CI fails if this file drifts from the lockfile.\n',
  )

  out.push('\n## Why this matters here\n')
  out.push(
    '\nThis app is publicly deployed, so serving the bundle **is** distribution.\n' +
      'MIT, BSD and ISC all condition redistribution on carrying the copyright\n' +
      'notice; Apache-2.0 section 4(d) requires reproducing any NOTICE file;\n' +
      'OFL-1.1 section 2 requires the notice to accompany the fonts. 0BSD is the\n' +
      'one exception — it drops the retention clause deliberately — and is\n' +
      'reproduced anyway.\n' +
      '\nVite minifies with esbuild, which strips comments, so none of that\n' +
      'survives into the bundle on its own. The full texts are therefore emitted\n' +
      'to `public/third-party-licences.txt`, which Vite copies into `dist/` and\n' +
      'the app links from its footer — so the notices travel with the thing\n' +
      'being distributed rather than sitting in a repository the visitor never\n' +
      'opens.\n',
  )
  out.push(
    '\nA few entries are types-only (`@types/react`, `csstype`) or reachable only\n' +
      'on paths this app does not use, and contribute no runtime code to the\n' +
      'bundle. They are listed regardless: attributing more than strictly\n' +
      'required is free, and pruning the list by hand is how inventories start\n' +
      'disagreeing with what actually ships.\n',
  )
  out.push(
    '\ndevDependencies are excluded. Build tooling is never conveyed to anyone,\n' +
      'so no notice obligation attaches to it.\n',
  )

  out.push('\n## Licence distribution\n\n')
  out.push('| Licence | Packages |\n| --- | --- |\n')
  for (const [licence, count] of [...counts].sort((a, b) => b[1] - a[1])) {
    out.push(`| ${licence} | ${count} |\n`)
  }

  out.push('\n## Requires review\n')
  if (flagged.length) {
    out.push('\nCopyleft or non-standard terms in a browser bundle. Each needs a decision.\n\n')
    out.push('| Package | Version | Licence |\n| --- | --- | --- |\n')
    for (const pkg of flagged) {
      out.push(`| \`${pkg.name}\` | ${pkg.version} | **${pkg.licence}** |\n`)
    }
  } else {
    out.push(
      '\nNone. The production tree is entirely permissive — no GPL, LGPL, MPL or\n' +
        'source-available licences. The obligations here are attribution only.\n',
    )
  }

  if (withNotice.length) {
    out.push('\n## Packages shipping a NOTICE file\n')
    out.push(
      '\nApache-2.0 section 4(d) requires these attributions to be reproduced in\n' +
        'any distribution. They are included verbatim in\n' +
        '`public/third-party-licences.txt`.\n\n',
    )
    for (const pkg of withNotice) {
      out.push(`- \`${pkg.name}@${pkg.version}\` (${pkg.licence})\n`)
    }
  }

  if (missingText.length) {
    out.push('\n## No licence file shipped\n')
    out.push(
      '\nThese declare a licence in `package.json` but ship no licence file. The\n' +
        'canonical text of the declared licence applies; noted here so the gap is\n' +
        'visible rather than silent.\n\n',
    )
    for (const pkg of missingText) {
      out.push(`- \`${pkg.name}@${pkg.version}\` — declares ${pkg.licence}\n`)
    }
  }

  out.push('\n## Full inventory\n\n')
  out.push('| Package | Version | Licence | Source |\n| --- | --- | --- | --- |\n')
  for (const pkg of packages) {
    const flag = NEEDS_REVIEW.test(pkg.licence) ? ' ⚠️' : ''
    out.push(
      `| \`${pkg.name}\` | ${pkg.version} | ${pkg.licence}${flag} | ${pkg.homepage} |\n`,
    )
  }

  out.push(
    '\n---\n\nLicence identifiers come from each package\'s `package.json`. Where that ' +
      'disagrees with the shipped licence file, the file governs.\n',
  )

  return out.join('')
}

function main() {
  const packages = readProductionPackages()
  if (!packages.length) {
    console.error('ERROR: no production packages resolved. Run `pnpm install` first.')
    process.exit(EXIT_NOT_INSTALLED)
  }

  const markdown = renderMarkdown(packages)
  const text = renderText(packages)

  if (CHECK) {
    let stale = false
    for (const [path, expected] of [
      [MARKDOWN_OUT, markdown],
      [TEXT_OUT, text],
    ]) {
      if (!existsSync(path)) {
        console.error(`ERROR: ${path} is missing. Run \`pnpm licences\`.`)
        stale = true
        continue
      }
      if (readFileSync(path, 'utf8') !== expected) {
        console.error(`ERROR: ${path} is out of date. Run \`pnpm licences\` and commit.`)
        stale = true
      }
    }
    if (stale) process.exit(EXIT_STALE)
    console.log(`Third-party notices are up to date (${packages.length} packages).`)
    return
  }

  writeFileSync(MARKDOWN_OUT, markdown)
  writeFileSync(TEXT_OUT, text)

  const flagged = packages.filter((p) => NEEDS_REVIEW.test(p.licence))
  console.log(`Wrote THIRD-PARTY-NOTICES.md and public/third-party-licences.txt`)
  console.log(`  ${packages.length} production packages`)
  console.log(`  ${packages.filter((p) => p.text).length} with a shipped licence file`)
  console.log(`  ${packages.filter((p) => p.notice).length} with a NOTICE file`)
  if (flagged.length) {
    console.log(`\n  ${flagged.length} package(s) need review:`)
    for (const pkg of flagged) console.log(`    ${pkg.name}@${pkg.version} — ${pkg.licence}`)
  }
}

main()
