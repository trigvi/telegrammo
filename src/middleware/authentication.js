
const minilogger  = require("../minilogger");
const settings    = require("../../mysettings.json");


/**
 * Authenticate through token in request header
 *
 */
function fn(req, res, next) {

    // Token authentication not needed for /webhook requests,
    // as they come directly from Telegram
    if (req.url.toString().startsWith("/webhook")) {
        next();
        return;
    }

    // Valid token must be provided either through request header or querystring
    let headerToken = req.headers["access-token"];
    let queryToken = req.query.accessToken;
    const token = headerToken || queryToken || null;
    if (token && settings["api"]["tokens"].indexOf(token) != -1) {
        next();
        return;
    }

    // Token not received or invalid. Return error response.
    let ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    minilogger.print(`ERROR // Missing or invalid access token for ${req.url} // IP ${ip}`);
    res.status(403);
    res.json({ message: "Invalid Access-Token" });

}


// Expose module parts
module.exports = {
    fn: fn,
}
