
var bodyParser          = require("body-parser");
var cors                = require("cors")
let express             = require("express");

let cOutgoing           = require("./lib/api/controllers/outgoing");
let cSubbot             = require("./lib/api/controllers/subbot");
let cWebhook            = require("./lib/api/controllers/webhook");
let db                  = require("./lib/db");
let minilogger          = require("./lib/minilogger");
let mAuthentication     = require("./lib/api/middleware/authentication");
let mWebhookWhitelist   = require("./lib/api/middleware/webhook_whitelist");
let settings            = require("./mysettings.json");


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


// DB: synchronise models
db.sync().then(
    function(good) {
        if (good !== true) {
            process.exit();
        }
    },
    function(err) {
        process.exit();
    }
);


// API: start
let app = express();
app.listen(port, () => {
    minilogger.print(``);
    minilogger.print(`API started on port ${port}`);
});


// API: middleware
app.use(cors());
app.use(bodyParser.json());


// API: router middleware
let router = express.Router();
router.use(mWebhookWhitelist.fn);

if (authenticationRequired) {
    router.use(mAuthentication.fn);
}


// API: router
app.use("/api/v1.0/", router);

router.get       ("/",                       (req, res, next) => { res.json({"msg":"Hello"}); });
router.post      ("/outgoing",               cOutgoing.post);
router.get       ("/subbot",                 cSubbot.getList);
router.post      ("/subbot",                 cSubbot.post);
router.delete    ("/subbot",                 cSubbot.del);
router.post      ("/webhook/:tgBotUsername", cWebhook.post);

