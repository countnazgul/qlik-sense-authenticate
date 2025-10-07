const URL = require("url");
const fs = require("fs");
const axios = require("axios");
const https = require("https");

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: false
  })
});

const extractDomain = function (config) {
  const parsed = URL.parse(config.props.url, true);

  return `${parsed.protocol}//${parsed.hostname}`;
};

const prepareURL = function (config) {
  const domain = extractDomain(config);

  let readyURL = `${domain}/hub/`;

  if (config.props.proxy) {
    readyURL = `${domain}/${config.props.proxy}/hub/`;
  }

  return readyURL;
};

const prepareHeader = function (config) {
  if (config.props.header) {
    return config.props.header;
  }

  return "X-Qlik-Session";
};

const webRequest = {
  get: async function ({ url, headers }) {
    var url_parts = URL.parse(url, true);

    const xrfkey = generateXrfkey(16);

    headers["x-qlik-xrfkey"] = xrfkey;

    if (!url_parts.xrfkey) {
      url = `${url}?xrfkey=${xrfkey}`;
    }

    try {
      const response = await instance({
        method: "get",
        url,
        headers,
        maxRedirects: 0,
        validateStatus: null
      })

      if (response.status == 301) {
        const newResponse = await instance({
          method: "get",
          url: response.headers.location,
          headers,
          maxRedirects: 0,
          validateStatus: null
        })

        return { error: false, message: newResponse };
      }

      return { error: false, message: response };
    } catch (e) {
      return { error: true, message: e.message };
    }
  },
  post: async function ({ url, headers, body }) {
    try {
      const response = await instance({
        method: "post",
        url,
        headers,
        data: body
      })

      return { error: false, message: response };
    } catch (e) {
      return { error: true, message: e.message };
    }
  },
  delete: async function ({ url, headers }) {
    try {
      await instance({
        method: "delete",
        url,
        headers
      })
    } catch (e) { }

    return {
      error: false,
      message: "session.txt was deleted or was not exist",
    };
  },
};

const generateXrfkey = function (length) {
  return [...Array(length)]
    .map((i) => (~~(Math.random() * 36)).toString(36))
    .join("");
};

const convertToFormData = function ({ username, password }) {
  const p = new URLSearchParams()
  p.append("username", username)
  p.append("pwd", password)
  return p.toString()
};

const session = {
  read: function () {
    if (fs.existsSync("./session.txt")) {
      const readString = fs.readFileSync("./session.txt").toString();

      const isValidGUID = session.validate(readString);

      if (isValidGUID.error) {
        return isValidGUID;
      }

      return { error: false, message: readString };
    }

    return { error: true, message: "sessions file not found" };
  },
  delete: function () {
    if (fs.existsSync("./session.txt")) {
      fs.unlinkSync("./session.txt");
      return { error: false, message: "session file removed" };
    }

    return { error: true, message: "sessions file not found" };
  },
  write: function (sessionId) {
    fs.writeFileSync("./session.txt", sessionId);

    return { error: false, message: "session id was saved" };
  },
  validate: function (sessionId) {
    const pattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!pattern.test(sessionId)) {
      return {
        error: true,
        message: "Loaded string do NOT looks like session id",
      };
    }

    return { error: false, message: "loaded string looks like session id" };
  },
};

const extractSessionId = function ({ headers, config }) {
  // filter the set-cookie headers
  // and find the one that have the cookie header (passed from the main config)
  // once the header is found then extract and return only the session ID
  // the returned set-cookie header is in the following format:
  // "X-Qlik-Session=f2b68d0c-e0f0-47fb-8fd6-60a95237db78; Path=/; HttpOnly; Secure"
  // as a result the function will return only: f2b68d0c-e0f0-47fb-8fd6-60a95237db78

  if (!headers["set-cookie"])
    return {
      error: true,
      message: `No cookies returned. Wrong credentials?`,
    };

  if (headers["set-cookie"].length == 0)
    return {
      error: true,
      message: `There is no cookie for "${config.header}" header. Wrong session header value?`,
    };

  try {
    const sessionCookie = headers["set-cookie"].filter(function (c) {
      return c.indexOf(config.header) > -1;
    });

    if (sessionCookie.length == 0)
      return {
        error: true,
        message: `There is no sessionID for "${config.header}" header. Wrong session header value?`,
      };

    const cookieSessionId = sessionCookie[0]
      .split(";")[0]
      .split(`${config.header}=`)[1];

    if (!cookieSessionId)
      return {
        error: true,
        message: `There is no sessionID for "${config.header}" header. Wrong session header value?`,
      };

    return { error: false, message: cookieSessionId };
  } catch (e) {
    return { error: true, message: e.message };
  }
};

module.exports = {
  webRequest,
  generateXrfkey,
  convertToFormData,
  session,
  prepareURL,
  prepareHeader,
  extractSessionId,
};
