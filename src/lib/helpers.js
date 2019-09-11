const axios = require('axios');
const querystring = require('querystring');

const webRequest = {
    get: async function ({ url, headers }) {

        let xrfkey = generateXrfkey(16);

        headers['x-qlik-xrfkey'] = xrfkey

        let properties = {
            headers: headers,
            maxRedirects: 0,
            validateStatus: null
        }

        let response = await axios.get(`${url}/?xrfkey=${xrfkey}`, properties)

        return response

    },
    post: async function ({ url, headers, body }) {

        let response = await axios.post(url, body, headers)

        return response
    }
}

const generateXrfkey = function (length) {
    return [...Array(length)].map(i => (~~(Math.random() * 36)).toString(36)).join('')
}

const convertToFormData = function ({username, password}) {
    return querystring.stringify({
        username: username,
        pwd: password
    })
}



module.exports = {
    webRequest,
    generateXrfkey,
    convertToFormData
}