import { sleep } from '../browser.js';

const CONFIG_URL = 'https://plataforma.facturatech.co/datos_facturacion21/';

export async function extractConfig(page) {
  console.log('[extract:config] Starting...');

  await page.goto(CONFIG_URL, { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(3000);

  const formData = await page.evaluate(() => {
    const data = {};
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.id) {
        data[el.id] = el.value || '';
      }
      if (el.name && !el.id) {
        data[el.name] = el.value || '';
      }
    });

    const labels = {};
    document.querySelectorAll('label').forEach(l => {
      const htmlFor = l.getAttribute('for');
      if (htmlFor) labels[htmlFor] = l.textContent.trim();
    });

    return { inputs: data, labels };
  });

  const config = {
    name: formData.inputs['razon_social'] ||
          [formData.inputs['primer_nombre_emi'], formData.inputs['segundo_nombre_emi'],
           formData.inputs['primer_apellido_emi'], formData.inputs['segundo_apellido_emi']]
           .filter(Boolean).join(' ').trim() || null,
    comercial_name: formData.inputs['nombre_comercial_emi'] || null,
    document_number: formData.inputs['nit'] ? formData.inputs['nit'] + (formData.inputs['dv'] ? '-' + formData.inputs['dv'] : '') : null,
    dv: formData.inputs['dv'] || null,
    email: formData.inputs['email'] || formData.inputs['email_facturacion'] || formData.inputs['email_contacto'] || null,
    phone: formData.inputs['telefono'] || formData.inputs['telefono2'] || formData.inputs['telefono_fijo'] || formData.inputs['celular'] || null,
    address: formData.inputs['direccion'] || null,
    city: formData.inputs['ciudad'] || null,
    regimen: formData.inputs['regimen'] || formData.inputs['tipo_regimen'] || null,
    activities: (() => {
      const acts = [];
      for (const [key, val] of Object.entries(formData.inputs)) {
        if ((key.startsWith('actividad') || key.startsWith('categoria')) && val) acts.push(val);
      }
      return acts;
    })(),
    raw: formData.inputs,
  };

  console.log(`[extract:config] Done: name="${config.name}", doc="${config.document_number}", ${config.activities.length} activities`);
  return config;
}
