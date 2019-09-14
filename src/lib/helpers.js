const URL = require('url');
const fs = require('fs');
const axios = require('axios');
const querystring = require('querystring');

const extractDomain = function (config) {
    let parsed = URL.parse(config.props.url)

    return `${parsed.protocol}//${parsed.hostname}`
}

const prepareURL = function (config) {

    let domain = extractDomain(config)

    let readyURL = `${domain}/hub/`

    if (config.props.proxy) {
        readyURL = `${domain}/${config.props.proxy}/hub/`
    }

    return readyURL
}

const prepareHeader = function (config) {

    if (config.props.header) {
        return config.props.header
    }

    return 'X-Qlik-Session'
}

const webRequest = {
    get: async function ({ url, headers }) {

        var url_parts = URL.parse(url, true);

        let xrfkey = generateXrfkey(16);

        headers['x-qlik-xrfkey'] = xrfkey

        if (!url_parts.xrfkey) {
            url = `${url}?xrfkey=${xrfkey}`
        }

        let properties = {
            headers: headers,
            maxRedirects: 0,
            validateStatus: null
        }

        try {
            let response = await axios.get(`${url}`, properties)

            if (response.status == 301) {
                let newResponse = await axios.get(`${response.headers.location}`, properties)

                return { error: false, message: newResponse }
            }

            return { error: false, message: response }
        } catch (e) {
            return { error: true, message: e.message }
        }

    },
    post: async function ({ url, headers, body }) {

        try {
            let response = await axios.post(url, body, headers)

            return { error: false, message: response }
        } catch (e) {
            return { error: true, message: e.message }
        }
    },
    delete: async function ({ url, headers }) {
        try {
            await axios.delete(url, headers)
        } catch (e) {

        }

        return { error: false, message: 'session.txt was deleted or was not exist' }
    }
}

const generateXrfkey = function (length) {
    return [...Array(length)].map(i => (~~(Math.random() * 36)).toString(36)).join('')
}

const convertToFormData = function ({ username, password }) {
    return querystring.stringify({
        username: username,
        pwd: password
    })
}

const session = {
    read: function () {

        if (fs.existsSync("./session.txt")) {
            let readString = fs.readFileSync('./session.txt').toString()

            let isValidGUID = session.validate(readString)

            if (isValidGUID.error) {
                return isValidGUID
            }

            return { error: false, message: readString }
        }

        return { error: true, message: 'sessions file not found' }
    },
    delete: function () {
        if (fs.existsSync("./session.txt")) {
            fs.unlinkSync('./session.txt')
            return { error: false, message: 'session file removed' }
        }

        return { error: true, message: 'sessions file not found' }
    },
    write: function (sessionId) {
        fs.writeFileSync('./session.txt', sessionId)

        return { error: false, message: 'session id was saved' }
    },
    validate: function (sessionId) {
        let pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!pattern.test(sessionId)) {
            return { error: true, message: 'loaded string do NOT looks like session id' }
        }

        return { error: false, message: 'loaded string looks like session id' }
    }
}

const extractSessionId = function ({ headers, config }) {
    // filter the set-cookie headers
    // and find the one that have the cookie header (passed from the main config)
    // once the header is found then extract and return only the session ID
    // the returned set-cookie header is in the following format:
    // "X-Qlik-Session=f2b68d0c-e0f0-47fb-8fd6-60a95237db78; Path=/; HttpOnly; Secure"
    // as a result the function will return only: f2b68d0c-e0f0-47fb-8fd6-60a95237db78
    try {
        let cookieSessionId = headers['set-cookie'].filter(function (c) {
            return c.indexOf(config.header) > -1
        })[0].split(';')[0].split(`${config.header}=`)[1]

        // if (cookieSessionId.indexOf(':') > -1) {
        //     cookieSessionId = cookieSessionId.split(':')[0].replace('{', '').replace('}', '')
        // }

        return { error: false, message: cookieSessionId }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

module.exports = {
    webRequest,
    generateXrfkey,
    convertToFormData,
    session,
    prepareURL,
    prepareHeader,
    extractSessionId
}