
const path            = require("path");

const db              = require("../../db");
const minilogger      = require("../../minilogger");
const randomString    = require("../../random_string");
const settings        = require("../../../mysettings.json");


/**
 * getList
 *
 * @param {object} [req]
 * @param {object} [res]
 */
async function getList(req, res) {

    let functionName = "getList";
    let moduleName = path.basename(__filename);


    // Fetch Subbot list
    let subbots = [];
    try {

        success = await db.Subbot.findAll({
            order: [
                ["tgBotUsername", "ASC"],
                ["description", "ASC"],
            ],
        });

        for (let item of success) {
            let subbot = item.dataValues;
            subbot.subscriptionCount = await db.Subscription.count({
                where: {
                    subbotId: subbot.subbotId,
                },
            });
            subbots.push(subbot);
        }

    } catch(err) {
        res.status(500);
        res.json({ "code": 500, "message": `Database error`, });
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;
    }


    // Send API response
    res.json({
        "code": 200,
        "message": "",
        "data": subbots,
    });

}


/**
 * post
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
    let description         = req.body.description || "";

    if (tgBotUsername == null) {
        res.status(400);
        res.json({ "code": 400, "message": "Required field(s) missing", });
        return;
    }

    let isValidBot = null;
    try { isValidBot = settings["telegramBotsAllowed"][tgBotUsername]; } catch(err) {}
    if (isValidBot == null) {
        res.status(400);
        res.json({ "code": 400, "message": "Bot is not in our allowed list", });
        return;
    }


    // Generate unique identifier
    let tries = 0;
    while (1 == 1) {

        // If subbotIdentifier has not been provided or
        // if checked and there's already a Subbot with it:
        // generate a new random subbotIdentifier.
        if (subbotIdentifier == null || tries > 0) {
            subbotIdentifier = randomString.generate(12);
        }

        try {

            tries++;

            count = await db.Subbot.count({
                where: {
                    subbotIdentifier: subbotIdentifier,
                },
            });

            if (count == 0) {
                break;
            }

        } catch(err) {

            res.status(500);
            res.json({ "code": 500, "message": `Database error`, });
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
            return;

        }

    }


    // Create Subbot
    let subbot = null;
    try {

        success = await db.Subbot.create({
            tgBotUsername:        tgBotUsername,
            subbotIdentifier:     subbotIdentifier,
            description:          description,
        });

        subbot = success.dataValues;
        minilogger.print(`Subbot created // ` + JSON.stringify(subbot));

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
        "data": subbot,
    });

}


/**
 * del
 *
 * @param {object} [req]
 * @param {object} [res]
 */
async function del(req, res) {

    let functionName = "del";
    let moduleName = path.basename(__filename);


    // Validate input
    let tgBotUsername       = req.body.tgBotUsername || null;
    let subbotIdentifier    = req.body.subbotIdentifier || null;

    if (
        tgBotUsername == null
        || tgBotUsername.trim() == ""
        || subbotIdentifier == null
        || subbotIdentifier.trim() == ""
    ) {
        res.status(400);
        res.json({ "code": 400, "message": "Required field(s) missing", });
        return;
    }


    // Delete Subbot
    try {

        let subbot = await db.Subbot.findOne({
            where: {
                tgBotUsername: tgBotUsername,
                subbotIdentifier: subbotIdentifier,
            },
        });

        if (subbot) {
            await subbot.destroy();
        }

    } catch(err) {

        res.status(500);
        res.json({ "code": 500, "message": `Database error`, });
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;

    }


    // Send API response
    res.json({
        "code": 200,
        "message": "Deleted",
    });

}


// Expose module parts
module.exports = {
    del:        del,
    getList:    getList,
    post:       post,
}
