# Local Testing Guide

Run the production readiness checks before packaging:

```bash
npm run check:erp
npm run build
npm run build-installer
```

The desktop UI is loaded from the local React build. API traffic is routed through the configured desktop API base URL.
