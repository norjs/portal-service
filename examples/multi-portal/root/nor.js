const PATH = require('path');
const ROOT = __dirname;
const PORTAL_LISTEN = process.env.PORTAL_LISTEN || PATH.join(ROOT, "./portal-service.socket");

module.exports = {
  "services": {
    "portal": {
      "path": "@norjs/portal-service",
      "development": true,
      "production": true,
      "autoStart": true,
      "env": {
        "NODE_LISTEN": PORTAL_LISTEN,
        "NOR_PORTAL_CONFIG": PATH.join(ROOT, "./nor.js")
      }
    }
  },
  "routes": {
    "/db": {
      "type": "ptth"
    }
  }
};
