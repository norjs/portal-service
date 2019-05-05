# portal-service

This is a micro service acting as a authorizing gateway between network and local UNIX 
socket services using HTTP protocol.

------------------------------------------

***NOTE!*** This is a draft of how this application works; it is not yet functional.

------------------------------------------

### Usage 

------------------------------------------

#### Configuration file `./my-config.json`

```json
{
  "auth": {
    "default": {
      "path": "./MyAuthenticator.js",
      "config": "./auth.json"
    }
  },
  "services": {
    "event": {
      "path": "/path/to/event-service.socket",
      "auth": "default"
    },
    "database": {
      "path": "/path/to/database-service.socket",
      "auth": "default"
    }
  },
  "routes": {
    "/event": "event",
    "/database": "database"
  }
}
```

------------------------------------------

#### Implement an authenticator in a file named `./MyAuthenticator.js`

***Note!*** This is just a simplified example.

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

------------------------------------------

#### Start the service

```
NOR_PORTAL_CONFIG='./my-config.json' \
NOR_PORTAL_PORT='3000' \
npm start
```

------------------------------------------
