
const path        = require("path");
const fetch       = require("node-fetch");

const minilogger  = require("./minilogger");
const settings    = require("../mysettings.json");


/**
 * Send Telegram message from Subbot to Subscription's chat/user
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


    // Send request
    try {

        let response = await fetch(url, {
            method:     "POST",
            headers:    headers,
            body:       JSON.stringify(body),
        });

        response = await response.json();
        if (response.error_code != null) {
            response = JSON.stringify(response);
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // tgChatId ${subscription.tgChatId} // ${response}`);
            return false;
        }

    } catch (err) {

        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return false;

    }

}


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


    // Send request
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
            return false;
        }
        
    } catch (err) {

        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return false;

    }

    return true;
}


// Expose module parts
module.exports = {
    sendMessage:        sendMessage,
    sendMessageNative:  sendMessageNative,
}
