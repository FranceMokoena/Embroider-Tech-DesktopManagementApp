import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    features: {
      epcFirstArchitecture: true,
      rfidVerification: true,
      assetRegistry: true,
      sectionVerification: true,
      transfers: true,
      offlineDesktopShell: true
    }
  });
});

export default router;
