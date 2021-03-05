
const bodyParser            = require("body-parser");
const cors                  = require("cors")
const express               = require("express");
const fs                    = require('fs');

const background            = require("./src/background");
const rOutgoing             = require("./src/route/outgoing");
const rSubbot               = require("./src/route/subbot");
const rWebhook              = require("./src/route/webhook");
const db                    = require("./src/db");
const minilogger            = require("./src/minilogger");
const mAuthentication       = require("./src/middleware/authentication");
const mWebhookWhitelist     = require("./src/middleware/webhook_whitelist");
const settings              = require("./mysettings.json");


// Args: --port
let port = null;
for (let a of process.argv) {
    if (a.startsWith("--port")) {
        port = a.replace("--port=", "");
    }
}

if (port == null) {
    minilogger.print("The following argument is mandatory: --port=<PORT>");
    process.exit();
}


// Args: --noauth
let authenticationRequired = true;
if (process.argv.indexOf("--noauth") != -1) {
    authenticationRequired = false;
}


// Start!
start().catch(function(err) {
    minilogger.print(`START ERROR // ${err.message}`);
});

async function start() {

    // Sync db, start background workers
    minilogger.print(``);
    await db.sync();
    await background.run();


    // Web server: start
    let webserver = express();
    webserver.listen(port, () => {
        minilogger.print(`API started on port ${port}`);
    });


    // API: middleware
    webserver.use(cors());
    webserver.use(bodyParser.json());

    let apiRoutes = express.Router();
    let normalRoutes = express.Router();
    apiRoutes.use(mWebhookWhitelist.fn);

    if (authenticationRequired) {
        apiRoutes.use(mAuthentication.fn);
        normalRoutes.use(mAuthentication.fn);
    }

    webserver.use(settings["api"]["base_uri"], apiRoutes);
    webserver.use("", normalRoutes);

    apiRoutes.get       ("/",                          (req, res, next) => { res.json({"msg":"Hello"}); });
    apiRoutes.post      ("/outgoing",                  rOutgoing.post);
    apiRoutes.get       ("/subbot",                    rSubbot.getList);
    apiRoutes.post      ("/subbot",                    rSubbot.post);
    apiRoutes.delete    ("/subbot",                    rSubbot.del);
    apiRoutes.post      ("/webhook-set",               rWebhook.postWebhookSet);
    apiRoutes.post      ("/webhook/:tgBotUsername",    rWebhook.postWebhook);

    normalRoutes.get    ("/manually",                  (req, res, next) => { res.sendFile(`${__dirname}/src/manually.html`); });

}
