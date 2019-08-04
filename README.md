# portal-service

This is a micro service acting as an authorizing gateway between network and local UNIX 
socket services.

### Configuration File

A configuration file `./nor.json` could look like:

```json
{
  "auth": {
    "default": {
      "path": "./MyAuthenticator.js",
      "config": "./auth.json"
    }
  },
  "routes": {
    "/event": {
      "socket": "./event.sock",
      "auth": "default"
    },
    "/database": {
      "socket": "./database.sock",
      "auth": "default"      
    }
  }
}
```

### Authentication

Implement an authenticator in a file named `./MyAuthenticator.js`:

```js
/**
 * @implements {NorPortalAuthenticator}
 */
class MyAuthenticator {
    
    constructor (config) {
        this._config = config;
    }
    
    /**
     * 
     * @param context {NorPortalContextObject}
     * @returns {boolean}
     */
    hasAccess (context) {
        return !!context && (context.password === this._config.password);
    }
    
}

module.exports = MyAuthenticator;
```

***Note!*** This is just a simplified example.

### Start the service

Start in a TCP port `localhost:3000`:

```
NODE_LISTEN='3000' nor-portal-service
```

Start in a socket file:

```
NODE_LISTEN='./portal.sock' nor-portal-service
```

The configuration will be readed from `./nor.json` by default. You may change it:

```
NOR_PORTAL_CONFIG='./portal/nor.json' \
NODE_LISTEN='./portal.sock' \
nor-portal-service
```
