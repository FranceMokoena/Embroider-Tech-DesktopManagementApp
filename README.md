# EmbroideryTech RFID Asset ERP

EmbroideryTech Desktop is an Electron-based RFID asset registry for EPC-first asset verification, section control, transfers, and audit reporting.

## Production Architecture

Electron loads the local React bundle from `build/index.html`.

The React ERP console talks to:

- `/api/assets`
- `/api/rfid`
- `/api/features`

Canonical identity:

- `Asset.epc`
- `Asset.currentSection`
- `Asset.verificationStatus`

## Release Checks

Run:

```bash
npm run check:erp
npm run build
npm run build-installer
```

The ERP contamination check runs automatically before every production build.
