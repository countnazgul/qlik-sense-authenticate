const auth = require('./lib/authenticate');
const logout = require('./lib/logout');
const helpers = require('./lib/helpers')

const lib = {
    login: async function (config) {

        config.props.url = helpers.prepareURL(config)

        let isValidConfig = await validateConfig(config)

        if (isValidConfig.isValid == false) {
            return {
                error: true,
                message: isValidConfig.message
            }
        }

        let b = await auth(config)

        return b
    },
    logout: async function (config) {
        config.props.url = helpers.prepareURL(config)
        return await logout(config.props)
    }
}

async function validateConfig(config) {

    // let validAuthTypes = ['jwt', 'cert', 'header', 'win']
    let validAuthTypes = ['win']

    if (validAuthTypes.indexOf(config.type.toLowerCase()) == -1) {
        return {
            isValid: false,
            message: `No valid authentication type found. Valid values: ${validAuthTypes.join(',')}`
        }
    }

    return { isValid: true }
}

module.exports = lib