const helpers = require("../helpers");
const url = require("url");

const win = async function (config) {
  // Windows/Form authentication is few steps process
  // which at the end returns session Id (if authentication is successful):
  //  * navigate to the main page and stops the redirect
  //  * extract the redirect location from the response headers
  //  * make request to the login url, providing the user/pass in the body
  //  * if ok - extract the session Id from the set-session header

  const initialChecksSession = await initialChecks.combined(config);

  if (initialChecksSession.error) {
    // if there is no session file
    // or the saved session is no longer valid
    // start the process to get new session
    const loginLocation = await firstRequest(config);

    if (loginLocation.error) return loginLocation;

    config.loginLocation = loginLocation.message.headers.location;

    const sessionId = await secondRequest(config);

    if (sessionId.error) return sessionId;

    helpers.session.write(sessionId.message);

    return sessionId;
  }

  return { error: false, message: initialChecksSession.message };
};

const initialChecks = {
  savedSession: function () {
    return helpers.session.read();
  },
  sessionIsActive: async function (config, sessionId) {
    const checkSessionRequest = await helpers.webRequest.get({
      url: `${config.url.replace("/hub/", "")}/qps/user`,
      headers: { Cookie: `${config.header}=${sessionId}` },
    });

    if (checkSessionRequest.error == true) return checkSessionRequest;

    if (checkSessionRequest.message.data.session == "inactive")
      return { error: true, message: "session is expired" };

    return { error: false, message: sessionId };
  },
  combined: async function (config) {
    const savedSession = initialChecks.savedSession();

    if (savedSession.error == true)
      return { error: true, message: savedSession.message };

    const isSessionActive = await this.sessionIsActive(
      config,
      savedSession.message
    );

    if (isSessionActive.error == true) {
      return { error: true, message: isSessionActive.message };
    }

    return savedSession;
  },
};

async function firstRequest(config) {
  // Its not actually a Windows authentication
  // rather that its a Form authentication
  // "converting" from Windows to Form is done via the User-Agent header
  // Trying to make proper Windows request from Node is a bit of a pain ... for now
  const response = await helpers.webRequest.get({
    url: config.url,
    headers: { "User-Agent": "Form" },
  });

  return response;
}

async function secondRequest(config) {
  // split the url params to get the correct xrfkey
  const urlParams = url.parse(config.loginLocation, {
    parseQueryString: true,
  }).query;

  // generate the request option
  //  * content type should be urlencoded
  //  * use the correct xrfkey

  if (!urlParams.xrfkey) urlParams.xrfkey = helpers.generateXrfkey(16);

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "x-qlik-xrfkey": urlParams.xrfkey,
  };

  // convert the body (user and pass) to url encoded values
  const queryCredentials = helpers.convertToFormData({
    username: config.username,
    password: config.password,
  });

  // make the request
  const response = await helpers.webRequest.post({
    url: `${config.loginLocation}`,
    headers,
    body: queryCredentials,
  });

  if (response.error) return response.error;

  // if there is a response but there is no cookie
  // the the authentication was not successful - wrong user/pass
  if (!response.message.headers["set-cookie"])
    return {
      error: true,
      message: "Authentication failed. Wrong username and/or password?",
    };

  // extract the session id from the response headers
  const sessionId = helpers.extractSessionId({
    headers: response.message.headers,
    config,
  });

  return sessionId;
}

module.exports = async function (config) {
  return await win(config);
};
