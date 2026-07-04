#!/usr/bin/env node

/**
 * UI audit umbrella — design compliance + agent stack verification.
 * Cloud agents: run `npm run audit:ui:changed -- --check` before opening a PR.
 */

import { main as designMain } from './design-audit/index.mjs';

const args = process.argv.slice(2);
const passThrough = args.filter((a) => a !== '--ui-only');

console.log('=== UI design audit ===\n');
designMain(passThrough);
