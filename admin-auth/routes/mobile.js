import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Load env variables
const MOBILE_API = process.env.MOBILE_API;
const DESKTOP_SERVICE_TOKEN = process.env.DESKTOP_SERVICE_TOKEN;

// GET scan history from mobile backend
router.get('/scan-history', async (req, res) => {
  try {
    const response = await fetch(`${MOBILE_API}/api/scan/history`, {
      headers: {
        Authorization: `Bearer ${DESKTOP_SERVICE_TOKEN}`, // Service token authentication
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Mobile API error: ${errorText}`);
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('❌ Error fetching scan history from mobile API:', err);
    return res.status(500).json({ error: 'Failed to fetch scan history from mobile API' });
  }
});

export default router;
