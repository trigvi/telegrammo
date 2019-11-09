
let minilogger  = require("../../minilogger");
let settings    = require("../../../mysettings.json");



/**
 * Make sure /webhook requests come from a Telegram IP address
 *
 */
function fn(req, res, next) {
    if (req.url.toString().startsWith("/webhook")) {
        let ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
        if (!ip.startsWith("149.154.") && !ip.startsWith("91.108.")) {
            minilogger.print(`ERROR // Telegram /webhook request received from unknown ip ${ip}`);
            res.status(200);
            res.json({ message: "IP not whitelisted" });
            return;
        }
    }

    next();

}


// Expose module parts
module.exports = {
    fn: fn,
}
