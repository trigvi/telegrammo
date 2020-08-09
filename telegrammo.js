
const bodyParser          = require("body-parser");
const cors                = require("cors")
const express             = require("express");

const backgroundWorkers   = require("./lib/background-workers");
const cOutgoing           = require("./lib/api/controllers/outgoing");
const cSubbot             = require("./lib/api/controllers/subbot");
const cWebhook            = require("./lib/api/controllers/webhook");
const db                  = require("./lib/db");
const minilogger          = require("./lib/minilogger");
const mAuthentication     = require("./lib/api/middleware/authentication");
const mWebhookWhitelist   = require("./lib/api/middleware/webhook_whitelist");
const settings            = require("./mysettings.json");


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
    await backgroundWorkers.run();


    // API: start
    let api = express();
    api.listen(port, () => {
        minilogger.print(`API started on port ${port}`);
    });


    // API: middleware
    api.use(cors());
    api.use(bodyParser.json());


    // API: router middleware
    let router = express.Router();
    router.use(mWebhookWhitelist.fn);

    if (authenticationRequired) {
        router.use(mAuthentication.fn);
    }


    // API: router
    api.use("/api/v1.0/", router);

    router.get       ("/",                       (req, res, next) => { res.json({"msg":"Hello"}); });
    router.post      ("/outgoing",               cOutgoing.post);
    router.get       ("/subbot",                 cSubbot.getList);
    router.post      ("/subbot",                 cSubbot.post);
    router.delete    ("/subbot",                 cSubbot.del);
    router.post      ("/webhook/:tgBotUsername", cWebhook.post);

}
