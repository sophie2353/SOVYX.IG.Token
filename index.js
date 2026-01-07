// index.js
const express = require('express');
const axios = require('axios');
const app = express();

// Ruta para iniciar autorización en Instagram
app.get('/ig/auth', (req, res) => {
  const url = `https://api.instagram.com/oauth/authorize
    ?client_id=${process.env.APP_ID}
    &redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}
    &scope=user_profile,user_media
    &response_type=code`;
  res.redirect(url);
});

// Ruta callback: recibe el code y pide el token
app.get('/ig/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const payload = new URLSearchParams({
      client_id: process.env.APP_ID,
      client_secret: process.env.APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.REDIRECT_URI,
      code
    });

    // Intercambio del code por token corto
    const { data } = await axios.post('https://api.instagram.com/oauth/access_token', payload);

    // Opcional: convertir a token largo (60 días)
    const longToken = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: process.env.APP_SECRET,
        access_token: data.access_token
      }
    });

    res.json({
      short_token: data.access_token,
      user_id: data.user_id,
      long_token: longToken.data.access_token,
      expires_in: longToken.data.expires_in
    });
  } catch (err) {
    res.status(400).json({ error: err.response?.data || err.message });
  }
});

// Puerto Railway
app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor corriendo en Railway');
});
