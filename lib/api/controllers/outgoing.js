
const path        = require("path");

const db          = require("../../db");
const minilogger  = require("../../minilogger");
const telegram    = require("../../telegram");


/**
 * POST
 *
 * @param {object} [req]
 * @param {object} [res]
 */
async function post(req, res) {

    let functionName = "post";
    let moduleName = path.basename(__filename);


    // Validate input
    let tgBotUsername       = req.body.tgBotUsername || null;
    let subbotIdentifier    = req.body.subbotIdentifier || null;
    let text                = req.body.text || "";

    if (
        tgBotUsername == null
        || tgBotUsername.trim() == ""
        || subbotIdentifier == null
        || subbotIdentifier.trim() == ""
        || text == null
        || text.trim() == ""
    ) {
        res.status(400);
        res.json({ "code": 400, "message": "Required field(s) missing", });
        return;
    }


    // Make sure Subbot exists and is active
    let subbot = null;
    try {
        subbot = await db.Subbot.findOne({
            where: {
                tgBotUsername: tgBotUsername,
                subbotIdentifier: subbotIdentifier,
            },
        });
    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;
    }

    if (subbot == null || subbot.isActive != true) {
        res.status(400);
        res.json({ "code": 400, "message": "Invalid or inactive Subbot", });
        return;
    }


    // Make sure Subbot has Subscriptions
    let subscriptions = [];
    try {
        subscriptions = await db.Subscription.findAll({
            where: {
                subbotId: subbot.subbotId,
            },
        });
    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;
    }

    if (subscriptions.length == 0) {
        res.status(400);
        res.json({ "code": 400, "message": "Subbot does not have any Subscription", });
        return;
    }


    // Create Outgoing entry
    let outgoing = null;
    try {

        success = await db.Outgoing.create({
            tgBotUsername:  tgBotUsername,
            subbotId:       subbot.subbotId,
            text:           text,
        });

        outgoing = success.dataValues;
        minilogger.print(`Outgoing created // ` + JSON.stringify(outgoing));

    } catch(err) {

        res.status(500);
        res.json({ "code": 500, "message": `Database error`, });
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;

    }


    // Send API response
    res.json({
        "code": 200,
        "message": "Created",
        "data": outgoing,
    });


    // Send Telegram message to all Subbot's Subscriptions
    for (let susbcription of subscriptions) {
        telegram.sendMessage(
            subbot,
            susbcription,
            text
        );
    }

}


// Expose module parts
module.exports = {
    post:   post,
}
