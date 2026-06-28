import { chromium } from 'playwright';

const DEFAULT_VIEWPORT = { width: 1280, height: 900 };

export async function launchBrowser(options = {}) {
  const {
    headless = true,
    viewport = DEFAULT_VIEWPORT,
    storageState = null,
    locale = 'es-CO',
    timeout = 30000,
  } = options;

  const browser = await chromium.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const contextOptions = { viewport, locale };
  if (storageState) contextOptions.storageState = storageState;

  const context = await browser.newContext(contextOptions);
  context.setDefaultTimeout(timeout);

  const page = await context.newPage();

  return { browser, context, page };
}

export async function closeSession({ browser, context } = {}) {
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
}

export async function saveSession(context, filePath) {
  await context.storageState({ path: filePath });
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
