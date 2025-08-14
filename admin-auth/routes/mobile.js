import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Load env variables
const MOBILE_API = process.env.MOBILE_API;
const DESKTOP_SERVICE_TOKEN = process.env.DESKTOP_SERVICE_TOKEN;

// GET all scan history from mobile backend for admin/desktop
router.get('/scan-history', async (req, res) => {
  try {
    const url = `${MOBILE_API}/api/mobile-scans/history/all`; // <-- new endpoint
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${DESKTOP_SERVICE_TOKEN}`, // Service token authentication
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Mobile API error: ${errorText}`);
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();

    // Flatten sessions & scans for frontend display
    const flatScans = [];
    let totalScans = 0,
        totalReparable = 0,
        totalBeyondRepair = 0,
        totalHealthy = 0;

    if (data.sessions) {
      data.sessions.forEach(session => {
        const techName = session.technician
          ? `${session.technician.name} ${session.technician.surname}`
          : 'Unknown Technician';

        session.scans.forEach(scan => {
          flatScans.push({
            barcode: scan.barcode,
            status: scan.status,
            technician: techName,
            date: scan.timestamp,
          });

          // Compute stats
          totalScans++;
          switch (scan.status) {
            case 'Reparable': totalReparable++; break;
            case 'Beyond Repair': totalBeyondRepair++; break;
            case 'Healthy': totalHealthy++; break;
          }
        });
      });
    }

    return res.json({ scans: flatScans, stats: { totalScans, totalReparable, totalBeyondRepair, totalHealthy } });

  } catch (err) {
    console.error('❌ Error fetching scan history from mobile API:', err);
    return res.status(500).json({ error: 'Failed to fetch scan history from mobile API' });
  }
});

export default router;
