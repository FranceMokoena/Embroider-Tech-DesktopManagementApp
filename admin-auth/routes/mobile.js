// desktop-backend/routes/mobile.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // or axios

const MOBILE_API = 'https://embroider-scann-app.onrender.com';

// Proxy scan history
router.get('/mobile-scans', async (req, res) => {
  try {
    const mobileToken = process.env.MOBILE_API_TOKEN; // generated for mobile API access
    const response = await fetch(`${MOBILE_API}/api/scan/history`, {
      headers: { Authorization: `Bearer ${mobileToken}` }
    });
    if (!response.ok) return res.status(response.status).send(await response.text());
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mobile data' });
  }
});

module.exports = router;
