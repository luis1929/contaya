export const LOGIN = {
  username: [
    'input[type="text"]',
    'input[autocomplete="username"]',
    'input[name="usuario"]',
    'input[name="username"]',
    'input[name="user"]',
    'input[name="email"]',
    'input[name="correo"]',
    'input#usuario',
    'input#username',
    'input#user',
    'input#email',
    'input[placeholder*="usuario" i]',
    'input[placeholder*="user" i]',
    'input[placeholder*="correo" i]',
    'input[placeholder*="email" i]',
    'input[placeholder*="identificacion" i]',
    'input[placeholder*="documento" i]',
    'label:has-text("Usuario") input',
    'label:has-text("Correo") input',
    'label:has-text("Email") input',
    'label:has-text("Identificación") input',
  ],
  password: [
    'input[type="password"]',
    'input[autocomplete="current-password"]',
    'input[name="password"]',
    'input[name="clave"]',
    'input[name="pass"]',
    'input[name="contrasena"]',
    'input#password',
    'input#contrasena',
    'input#pass',
    'input#clave',
    'input[placeholder*="contrase" i]',
    'input[placeholder*="password" i]',
    'input[placeholder*="clave" i]',
    'label:has-text("Contrase") input',
    'label:has-text("Password") input',
    'label:has-text("Clave") input',
  ],
  submit: [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Ingresar")',
    'button:has-text("Entrar")',
    'button:has-text("Acceder")',
    'button:has-text("Iniciar")',
    'button:has-text("Login")',
    'button:has-text("Ingresar")',
    'a:has-text("Ingresar")',
  ],
};

export const LOGIN_VERIFY = {
  successUrlPatterns: [
    /dashboard/i,
    /home/i,
    /inicio/i,
    /comprobantes/i,
    /clientes/i,
    /items/i,
    /facturacion/i,
  ],
  successSelectors: [
    'a:has-text("Cerrar sesión")',
    'a:has-text("Salir")',
    'a:has-text("Logout")',
    '.dropdown-user',
    '[class*="user-menu"]',
    '[class*="user-info"]',
    'nav a:has-text("Comprobantes")',
    'nav a:has-text("Clientes")',
  ],
  errorIndicators: [
    '.alert-danger',
    '.alert-error',
    '.error-message',
    '.alert.alert-danger',
    '[class*="alert"]',
    'text=usuario o contrase',
    'text=incorrecto',
    'text=inv',
    'text=error',
  ],
};

export async function resolveSelector(page, selectorList) {
  for (const sel of selectorList) {
    const el = await page.$(sel);
    if (el) {
      const visible = await el.isVisible().catch(() => false);
      if (visible) return sel;
    }
  }
  return null;
}

export async function findInput(page, selectorList) {
  for (const sel of selectorList) {
    const el = await page.$(sel);
    if (el) {
      const visible = await el.isVisible().catch(() => false);
      if (visible) return el;
    }
  }
  return null;
}
