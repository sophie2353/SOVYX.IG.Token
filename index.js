// index.js
const express = require('express');
const axios = require('axios');

const app = express();

// Ruta para iniciar autorización en Instagram
app.get('/ig/auth', (req, res) => {
  const url = `https://www.instagram.com/oauth/authorize
    ?client_id=${process.env.APP_ID}
    &redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}
    &scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights
    &response_type=code`;
  console.log('Redirigiendo a:', url);
  res.redirect(url);
});

// Ruta callback: recibe el code y pide el token
app.get('/ig/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('Error recibido desde Instagram:', error, error_description);
    return res.status(400).json({ error, error_description });
  }

  if (!code) {
    console.error('No se recibió ningún code en el callback');
    return res.status(400).json({ error: 'No se recibió el code en el callback' });
  }

  try {
    console.log('Code recibido:', code);

    const payload = new URLSearchParams({
      client_id: process.env.APP_ID,
      client_secret: process.env.APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.REDIRECT_URI,
      code
    });

    // Intercambio del code por token corto
    const { data } = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      payload,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log('Token corto recibido:', data);

    // Convertir a token largo (60 días)
    const longToken = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: process.env.APP_SECRET,
        access_token: data.access_token
      }
    });

    console.log('Token largo recibido:', longToken.data);

    res.json({
      short_token: data.access_token,
      user_id: data.user_id,
      long_token: longToken.data.access_token,
      expires_in: longToken.data.expires_in
    });
  } catch (err) {
    console.error('Error en intercambio:', err.response?.data || err.message);
    res.status(400).json({ error: err.response?.data || err.message });
  }
});

// Puerto Railway
app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor corriendo en Railway');
});
