# EmbroideryTech RFID ERP API

This bundled API supports the Electron desktop ERP console.

## Canonical Routes

- `GET /api/assets`
- `GET /api/assets/:id`
- `PUT /api/assets/:id`
- `DELETE /api/assets/:id`
- `POST /api/assets/:id/transfer`
- `GET /api/assets/sections`
- `GET /api/assets/transfers`
- `GET /api/assets/verification-history`
- `GET /api/assets/metrics`
- `POST /api/rfid/verify-room`
- `GET /api/rfid/lookup/:epc`
- `GET /api/features`

Business identity is EPC-first through `Asset.epc`, `Asset.currentSection`, and `Asset.verificationStatus`.
