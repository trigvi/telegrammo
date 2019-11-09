
let path            = require("path");

let db              = require("../../db");
let minilogger      = require("../../minilogger");
let randomString    = require("../../random_string");
let settings        = require("../../../mysettings.json");


/**
 * GET - Subbot list
 *
 * @param {object} [req]
 * @param {object} [res]
 * 
 * @return {null}
 */
function getList(req, res) {

    let functionName = "getList";
    let moduleName = path.basename(__filename);

    try {
        getListLogic(req, res);
    } catch(err) {
        res.status(500);
        res.json({ "code": 500, "message": `${err.message}`, });
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
    }

}


/**
 * POST
 *
 * @param {object} [req]
 * @param {object} [res]
 * 
 * @return {null}
 */
function post(req, res) {

    let functionName = "post";
    let moduleName = path.basename(__filename);

    try {
        postLogic(req, res);
    } catch(err) {
        res.status(500);
        res.json({ "code": 500, "message": `${err.message}`, });
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
    }

}


/**
 * DELETE
 *
 * @param {object} [req]
 * @param {object} [res]
 * 
 * @return {null}
 */
function del(req, res) {

    let functionName = "del";
    let moduleName = path.basename(__filename);

    try {
        delLogic(req, res);
    } catch(err) {
        res.status(500);
        res.json({ "code": 500, "message": `${err.message}`, });
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
    }

}


/**
 * @param {object} [req]
 * @param {object} [res]
 * 
 * @return {null}
 */
async function getListLogic(req, res) {

    let functionName = "getListLogic";
    let moduleName = path.basename(__filename);


    // Fetch Subbot list
    let subbots = [];
    try {
        subbots = await db.Subbot.findAll({
            order: [
                ["tgBotUsername", "ASC"],
                ["description", "ASC"],
            ],
        });
        // subbots.push(success.dataValues);
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
 * @param {object} [req]
 * @param {object} [res]
 * 
 * @return {null}
 */
async function postLogic(req, res) {

    let functionName = "postLogic";
    let moduleName = path.basename(__filename);


    // Validate input
    let tgBotUsername       = req.body.tgBotUsername || null;
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
    let subbotIdentifier = null;
    while (1 == 1) {

        subbotIdentifier = randomString.generate(12);
        try {
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
 * @param {object} [req]
 * @param {object} [res]
 * 
 * @return {null}
 */
async function delLogic(req, res) {

    let functionName = "delLogic";
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
            subbot.destroy();
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
