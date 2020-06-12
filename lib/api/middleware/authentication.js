
const minilogger  = require("../../minilogger");
const settings    = require("../../../mysettings.json");


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

    // If valid token received, all good
    let token = req.headers["access-token"];
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
