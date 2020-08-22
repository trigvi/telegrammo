
const path        = require("path");
const fetch       = require("node-fetch");

const db          = require("./db");
const minilogger  = require("./minilogger");
const settings    = require("../mysettings.json");


/**
 * Send Telegram message from main Telegram bot to user
 * 
 * @param {string}      [tgBotUsername]
 * @param {integer}     [tgChatId]
 * @param {string}      [text]
 * @param {string}      [parseMode]
 */
async function sendMessageNative(tgBotUsername, tgChatId, text, parseMode="HTML") {

    let functionName = "sendMessageNative";
    let moduleName = path.basename(__filename);


    // Fetch Subbot's Telegram bot token
    tgBotToken = null;
    try { tgBotToken = settings["telegramBotsAllowed"][tgBotUsername] } catch(err) {}
    if (tgBotToken == null) {
        return;
    }


    // Define request details
    let url = `https://api.telegram.org/bot${tgBotToken}/sendMessage`;

    let headers = {
        "Content-Type"  : "application/json",
        "Accept"        : "application/json",
    }

    let body = {
        "chat_id"       : tgChatId,
        "text"          : text,
        "parse_mode"    : parseMode,
    };


    // Send
    try {

        let response = await fetch(url, {
            method:     "POST",
            headers:    headers,
            body:       JSON.stringify(body),
        });

        response = await response.json();
        if (response.error_code != null) {
            response = JSON.stringify(response);
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // tgChatId ${tgChatId} // ${response}`);
            return;
        }
        
    } catch (err) {

        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;

    }
}


/**
 * Send Telegram text message from Subbot to Subscription's chat/user
 * 
 * @param {Subbot}          [subbot]
 * @param {Subscription}    [subscription]
 * @param {string}          [text]
 * @param {string}          [parseMode]
 */
async function sendMessage(subbot, subscription, text, parseMode="HTML") {

    let functionName = "sendMessage";
    let moduleName = path.basename(__filename);


    // Fetch Subbot's Telegram bot token
    tgBotToken = null;
    try { tgBotToken = settings["telegramBotsAllowed"][subbot.tgBotUsername] } catch(err) {}
    if (tgBotToken == null) {
        return;
    }


    // Define request details
    let url = `https://api.telegram.org/bot${tgBotToken}/sendMessage`;

    let headers = {
        "Content-Type"  : "application/json",
        "Accept"        : "application/json",
    };

    let body = {
        "chat_id"       : subscription.tgChatId,
        "text"          : text,
        "parse_mode"    : parseMode,
    };


    // Send
    try {

        let response = await fetch(url, {
            method:     "POST",
            headers:    headers,
            body:       JSON.stringify(body),
        });

        response = await response.json();
        if (response.error_code != null) {

            let telegramErrorDescription = response.description;
            response = JSON.stringify(response);
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // tgChatId ${subscription.tgChatId} // ${response}`);

            if (isChatNotFound(telegramErrorDescription)) {
                await processChatNotFound(subbot, subscription);
            };

            return;
        }

    } catch (err) {

        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;

    }

}


/**
 * Send Telegram photo message from Subbot to Subscription's chat/user
 * 
 * @param {Subbot}          [subbot]
 * @param {Subscription}    [subscription]
 * @param {string}          [photoUrl]
 */
async function sendPhotoByUrl(subbot, subscription, photoUrl) {

    let functionName = "sendPhotoByUrl";
    let moduleName = path.basename(__filename);


    // Fetch Subbot's Telegram bot token
    tgBotToken = null;
    try { tgBotToken = settings["telegramBotsAllowed"][subbot.tgBotUsername] } catch(err) {}
    if (tgBotToken == null) {
        return;
    }


    // Define request details
    let url = `https://api.telegram.org/bot${tgBotToken}/sendPhoto`;

    let headers = {
        "Content-Type"  : "application/json",
        "Accept"        : "application/json",
    };

    let body = {
        "chat_id"   : subscription.tgChatId,
        "photo"     : photoUrl,
    };


    // Send
    try {

        let response = await fetch(url, {
            method:     "POST",
            headers:    headers,
            body:       JSON.stringify(body),
        });

        response = await response.json();
        if (response.error_code != null) {

            let telegramErrorDescription = response.description;
            response = JSON.stringify(response);
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // tgChatId ${subscription.tgChatId} // ${response}`);

            if (isChatNotFound(telegramErrorDescription)) {
                await processChatNotFound(subbot, subscription);
            };

            return;
        }

    } catch (err) {

        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;

    }

}


/**
 * Tell Telegram our bot's webhook url on this API
 * 
 * @param {string}      [tgBotUsername]
 */
async function setWebhook(tgBotUsername) {

    let functionName = "setWebhook";
    let moduleName = path.basename(__filename);


    // Fetch Subbot's Telegram bot token
    let tgBotToken = null;
    try { tgBotToken = settings["telegramBotsAllowed"][tgBotUsername] } catch(err) {}
    if (tgBotToken == null) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // could not find token in our settings for Telegram bot ${tgBotUsername}`);
        return;
    }


    // Build webhook url
    let webhookUrl = null;
    try { webhookUrl = settings["api"]["base_url"] + `/webhook/${tgBotUsername}` } catch(err) {}
    if (webhookUrl == null) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // could not find our API base url in our settings`);
        return;
    }


    // Define request details
    let url = `https://api.telegram.org/bot${tgBotToken}/setWebhook`;

    let headers = {
        "Content-Type"  : "application/json",
        "Accept"        : "application/json",
    };

    let body = {
        "url"               : webhookUrl,
        "allowed_updates"   : ["message", "channel_post",],
    };


    // Send
    try {

        let response = await fetch(url, {
            method:     "POST",
            headers:    headers,
            body:       JSON.stringify(body),
        });

        response = await response.json();
        minilogger.print(`${moduleName} // ${functionName} // Telegram request: ` + JSON.stringify(body));
        minilogger.print(`${moduleName} // ${functionName} // Telegram response: ` + JSON.stringify(response));

        if (response.error_code != null) {
            response = JSON.stringify(response);
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${response}`);
            return;
        }

    } catch (err) {

        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;

    }

    return true;
}


/**
 * Is chat not found error
 * 
 * @param {string}      [telegramErrorDescription]
 */
function isChatNotFound(telegramErrorDescription) {
    try {

        let searches = [
            "chat not found",
            "bot was blocked",
            "bot was kicked",
        ];

        for (let s of searches) {
            if (telegramErrorDescription.indexOf(s) != -1) {
                return true;
            }
        }

    } catch(err) {
        console.log(err);
    }

    return false;
}


/**
 * Delete Subscription if chat not found
 * 
 * Chat not found  can happen when a user closes the chat or stops the
 * bot without first using the /unsubscribe command. Next time we send
 * him a message, Telegram API sends back an error. So we delete the
 * Subscription on our side.
 * 
 * @param {Subbot}          [subbot]
 * @param {Subscription}    [subscription]
 */
async function processChatNotFound(subbot, subscription) {

    let functionName = "processChatNotFound";
    let moduleName = path.basename(__filename);

    try {

        minilogger.print(`ERROR CHAT NOT FOUND // Deleting Subscription // ${subbot.tgBotUsername} ${subbot.subbotIdentifier} // ${subscription.tgChatId} ${subscription.tgName}`);

        subscription = await db.Subscription.findOne({
            where: {
                subscriptionId: subscription.subscriptionId,
            },
        });

        await subscription.destroy();

    } catch (err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return;
    }
}


// Expose module parts
module.exports = {
    sendMessage:        sendMessage,
    sendMessageNative:  sendMessageNative,
    sendPhotoByUrl:     sendPhotoByUrl,
    setWebhook:         setWebhook,
}
