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

                return newResponse
            }

            return response
        } catch (e) {
            console.log(e.message)
        }

    },
    post: async function ({ url, headers, body }) {

        try {
            let response = await axios.post(url, body, headers)

            return response
        } catch (e) {
            let a = 1
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
            return { error: false, message: fs.readFileSync('./session.txt').toString() }
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
    }
}

module.exports = {
    webRequest,
    generateXrfkey,
    convertToFormData,
    session,
    prepareURL
}