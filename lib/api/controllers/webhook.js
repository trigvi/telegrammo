
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


    // Send OK response to Telegram regardless of what we do next.
    // If we don't send OK response, Telegram will stop sending updates.
    res.status(200);
    res.json({ "code": 200, "message": `Good`, });


    // Determine source of interaction (group, channel, private, etc)
    let body        = req.body;
    let isDirect    = false;
    let isChannel   = false;
    let isGroup     = false;
    let tgChatId    = null;
    let tgName      = null;
    let text        = null;

    try {
        if (body.message.chat.type == "private") {
            text = body.message.text;
            tgChatId = body.message.chat.id.toString();
            isDirect = true;
            tgName = [];
            if (typeof body.message.chat.first_name != "undefined") {
                tgName.push(body.message.chat.first_name);
            }
            if (typeof body.message.chat.last_name != "undefined") {
                tgName.push(body.message.chat.last_name);
            }
            tgName = tgName.join(" ");
        }
    } catch {}

    try {
        if (body.message.chat.type == "group") {
            text = body.message.text;
            tgChatId = body.message.chat.id.toString();
            tgName = body.message.chat.title;
            isGroup = true;
        }
    } catch {}

    try {
        if (body.channel_post.chat.type == "channel") {
            text = body.channel_post.text;
            tgChatId = body.channel_post.chat.id.toString();
            tgName = body.channel_post.chat.title;
            isChannel = true;
        }
    } catch {}

    if (!isDirect && !isGroup && !isChannel) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // Could not determine interaction source // ` + JSON.stringify(body));
        return;
    }

    if (text == null) {
        return;
    }


    // Parse interaction text (determine Subbot, command, etc)
    let textChunk = text.replace(/ +/g, " ").trim().split(" ");
    let validCommands = ["/subscribe", "/subscriptions", "/unsubscribe"];
    let tgBotUsername  = null;
    let subbotIdentifier = null;
    let command = null;

    if (
        isDirect
        && textChunk[0] != null
        && textChunk[0].substring(0, 1) != "@"
    ) {
        // If direct interaction, prepend tgBotUsername.
        // We can then parse the interaction in the same
        // way we do when it originates from group/channel.
        textChunk.unshift(`@${req.params.tgBotUsername}`);
    }

    if (textChunk[0] != null && textChunk[0].startsWith("@")) {
        tgBotUsername = textChunk[0].substring(1, 9999);

        if (
            textChunk[1] != null
            && textChunk[1].startsWith("/")
            && validCommands.includes(textChunk[1])
        ) {
            command = textChunk[1];
            if (textChunk[2] != null) {
                subbotIdentifier = textChunk[2];
            }
        }
    }

    if (
        tgBotUsername == null
        || command == null
    ) {
        return;
    }


    // Execute command
    try {

        if (command == "/subscribe") {
            await createSubscription(
                tgBotUsername,
                subbotIdentifier,
                tgChatId,
                tgName,
                isDirect,
                isGroup,
                isChannel
            );

        } else if (command == "/subscriptions") {
            await showSubscriptions(
                tgBotUsername,
                tgChatId
            );

        } else if (command == "/unsubscribe") {
            await deleteSubscription(
                tgBotUsername,
                subbotIdentifier,
                tgChatId
            );
        }

    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
    }

}



/**
 * Create Subscription in db (associate Subbot with Telegram chat)
 *
 * @param {string}  [tgBotUsername]
 * @param {string}  [subbotIdentifier]
 * @param {string}  [tgChatId]
 * @param {string}  [tgName]
 * @param {boolean} [isDirect]
 * @param {boolean} [isGroup]
 * @param {boolean} [isChannel]
 */
async function createSubscription(
    tgBotUsername,
    subbotIdentifier,
    tgChatId,
    tgName,
    isDirect,
    isGroup,
    isChannel
) {

    let functionName = "createSubscription";
    let moduleName = path.basename(__filename);


    // Basic validation
    if (
        tgBotUsername == null
        || tgBotUsername.trim() == ""
        || subbotIdentifier == null
        || subbotIdentifier.trim() == ""
        || tgChatId == null
        || tgChatId.trim() == ""
    ) {
        return false;
    }


    // If Subbot does not exist in db or is not active, skip it
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
        return false;
    }

    if (subbot == null || subbot.isActive != true) {
        return false;
    }


    // If Subscription exists already in db, skip it
    let subscription = null;
    try {
        subscription = await db.Subscription.findOne({
            where: {
                subbotId: subbot.subbotId,
                tgChatId: tgChatId,
            },
        });
    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return false;
    }

    if (subscription != null) {
        return false;
    }


    // Create Subscription
    try {

        success = await db.Subscription.create({
            subbotId: subbot.subbotId,
            tgChatId: tgChatId,
            tgName: tgName,
            isDirect: isDirect,
            isGroup: isGroup,
            isChannel: isChannel,
        });

        subscription = success.dataValues;
        minilogger.print(`Subscription created // Subbot (${subbot.tgBotUsername} ${subbot.subbotIdentifier}) // ` + JSON.stringify(subscription));

    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;
    }


    // Send Telegram confirmation to user
    try {

        await telegram.sendMessage(
            subbot,
            subscription,
            `Subscribed to: ${subbot.subbotIdentifier}`
        );

    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
    }

}


/**
 * Delete Subscription from db (de-associate Telegram chat from Subbot)
 *
 * @param {string} [tgBotUsername]
 * @param {string} [subbotIdentifier]
 * @param {string} [tgChatId]
 */
async function deleteSubscription(tgBotUsername, subbotIdentifier, tgChatId) {

    let functionName = "deleteSubscription";
    let moduleName = path.basename(__filename);


    // Basic validation
    if (
        tgBotUsername == null
        || tgBotUsername.trim() == ""
        || subbotIdentifier == null
        || subbotIdentifier.trim() == ""
        || tgChatId == null
        || tgChatId.trim() == ""
    ) {
        return false;
    }


    // If Subbot does not exist in db or is not active, skip it
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
        return false;
    }

    if (subbot == null || subbot.isActive != true) {
        return false;
    }


    // If Subscription does not exists in db, skip it
    let subscription = null;
    try {
        subscription = await db.Subscription.findOne({
            where: {
                subbotId: subbot.subbotId,
                tgChatId: tgChatId,
            },
        });
    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return false;
    }

    if (subscription == null) {
        return false;
    }


    // Delete Subscription
    try {

        await db.Subscription.destroy({
            where: {
                subscriptionId: subscription.subscriptionId,
            },
        });

        minilogger.print(`Subscription deleted // Subbot (${subbot.tgBotUsername} ${subbot.subbotIdentifier}) // ` + JSON.stringify(subscription));

    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return false;
    }


    // Send Telegram confirmation to user
    try {

        await telegram.sendMessage(
            subbot,
            subscription,
            `Unsubscribed from: ${subbot.subbotIdentifier}`
        );

    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
    }

}


/**
 * Show Subscriptions for the current tgChatId
 *
 * @param {string} [tgBotUsername]
 * @param {string} [tgChatId]
 */
async function showSubscriptions(tgBotUsername, tgChatId) {

    let functionName = "showSubscriptions";
    let moduleName = path.basename(__filename);


    // Basic validation
    if (
        tgBotUsername == null
        || tgBotUsername.trim() == ""
        || tgChatId == null
        || tgChatId.trim() == ""
    ) {
        return false;
    }


    // Select Subscriptions
    let subscriptions = [];
    try {
        subscriptions = await db.Subscription.findAll({
            where: {
                tgChatId: tgChatId,
            },
        });
    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return false;
    }


    // Augment Subscription objects with Subbot details
    for (let subscription of subscriptions) {
        try {
            subscription.subbot = await db.Subbot.findOne({
                where: {
                    subbotId: subscription.subbotId,
                },
            });
        } catch(err) {
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
            return false;
        }
    }


    // Build Telegram message
    let message = "You have 0 subscriptions";
    if (subscriptions.length > 0) {
        message = "You are subscribed to:";
        for (let subscription of subscriptions) {
            let subbot = subscription.subbot;
            if (tgBotUsername == subbot.tgBotUsername) {
                message += `\n${subbot.subbotIdentifier}`;
            }
        }
    }


    // Send Telegram confirmation to user
    try {

        await telegram.sendMessageNative(
            tgBotUsername,
            tgChatId,
            message
        );

    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
    }

}


// Expose module parts
module.exports = {
    post:   post,
}
