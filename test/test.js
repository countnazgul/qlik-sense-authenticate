require('dotenv').config()

const qAuth = require('../src/index');

(async function () {

    let config = {
        type: 'win',
        saveSession: true,
        props: {
            url: process.env.URL,
            username: process.env.USER,
            password: process.env.PASSWORD,
            header: process.env.HEADER
        }
    }

    let sessionId = await qAuth(config)

    let a = 1
})()