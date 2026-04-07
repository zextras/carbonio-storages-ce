/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const { execSync } = require("child_process");

function reset() {
  console.log("Resetting project... ");
  try {
    const execOptions = { stdio: "inherit" };

    const steps = [
      { name: "Cleaning root", command: "rm -rf node_modules pnpm-lock.yaml" },
      { name: "Pruning store", command: "pnpm store prune --force" },
      { name: "Installing", command: "pnpm install" },
    ];

    for (const step of steps) {
      console.log(step.name);
      execSync(step.command, execOptions);
    }
  } catch {
    console.log("Reset failed.");
    process.exit(1);
  }
}

reset();
