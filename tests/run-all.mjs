// run-all.mjs — runs every suite, clearing the rate-limit counters between
// them.
//
// Why this exists: the suites create real accounts against the deployed Worker.
// Registration is rate limited per IP to stop mass signup, and five suites
// creating accounts back to back exhaust that bucket. Clearing between suites
// keeps the run deterministic. A manual `DELETE FROM rate_limits` before a
// single suite can race D1 propagation and cause a spurious 429, which is what
// this script exists to remove.
//
// Usage:  node tests/run-all.mjs

import { spawnSync } from "node:child_process";

const SUITES = ["coach.test.mjs", "curriculum.test.mjs", "api.test.mjs", "platform.test.mjs", "platform2027.test.mjs"];

function run(cmd, args, useShell = false) {
  // node.exe is spawned WITHOUT a shell: its path contains spaces
  // ("C:\Program Files\nodejs\node.exe") and a shell would split it. The
  // npx.cmd shim on Windows DOES need a shell.
  const r = spawnSync(cmd, args, { stdio: "pipe", shell: useShell, encoding: "utf8" });
  return `${r.stdout || ""}${r.stderr || ""}`;
}

function clearLimits() {
  // Wrangler is invoked through npx; on Windows the .cmd shim must be used
  // because PowerShell blocks the npx.ps1 variant.
  const isWin = process.platform === "win32";
  const out = run(isWin ? "npx.cmd" : "npx", ["wrangler", "d1", "execute", "economic-intelligence-db",
    "--remote", "--command", "DELETE FROM rate_limits"], isWin);
  if (/error/i.test(out) && !/Executed|success/i.test(out)) {
    console.warn("  ! could not clear rate_limits, suites may hit 429");
  }
}

let grandPass = 0, grandFail = 0, failedSuites = 0;

for (const suite of SUITES) {
  process.stdout.write(`${suite.padEnd(22)} `);
  clearLimits();
  const out = run(process.execPath, [`tests/${suite}`]);
  const m = /(\d+)\/(\d+) passed, (\d+) failed/.exec(out);
  if (!m) {
    console.log("NO SUMMARY");
    console.log(out.split("\n").filter((l) => /^FAIL|Error/.test(l)).slice(0, 6).join("\n"));
    failedSuites++;
    continue;
  }
  const [, pass, , fail] = m;
  grandPass += Number(pass);
  grandFail += Number(fail);
  if (Number(fail) > 0) {
    failedSuites++;
    console.log(`${pass}/${Number(pass) + Number(fail)} passed, ${fail} FAILED`);
    out.split("\n").filter((l) => /^FAIL/.test(l)).slice(0, 8).forEach((l) => console.log(`      ${l}`));
  } else {
    console.log(`${pass}/${Number(pass) + Number(fail)} passed, 0 failed`);
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`TOTAL ${grandPass} passed, ${grandFail} failed across ${SUITES.length} suites`);
console.log(failedSuites ? `${failedSuites} suite(s) had failures` : "All suites green");
process.exit(grandFail || failedSuites ? 1 : 0);
