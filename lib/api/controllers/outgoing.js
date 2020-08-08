
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
    let text                = req.body.text || null;
    let photoUrl            = req.body.photoUrl || null;

    if (
        tgBotUsername == null
        || tgBotUsername.trim() == ""
        || subbotIdentifier == null
        || subbotIdentifier.trim() == ""
        || (text == null && photoUrl == null)
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


    // Fetch Subbot's Subscriptions
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
        res.json({
            "code": 200,
            "message": "OK",
        });
    }


    // Create Outgoing entry
    let outgoing = null;
    try {

        let success = await db.Outgoing.create({
            tgBotUsername:  tgBotUsername,
            subbotId:       subbot.subbotId,
            text:           text,
            photoUrl:       photoUrl,
        });

        outgoing = success.dataValues;
        minilogger.print(`Outgoing created // ` + JSON.stringify(outgoing));

    } catch(err) {

        res.status(500);
        res.json({ "code": 500, "message": `Database error`, });
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;

    }


    // We do not actually trigger Telegram sending now.
    // We add one OutgoingQueue record for each message to send,
    // basically one for each Subscription. A separate process does
    // the sending in a way that complies with Telegram API limits.
    for (let subscription of subscriptions) {
        try {

            let details = {
                outgoing:       outgoing,
                subbot:         subbot,
                subscription:   subscription,
            }

            let success = await db.OutgoingQueue.create({
                details: JSON.stringify(details),
            });

        } catch(err) {
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
            return;
        }
    }


    // Send API response
    res.json({
        "code": 200,
        "message": "Queued",
    });

}


// Expose module parts
module.exports = {
    post:   post,
}
