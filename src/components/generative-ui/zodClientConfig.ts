import { z } from 'zod';

/**
 * Must load before any other module touches Zod's eval probe (strict CSP fires on `new Function`).
 * @see https://zod.dev/api?id=jitless
 */
z.config({ jitless: true });
