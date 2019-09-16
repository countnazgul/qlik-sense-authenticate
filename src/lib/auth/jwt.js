const helpers = require('../helpers')

const jwt = async function (config) {
    let headers = {}

    headers['Authorization'] = `Bearer ${config.token}`

    let response = await helpers.webRequest.get({
        url: config.url,
        headers: headers
    })

    if (response.error) {
        return response
    }

    let sessionId = helpers.extractSessionId({ headers: response.message.headers, config })

    sessionId.message = sessionId.message.replace(/{}/g, '')

    if (sessionId.error) {
        return sessionId
    }

    return sessionId
}

module.exports = async function (config) {
    return await jwt(config)
}