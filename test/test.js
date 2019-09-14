require('dotenv').config()

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const qAuth = require('../src/index');
const enigma = require('enigma.js');
const WebSocket = require('ws');
const schema = require('enigma.js/schemas/12.20.0.json');


(async function () {

    let config = {
        win: {
            type: 'win',
            props: {
                url: process.env.QLIK_URL,
                proxy: process.env.QLIK_PROXY,
                username: process.env.QLIK_USER,
                password: process.env.QLIK_PASSWORD,
                header: process.env.QLIK_HEADER
            }

        },
        header: {
            type: 'header',
            props: {
                url: process.env.QLIK_URL,
                proxy: process.env.QLIK_PROXY,
                username: process.env.QLIK_USER,
                header: process.env.QLIK_HEADER,
                header_auth: process.env.QLIK_HEADER_AUTH
            }
        }
    }

    let sessionId = await qAuth.login(config.header)

    console.log(sessionId)

    await engineTest(sessionId.message)

    // let logout = await qAuth.logout(config)    
})()

const engineTest = async function (sessionId) {
    const session = enigma.create({
        schema,
        url: `wss://${process.env.QLIK_URL_ENGINE}/app/engineData`,
        createSocket: url => new WebSocket(url, {
            headers: {
                Cookie: `${process.env.QLIK_HEADER}=${sessionId.message}`
            }
        }),
    });

    session.on('traffic:received', function (data) {
        console.log('received:', data)
    });

    try {
        let global = await session.open()
        let docList = await global.getDocList()

        console.log(docList)

        await session.close()
    } catch (e) {
        let a = 1
    }
}