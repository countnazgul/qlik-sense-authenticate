

## Under development!

This package will simplify (or at least this is the idea) of authenticating agains Qlik Sense. If the authentication is successful the result will be `session id` which can be used is the request that will follow.

At the end this package will support 4 authentication methods:

* Certificates
* Header
* JWT
* Windows/Form

**At the moment only Winows/Form is available (and need more testing. Please do not use for production!)**

### Installation

``` 
npm install --save qlik-sense-authenticate
```

Once the installation is complete the package can be included in the project:

``` javascript
const qAuth = require('qlik-sense-authenticate');
```

### Authenticatoin Methods

**Windows/Form usage**

```javascript

    let config = {
        type: 'win',
        props: {
            url: 'https://my-qlik-sense-server',
            proxy: '(optional) if not the default Virtual Proxy is used',
            username: 'doman\username OR .\username',
            password: 'my-password',
            header: '(optional) it will default to X-Qlik-Session'
        }
    }
    
    let sessionId = await qAuth.login(config)
    // if all is ok:
    // { error: false, message: 11111111-2222-3333-4444-555555555555 }
```    
**Do not expose your `username` and `password`! Please use at least environment variables**.

The returned session can be passed as a `Cookie` on any other request which communicates with Qlik Sense

### Session re-use

On each successful authentication the package will store the session id in `session.txt` file in the current directory. 

Also on each use, the package will read this file (if exists) and using the sesson will check against Qlik Sense if the session is still active. If its not - will authenticate and generate new one (using the config object)

### Logout

The package provide `logout` method which will literally log out the current user (based on the session id) from Qlik Sense (all live sessions on any device will be terminated)

It's a bit radical approach but this is the only way I've found (without using the Proxy API which usually listen on port `4243` which is a bit funny. In the future will try and add a check if the Proxy is reachable and delete the specific session)

```javascript
let logout = await qAuth.logout(config)
```