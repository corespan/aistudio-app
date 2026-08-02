# Licence review — corespan/aistudio-app

**Repo:** `corespan/aistudio-app`
**Reviewed:** 2 August 2026
**Author:** ManojDev
**Context:** parallel audit to the 31 July review of `corespan/aistudio-server`,
applying the same lens to the frontend.

---

## Summary

Six findings. One blocker, one high, three medium, one low.

The headline is different from the server's, and better in one respect and
worse in another.

**Better:** the dependency position is clean. All 54 production packages are
permissive — no GPL, LGPL, MPL, or source-available licences anywhere in the
tree. There is nothing here requiring a legal decision. The server's largest
exposure, the CUDA EULA in the workload images, has no analogue.

**Worse:** the distribution question, which was arguable for the server, is not
arguable here. `aistudio-server` conveys images to node operators, and finding 8
turned on whether we ship prebuilt artifacts. This app is deployed publicly at
`corespan.ai/aistudio`. Every visitor's browser downloads a bundle containing
all 54 packages. That is distribution, it happens thousands of times a day, and
essentially every permissive licence conditions it on carrying the copyright
notice.

Before this change, the bundle carried none. Measured, not assumed:

```
$ grep -c "Copyright" dist/assets/index-*.js
0
$ grep -c "Permission is hereby granted" dist/assets/index-*.js
0
```

Vite minifies with esbuild, which strips comments. Every notice in every package
was discarded at build time.

| | Count | Findings |
| --- | --- | --- |
| ✅ Fixed | 5 | A1, A2, A3, A4, A5 |
| 🔵 Open — product decision | 1 | A6 |

---

## A1. The distributed bundle carries no attribution

**Blocker · Licence · largest exposure**

**Technical.** `pnpm licenses list --prod` resolves 54 packages into the
production tree: 47 MIT, 2 BSD-3-Clause, 1 Apache-2.0, 1 ISC, 1 0BSD, 1 OFL-1.1,
1 dual MIT/CC0. All are bundled by Vite into `dist/assets/index-*.js` and served
to every visitor. `build.minify` defaults to esbuild, which strips comments, so
no licence header survives. Confirmed by grep against a production build: zero
occurrences of `Copyright`, `Permission is hereby granted`, or any licence text
in the emitted JS or CSS.

The specific conditions that were unmet:

| Licence | Condition | Count |
| --- | --- | --- |
| MIT | "shall be included in all copies or substantial portions" | 47 |
| BSD-3-Clause | binary redistribution must reproduce the notice "in the documentation or other materials" | 2 |
| ISC | equivalent notice retention | 1 |
| Apache-2.0 §4(d) | reproduce the NOTICE file's attributions | 1 |
| OFL-1.1 §2 | copyright and licence must accompany the fonts | 1 |
| (MIT OR CC0-1.0) | MIT branch taken; CC0 would impose nothing | 1 |
| 0BSD | **no condition** — see below | 1 |

0BSD is the one package (`tslib`) that imposes nothing. It is the
public-domain-equivalent BSD variant with the retention clause deliberately
removed: *"Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted"*, full stop. It is
reproduced in the notices anyway — over-attributing is free — but it should not
be counted as an unmet obligation. Called out because overstating an obligation
in a document going to counsel is the kind of error that gets the accurate parts
discounted too.

**On the count.** 54 is the number of distinct packages. `tslib` resolves to two
versions (2.3.0 and 2.8.1), so there are 55 name@version units. Both are 0BSD;
the inventory lists the package once with both versions noted.

**Plain.** Your website ships other people's code to every visitor. Nearly all of
those licences say the same thing: you can do what you like with this, but keep
our name on it. The build step was deleting all of them. Nothing here is
restrictive — it is the easiest class of obligation there is — but it was going
unmet on every page load.

A few of the 54 are types-only (`@types/react`, `csstype`) or sit on code paths
this app never reaches, and contribute nothing to the runtime bundle. They are
attributed regardless. Pruning the list by hand is how an inventory starts
disagreeing with what actually ships, and there is no cost to listing them.

**Fix.** `scripts/generate-third-party-notices.mjs` reads the real production
tree and produces two artifacts:

- `THIRD-PARTY-NOTICES.md` — committed summary, for the repo and for scanners.
- `public/third-party-licences.txt` — full verbatim licence texts, 94 KB. Vite
  copies `public/` into `dist/`, so it is served alongside the app at
  `/aistudio/third-party-licences.txt`.

The app footer links it. That link is the point: a licence file sitting in a
repository the visitor never opens does not accompany anything. The notice has
to travel with the bundle.

After:

```
$ grep -c "Copyright" dist/third-party-licences.txt
74
$ grep -c "The Apache Software Foundation" dist/third-party-licences.txt
2
```

Two items warranted specific handling rather than a generic licence dump:

- **Apache ECharts** ships a `NOTICE` file. Apache-2.0 §4(d) requires its
  attributions to be reproduced in distributions of derivative works — an
  obligation separate from, and easy to miss alongside, the licence text itself.
  The generator reads `NOTICE` files specifically and reproduces them under
  their own heading.
- **`react-remove-scroll-bar@2.3.8`** declares MIT in `package.json` but ships
  no licence file. The canonical MIT text applies; the generator records the gap
  explicitly rather than silently substituting text the author never published.

**Reachable at every breakpoint.** The link is deliberately *not*
`visibleFrom="sm"`, unlike the GitHub callout next to it. A phone receives
exactly the same bundle as a desktop, so hiding the link below the breakpoint
would leave those visitors with no route to the notices — while every automated
check still passed, because the file would be in `dist/` and the string would be
in the bundle. The label shortens on narrow screens instead of disappearing, and
`pnpm compliance` fails if a `visibleFrom` ever appears on it.

**Preventing recurrence.** CI builds the app and asserts the licence file is in
`dist/`, contains 40+ copyright notices, contains the Apache NOTICE attribution,
contains the OFL text, and that the bundle references it at the correct
production base path. It also requires an `href={LICENCES_URL}` in the footer —
checking for the bare identifier was not enough, since deleting the `<Anchor>`
while leaving the import behind passes a substring test and eslint only warns on
the unused import.

---

## A2. LICENSE copyright placeholder never filled in

**High · Licence**

**Technical.** `LICENSE` is the correct full Apache-2.0 text (11,357 bytes) —
so unlike `aistudio-server` finding 1, GitHub detects it and scanners resolve it
to `Apache-2.0`. But the appendix still read:

```
   Copyright [yyyy] [name of copyright owner]
```

The placeholder is inert legally — the grant does not depend on the appendix,
which is instructional boilerplate for people applying the licence to their own
work. It matters for a different reason: it is the only place in the repository
that identifies the copyright holder, and it identified nobody.

**Plain.** The licence itself was fine. But the line naming who owns the
copyright still said "[name of copyright owner]" — the template text you are
meant to replace. Anyone trying to work out who to ask for permission had
nothing to go on.

**Fix.** Filled in as `Copyright 2026 CoreSpan AI`, matching `aistudio-server`.
`NOTICE` added, carrying the copyright line, the third-party pointer and the
trademark statement. CI fails if the placeholder ever reappears.

---

## A3. No `license` field in package.json

**Medium · Convention**

**Technical.** `package.json` had `"private": true` and no `license` field. npm,
`pnpm licenses`, and every SBOM generator report such a package as
`UNLICENSED`, which is a positive assertion of "all rights reserved" — the exact
opposite of the Apache-2.0 grant in the repository root.

This is the JS-ecosystem twin of `aistudio-server` finding 1: the licence was
right, and the machine-readable declaration said something else. That mismatch
is what tooling acts on.

**Plain.** The file that tools read to find out your licence did not mention one,
so tools concluded you had reserved all rights. Your actual licence says the
opposite.

**Fix.** Added `"license": "Apache-2.0"`, plus `author`, `repository` (with
`directory`, since the app lives in a subfolder) and `homepage`. CI asserts the
field.

---

## A4. No third-party inventory

**Medium · Licence**

**Technical.** No SBOM, no `THIRD-PARTY-NOTICES`, no licence scanning in CI.
Same gap as `aistudio-server` finding 8, but the resolution differs: `pnpm-lock.yaml`
already pins the full transitive tree, so unlike the server there was no
version-drift problem underneath the missing inventory.

**Plain.** Nobody could say what was in the app without going and looking.

**Fix.** `THIRD-PARTY-NOTICES.md`, generated from the resolved tree, with the
licence distribution, packages shipping a NOTICE, packages missing a licence
file, and the full table. `pnpm licences` regenerates; CI fails on drift.

`devDependencies` are deliberately excluded — 435 packages install, but only the
54 production ones are conveyed to anyone. Build tooling attracts no notice
obligation.

---

## A5. No root `.gitignore`; IDE files at risk of being committed

**Low · Hygiene**

**Technical.** `Benchmarking/.gitignore` covers the app subfolder. The repository
root had none, leaving `.idea/` untracked-but-unignored — one `git add -A` from
being committed. `.env` is correctly ignored inside `Benchmarking/`, but not at
the root.

**Plain.** Editor settings and, more importantly, `.env` files were one careless
`git add` away from being public.

**Fix.** Root `.gitignore` covering IDE directories, OS files, `.env` at any
level (with `.env.example` exempted), and `.vercel`. Nothing sensitive had
actually been committed — verified against `git ls-files`.

Two adjacent things found while checking, neither a licence issue:

- `Benchmarking/tsconfig.tsbuildinfo` **is** committed — 374 KB of build output
  that every `tsc` run dirties. Now ignored and untracked.
- `Benchmarking/.env.example` publishes a live internal endpoint,
  `https://corespan.ddnsgeek.com:8443`, in a public repository. Not a secret,
  but a real host that need not be advertised. Left as-is because changing it
  would break the documented dev setup — flagging it for a decision rather than
  altering it unilaterally.

---

## A6. "AI Studio" name collision

**Low · Branding — unchanged from the server review**

Identical to `aistudio-server` finding 10, and the same answer applies: Apache-2.0
§6 grants no trademark rights, and "AI Studio" collides with both Google AI
Studio and Azure AI Studio.

Worth noting this repo raises the stakes slightly. `aistudio-server` is a backend
that mostly appears in developer contexts. This is the public-facing product
surface at `corespan.ai/aistudio` — the thing that has to be findable. Competing
for that search term against two hyperscaler marketing budgets is the practical
cost, not litigation risk.

No code fix. The trademark statement is now in `NOTICE`. A clearance search is
still the suggested next step, and the cost of renaming only rises from here.

---

## What did not apply

Worth recording, because the absence is informative rather than an oversight:

| Server finding | Status here |
| --- | --- |
| 1 — LICENSE not the Apache text | Not applicable. The text is complete; only the copyright placeholder was unfilled (A2). |
| 2 — empty, unverifiable release | Not applicable. No release artifacts; deployment is continuous via Vercel. |
| 3 — "open source" vs private gate | Not applicable. Nothing here is gated. |
| 5 — model licences | Not applicable. The frontend renders results; it does not download weights. |
| 6 — container image inventory | Not applicable. No containers. |
| 7 — unpinned dependencies | **Already satisfied.** `package.json` uses `^` ranges, but `pnpm-lock.yaml` pins the resolved tree. CI installs with `--frozen-lockfile`, which is what makes the ranges safe. No change needed. |
| 9 — CDN fonts | **Already satisfied.** Inter is bundled via `@fontsource/inter`; `index.html` references no external origin. This was done correctly from the start. Self-hosting does create the OFL-1.1 notice obligation, which is now discharged (A1). CI guards against a CDN reference creeping back. |

---

## What CI now enforces

| Check | Catches |
| --- | --- |
| LICENSE complete, no placeholder copyright | A2 recurring |
| NOTICE, THIRD-PARTY-NOTICES.md, licences txt present | A1, A2, A4 |
| `package.json` declares Apache-2.0 | A3 |
| No CDN or Google Fonts origin in `src/` or `index.html` | Server finding 9 arriving here |
| Footer still links `LICENCES_URL` | A1 being silently undone by a UI change |
| Inventory matches the installed production tree | A4 going stale |
| **Built bundle** contains 40+ notices, the Apache NOTICE, the OFL text | A1 — the check that actually matters |
| Bundle references the licence file at `/aistudio/` | Attribution becoming unreachable after a base-path change |

The build-output checks are the substantive ones. Everything else verifies files
exist in a repository; only those confirm the notices reach the person receiving
the software.

---

## Open items

| # | Item | Owner |
| --- | --- | --- |
| A6 | Trademark clearance search on "AI Studio" | Product + Counsel |
| — | Decide whether to link the licences page from the About view as well as the footer | Product |
| — | Consider `manualChunks` — the bundle is 1.58 MB, above Vite's 500 KB warning. Unrelated to licensing, noted while building. | Engineering |

---

## Files added or changed

**Added**

```
NOTICE                                            Copyright, third-party pointer, trademarks
.gitignore                                        Root-level ignores
.github/workflows/compliance.yml                  CI enforcement
docs/LICENCE-REVIEW-RESPONSE.md                   This document
Benchmarking/THIRD-PARTY-NOTICES.md               54-package inventory
Benchmarking/public/third-party-licences.txt      Full licence texts, served with the app
Benchmarking/scripts/generate-third-party-notices.mjs
Benchmarking/scripts/check-compliance.mjs
```

**Changed**

```
LICENSE                          Copyright placeholder → CoreSpan AI
Benchmarking/package.json        license/author/repository/homepage; licences + compliance scripts
Benchmarking/src/app/constants.ts        LICENCES_URL, base-path aware
Benchmarking/src/app/layout/AppFooter.tsx   Attribution link
```
