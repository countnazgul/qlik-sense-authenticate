require('dotenv').config()

const qAuth = require('../src/index');

(async function () {

    let config = {
        type: 'win',
        props: {
            url: process.env.QLIK_URL,
            proxy: process.env.QLIK_PROXY,
            username: process.env.QLIK_USER,
            password: process.env.QLIK_PASSWORD,
            header: process.env.QLIK_HEADER
        }
    }

    let sessionId = await qAuth.login(config)
    // let logout = await qAuth.logout(config)
    console.log(sessionId)
})()