const auth = require('./lib/authenticate');

const lib = async function (config) {

    let isValidConfig = await validateConfig(config)

    if (isValidConfig.isValid == false) {
        return {
            error: true,
            message: isValidConfig.message
        }
    }

    let b = await auth(config)

    return b
}

async function validateConfig(config) {

    let validAuthTypes = ['jwt', 'cert', 'header', 'win']

    if (validAuthTypes.indexOf(config.type.toLowerCase()) == -1) {
        return {
            isValid: false,
            message: `No valid authentication type found. Valid values: ${validAuthTypes.join(',')}`
        }
    }

    return { isValid: true }
}

module.exports = async function (config) {
    return await lib(config)
}