require('dotenv').config()

const qAuth = require('../src/index');
// const qAuth = require('../src/index-test');

(async function () {

    let config = {
        type: 'win',
        props: {
            url: process.env.URL,
            username: process.env.USER,
            password: process.env.PASSWORD,
            header: process.env.HEADER
        }
    }

    // let sessionId = await qAuth.login(config)
    let logout = await qAuth.logout(config)
    // qAuth.func1(config); // Hallo David
    // qAuth.func2(config); // Goodbye David
    let a = 1
})()