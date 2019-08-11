
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
    },
    "database": {
      "path": "@norjs/database-service",
      "development": true,
      "production": true,
      "autoStart": true,
      "env": {
        "NODE_LISTEN": PATH.join(ROOT, "./database-service.socket"),
        "NOR_DATABASE_STORE": PATH.join(ROOT, "./my-data")
      }
    }
  },
  "routes": {
    "/api": {
      "socket": PATH.join(ROOT, "./database-service.socket"),
      "development": true,
      "production": true
    }
  },
  "portals": {
    "root": {
      "connect": "http://localhost:3000"
    }
  }
};
