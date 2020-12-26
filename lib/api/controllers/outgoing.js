
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

    try {

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
        let subbot = await db.Subbot.findOne({
            where: {
                tgBotUsername: tgBotUsername,
                subbotIdentifier: subbotIdentifier,
            },
        });

        if (subbot == null || subbot.isActive != true) {
            res.status(400);
            res.json({ "code": 400, "message": "Invalid or inactive Subbot", });
            return;
        }


        // Fetch Subbot's Subscriptions
        let subscriptions = await db.Subscription.findAll({
            where: {
                subbotId: subbot.subbotId,
            },
        });


        // Create Outgoing entry
        let success = await db.Outgoing.create({
            tgBotUsername:  tgBotUsername,
            subbotId:       subbot.subbotId,
            text:           text,
            photoUrl:       photoUrl,
        });
        let outgoing = success.dataValues;
        minilogger.print(`Outgoing created // ` + JSON.stringify(outgoing));


        // We do not trigger Telegram sending now.
        // We add one OutgoingQueue record for each message to send,
        // basically one for each Subscription. A separate process does
        // the sending in a way that complies with Telegram API limits.
        let outgoingQueueObjects = [];
        for (let subscription of subscriptions) {
            outgoingQueueObjects.push({
                details: JSON.stringify({
                    outgoing:       outgoing,
                    subbot:         subbot,
                    subscription:   subscription,
                }),
            });
        }

        await db.OutgoingQueue.bulkCreate(outgoingQueueObjects);

    } catch (err) {

        res.status(500);
        res.json({ "code": 500, "message": `Internal error`, });
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;

    }


    // Send API response
    res.status(201);
    res.json({ "code": 201, "message": "Queued", });

}


// Expose module parts
module.exports = {
    post:   post,
}
