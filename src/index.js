const auth = require('./lib/authenticate');
const logout = require('./lib/logout');
const helpers = require('./lib/helpers')

const lib = {
    login: async function (config) {

        // check if the config obj is containing all the required keys
        let isValidConfig = await validateConfig(config)

        if (isValidConfig.error) {
            return isValidConfig
        }

        // normalize the url - limit the troubles ahead
        config.props.url = helpers.prepareURL(config)

        // check for header if not set the default one
        config.props.header = helpers.prepareHeader(config)
        
        let response = await auth(config)

        return response
    },
    logout: async function (config) {
        config.props.url = helpers.prepareURL(config)
        config.props.header = helpers.prepareHeader(config)
        return await logout(config.props)
    }
}

async function validateConfig(config) {

    //'jwt', 'cert', 'header' -> to follow
    let validAuthTypes = ['win', 'header']

    if (validAuthTypes.indexOf(config.type.toLowerCase()) == -1) {
        return {
            error: true,
            message: `No valid authentication type found. Valid values: ${validAuthTypes.join(',')}`
        }
    }

    return { error: false, message: 'Config looks valid' }
}

module.exports = lib