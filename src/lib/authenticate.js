const jwt = require('./auth/jwt');
const win = require('./auth/windows');

const doAuthenticate = async function (config) {

    if (config.type.toLowerCase() == 'jwt') {
        return await jwt(config.props)
    }

    if (config.type.toLowerCase() == 'win') {
        return await win(config.props)
    }

    return { error: 'The provided authentication type do no exists or its not supported' }

}


module.exports = async function (config) {
    return await doAuthenticate(config)
}