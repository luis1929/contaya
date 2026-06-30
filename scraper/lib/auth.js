import { LOGIN, LOGIN_VERIFY, findInput } from './selectors.js';
import { launchBrowser, closeSession, sleep } from './browser.js';

const LOGIN_URL = 'https://plataforma.facturatech.co/login/';

async function isLoggedIn(page) {
  const currentUrl = page.url().toLowerCase();

  const urlMatch = LOGIN_VERIFY.successUrlPatterns.some(p => p.test(currentUrl));
  if (urlMatch) return { ok: true };

  for (const sel of LOGIN_VERIFY.successSelectors) {
    const el = await page.$(sel);
    if (el && await el.isVisible().catch(() => false)) {
      return { ok: true };
    }
  }

  return { ok: false };
}

async function detectLoginError(page) {
  for (const text of LOGIN_VERIFY.errorIndicators) {
    try {
      const el = await page.$(text);
      if (el && await el.isVisible().catch(() => false)) {
        const errorText = await el.textContent().catch(() => '');
        return `Error en formulario: "${errorText.trim() || 'mensaje genérico'}"`;
      }
    } catch {}
  }

  const bodyText = await page.textContent('body').catch(() => '');
  const errorKeywords = ['usuario o contrase', 'incorrecto', 'inv', 'bloqueado'];
  for (const kw of errorKeywords) {
    if (bodyText.toLowerCase().includes(kw)) {
      return `Posible error de credenciales (detectado: "${kw}")`;
    }
  }

  return null;
}

async function attemptLogin(page, username, password) {
  const usernameInput = await findInput(page, LOGIN.username);
  if (!usernameInput) throw new Error('No se encontró campo de usuario');
  await usernameInput.fill(username);

  const passwordInput = await findInput(page, LOGIN.password);
  if (!passwordInput) throw new Error('No se encontró campo de contraseña');
  await passwordInput.fill(password);

  const submitBtn = await findInput(page, LOGIN.submit);
  if (!submitBtn) throw new Error('No se encontró botón de envío');
  await submitBtn.click();

  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await sleep(3000);
}

export async function login(page, username, password, { retries = 2 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    if (attempt > 1) {
      console.log(`[auth] Reintento ${attempt}/${retries}...`);
      await page.goto(LOGIN_URL, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => null);
      await sleep(2000);
    }

    await page.goto(LOGIN_URL, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => null);
    await sleep(3000);

    await attemptLogin(page, username, password);

    const check = await isLoggedIn(page);
    if (check.ok) {
      console.log('[auth] Login exitoso');
      return true;
    }

    const errorReason = await detectLoginError(page);
    console.log(`[auth] Intento ${attempt} falló: ${errorReason || 'no se pudo verificar el login'}`);

    if (attempt === retries) {
      await page.screenshot({ path: '/tmp/facturatech_auth_error.png' }).catch(() => {});
      throw new Error(
        errorReason
          ? `Login falló después de ${retries} intentos: ${errorReason}`
          : `Login falló después de ${retries} intentos. Captura en /tmp/facturatech_auth_error.png`
      );
    }
  }
}

export async function createAuthenticatedSession(credentials, options = {}) {
  const { username, password } = credentials;
  const session = await launchBrowser(options);

  try {
    await login(session.page, username, password, options);
    return session;
  } catch (err) {
    await closeSession(session);
    throw err;
  }
}
