require('dotenv').config({ path: './.env_win' })
require('dotenv').config({ path: './.env_header' })

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

    try {
        let docList = await engineTest(sessionId.message)
    } catch (e) {
        console.log(e.message)
    }
})()

const engineTest = async function (sessionId) {
    const session = enigma.create({
        schema,
        url: `wss://${process.env.QLIK_URL_ENGINE}/app/engineData`,
        createSocket: url => new WebSocket(url, {
            headers: {
                Cookie: `${process.env.QLIK_HEADER}=${sessionId}`
            }
        }),
    });

    session.on('traffic:received', function (data) {
        console.log('received:', data)
    });

    let global = await session.open()
    let docList = await global.getDocList()

    await session.close()

    return docList
};

