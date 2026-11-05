import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const generativeUiDir = join(process.cwd(), 'src/components/generative-ui');

describe('daily themes CSP (Zod jitless)', () => {
  it('enables Zod jitless mode for the client catalog', async () => {
    await import('../src/components/generative-ui/zodClientConfig');
    const { z } = await import('zod');
    expect(z.config().jitless).toBe(true);
  });

  it('loads zodClientConfig before json-render in client entry modules', () => {
    for (const file of ['ThemesExplorer.tsx', 'catalog.ts']) {
      const src = readFileSync(join(generativeUiDir, file), 'utf8');
      const jitlessImport = src.indexOf("import './zodClientConfig'");
      expect(jitlessImport, `${file} should import zodClientConfig`).toBeGreaterThanOrEqual(0);
      const jsonRender = src.search(/@json-render/);
      if (jsonRender >= 0) {
        expect(jitlessImport, `${file} should configure Zod before json-render`).toBeLessThan(jsonRender);
      }
    }
  });

  it('does not emit script-src eval violations under production CSP when built', async () => {
    const dailyThemesHtml = join(process.cwd(), 'dist/client/daily-themes.html');
    if (!existsSync(dailyThemesHtml)) {
      return;
    }

    const { createServer } = await import('node:http');
    const { extname } = await import('node:path');
    const { chromium } = await import('playwright');

    const root = join(process.cwd(), 'dist/client');
    const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'));
    const csp = vercel.headers
      .find((rule: { source: string }) => rule.source === '/(.*)')
      .headers.find((header: { key: string }) => header.key === 'Content-Security-Policy').value;

    const mime: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };

    const server = createServer((req, res) => {
      let path = req.url?.split('?')[0] || '/';
      if (path.endsWith('/')) path += 'index.html';
      if (!extname(path)) {
        const htmlPath = join(root, path.slice(1) + '.html');
        if (existsSync(htmlPath)) path = `${path}.html`;
      }
      const file = join(root, path === '/' ? 'index.html' : path.slice(1));
      if (!existsSync(file)) {
        res.writeHead(404);
        res.end('404');
        return;
      }
      res.writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Content-Security-Policy': csp,
      });
      res.end(readFileSync(file));
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as { port: number }).port;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const violations: { blockedURI: string; sourceFile: string }[] = [];
    await page.exposeFunction('reportCsp', (detail: { blockedURI: string; sourceFile: string }) => {
      violations.push(detail);
    });
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        (window as unknown as { reportCsp: (d: unknown) => void }).reportCsp({
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
        });
      });
    });

    await page.goto(`http://127.0.0.1:${port}/daily-themes`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForSelector('.themes-explorer', { timeout: 30_000 });

    await browser.close();
    server.close();

    const evalViolations = violations.filter((v) => v.blockedURI === 'eval');
    expect(evalViolations).toEqual([]);
  }, 90_000);
});
