const PATH = require('path');
const ROOT = __dirname;

module.exports = {
  "services": {
    "portal": {
      "path": "@norjs/portal-service",
      "development": true,
      "production": true,
      "autoStart": true,
      "env": {
        "NODE_LISTEN": PATH.join(ROOT, "./portal-service.socket"),
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
