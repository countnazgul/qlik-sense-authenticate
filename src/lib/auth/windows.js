const helpers = require('../helpers')
const url = require('url');

const win = async function (config) {
    // Windows/Form authentication is few steps process
    // which at the end returns session Id (if authentication is successful):
    //  * navigate to the main page and stops the redirect 
    //  * extract the redirect location from the response headers
    //  * make request to the login url, providing the user/pass in the body
    //  * if ok - extract the session Id from the set-session header


    let initialChecksSession = await initialChecks.combined(config)

    if (initialChecksSession.error) {
        let loginLocation = await firstRequest(config)
        config.loginLocation = loginLocation.replace(/\/$/, "");
        let sessionId = await secondRequest(config)

        helpers.session.write(sessionId)

        return { error: false, message: sessionId }
    }

    return { error: false, message: initialChecksSession.message }
}

const initialChecks = {
    savedSession: function () {
        let sessionFileExists = helpers.session.read()

        if (sessionFileExists.error) {
            return { error: true, message: sessionFileExists.message }
        } else {
            return { error: false, message: sessionFileExists.message }
        }
    },
    sessionIsActive: async function (config, sessionId) {
        let checkSessionRequest = await helpers.webRequest.get({
            url: `${config.url}/qps/user`,
            headers: { 'Cookie': `${config.header}=${sessionId}` }
        })

        // if (!checkSessionRequest.data.session) {
        //     return { error: true, message: 'session is expired' }
        // }

        if (checkSessionRequest.data.session == "inactive") {
            return { error: true, message: 'session is expired' }
        }

        return { error: false, message: sessionId }
    },
    combined: async function (config) {

        let savedSession = initialChecks.savedSession()

        if (savedSession.error == true) {
            return { error: true, message: savedSession.message }
        }

        let isSessionActive = await this.sessionIsActive(config, savedSession.message)

        if (isSessionActive.error == true) {
            return { error: true, message: isSessionActive.message }
        }

        return savedSession
    }
}

async function firstRequest(config) {
    // Its not actually a Windows authentication
    // rather that its a Form authentication
    // "converting" from Windows to Form is done via the User-Agent header
    // Trying to make proper Windows request from Node is a bit of a pain ... for now
    try {
        let response = await helpers.webRequest.get({
            url: config.url,
            headers: { 'User-Agent': 'Form' }
        })

        return response.headers.location
    } catch (e) {
        console.log(e.message)
    }
}

async function secondRequest(config) {
    // split the url params to get the correct xrfkey
    let urlParams = url.parse(config.loginLocation, { parseQueryString: true }).query

    // generate the request option
    //  * content type should be urlencoded
    //  * use the correct xrfkey

    if (!urlParams.xrfkey) {
        urlParams.xrfkey = helpers.generateXrfkey(16)
    }

    let reqOptions = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-qlik-xrfkey": urlParams.xrfkey
        }
    }

    // convert the body (user and pass) to url encoded values
    let queryCredentials = helpers.convertToFormData({
        username: config.username,
        password: config.password
    })

    // make the request
    let response = await helpers.webRequest.post({
        url: `${config.loginLocation}`,
        headers: reqOptions,
        body: queryCredentials
    })

    // extract the session id from the response headers
    let sessionId = extractSessionId({ headers: response.headers, config })

    return sessionId
}

function extractSessionId({ headers, config }) {
    // filter the set-cookie headers
    // and find the one that have the cookie header (passed from the main config)
    // once the header is found then extract and return only the session ID
    // the returned set-cookie header is in the following format:
    // "X-Qlik-Session=f2b68d0c-e0f0-47fb-8fd6-60a95237db78; Path=/; HttpOnly; Secure"
    // as a result the function will return only: f2b68d0c-e0f0-47fb-8fd6-60a95237db78
    let cookieSessionId = headers['set-cookie'].filter(function (c) {
        return c.indexOf(config.header) > -1
    })[0].split(';')[0].split(`${config.header}=`)[1]

    helpers.session.write(cookieSessionId)

    return cookieSessionId
}

module.exports = async function (config) {
    return await win(config)
}