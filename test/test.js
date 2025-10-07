import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { readFileSync } from "fs";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

import qAuth from "../dist/index.js";

// const qAuth = require("../src/index");

import enigma from "enigma.js";
import WebSocket from "ws";
// const enigma = require("enigma.js");
// const WebSocket = require("ws");
// const schema = require("enigma.js/schemas/12.20.0.json");
const schema = JSON.parse(
  readFileSync("../node_modules/enigma.js/schemas/12.1306.0.json")
);

(async function () {
  let config = {
    win: {
      type: "win",
      sessionId: "",
      props: {
        url: process.env.QLIK_URL,
        proxy: process.env.QLIK_PROXY,
        username: process.env.QLIK_USER,
        password: process.env.QLIK_PASSWORD,
        header: process.env.QLIK_HEADER,
      },
    },
    header: {
      type: "header",
      props: {
        url: process.env.QLIK_URL,
        proxy: process.env.QLIK_PROXY,
        username: process.env.QLIK_USER,
        header: process.env.QLIK_HEADER,
        header_auth: process.env.QLIK_HEADER_AUTH,
      },
    },
    jwt: {
      type: "jwt",
      props: {
        url: process.env.QLIK_URL,
        proxy: process.env.QLIK_PROXY,
        header: process.env.QLIK_HEADER,
        token: process.env.QLIK_TOKEN,
      },
    },
  };

  let sessionId = await qAuth.login(config.win);

  try {
    let docList = await engineTest(sessionId.message);
    console.log(docList);
  } catch (e) {
    console.log(e.message);
  }
})();

const engineTest = async function (sessionId) {
  const proxy = process.env.QLIK_PROXY ? `/${process.env.QLIK_PROXY}` : "";
  const session = enigma.create({
    schema,
    url: `wss://${process.env.QLIK_URL_ENGINE}${proxy}/app/engineData`,
    createSocket: (url) =>
      new WebSocket(url, {
        headers: {
          Cookie: `${process.env.QLIK_HEADER}=${sessionId}`,
        },
      }),
  });

  session.on("traffic:received", function (data) {
    console.log("received:", data);
  });

  let global = await session.open();
  let docList = await global.getDocList();

  await session.close();

  return docList;
};
