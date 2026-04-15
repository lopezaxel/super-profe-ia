const { google } = require('googleapis');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { nombre, celular, vehiculo, servicio, fecha_hora } = req.body || {};

  if (!nombre || !celular || !vehiculo || !servicio || !fecha_hora) {
    return res.status(400).json({ error: 'Faltan datos: nombre, celular, vehiculo, servicio, fecha_hora' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Hoja 1!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Salta' }),
          nombre,
          celular,
          vehiculo,
          fecha_hora,
          servicio,
        ]],
      },
    });

    res.json({ ok: true, message: 'Turno agendado en Google Sheets' });
  } catch (e) {
    console.error('Error al escribir en Sheets:', e);
    res.status(500).json({ error: 'No se pudo agendar: ' + e.message });
  }
};
