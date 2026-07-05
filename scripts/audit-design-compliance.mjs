#!/usr/bin/env node

/**
 * Design compliance audit — enforces agent-facing rules from design.md.
 *
 * Usage:
 *   node scripts/audit-design-compliance.mjs              # core report (exit 0)
 *   node scripts/audit-design-compliance.mjs --check        # CI: exit 1 on violations
 *   node scripts/audit-design-compliance.mjs --changed    # strict on PR-changed UI files
 *   node scripts/audit-design-compliance.mjs --strict     # strict on entire codebase
 *   node scripts/audit-design-compliance.mjs --json         # machine-readable output
 *
 * Modular rules live in scripts/design-audit/
 */

import { main } from './design-audit/index.mjs';

main();
