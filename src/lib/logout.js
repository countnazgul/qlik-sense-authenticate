const helpers = require('./helpers');

const logout = async function (config, sessionId = false) {

    if (!sessionId) {
        sessionId = helpers.session.read()
    }

    if (sessionId.error) {
        return { error: true, message: 'SessionId was not provided as a parameter and session.txt file do not exists' }
    }

    let response = await helpers.webRequest.delete({
        url: `${config.url}/qps/user`,
        headers: {
            Cookie: `${config.header}=${sessionId.message}`
        }
    })

    try {
        helpers.session.delete()
    } catch (e) {

    }

    return { error: false, message: 'user was logout' }
}

module.exports = logout