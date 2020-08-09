
const db          = require("../db");
const minilogger  = require("../minilogger");
const telegram    = require("../telegram");


async function run() {

    outgoingQueueSender().catch(function(err){
        minilogger.print(`outgoingQueueSender() failed // ${err.message}`);
    });

    minilogger.print(`Background workers started`);
}


async function outgoingQueueSender() {

    // Telegram says max 30 messages per second, we keep on the safe side
    let batchSize = 20;
    let msWaitBetweenBatches = 2000;
    let functionName = "post";
    let moduleName = "background-workers";

    try {

        // Fetch oldest x items from queue
        let success = await db.OutgoingQueue.findAll({
            order: [
                ["outgoingQueueId", "ASC"],
            ],
            offset: 0,
            limit: batchSize,
        });

        for (let item of success) {

            let outgoingQueue = item.dataValues;
            let details = JSON.parse(outgoingQueue.details);
            let outgoing = details.outgoing;
            let subbot = details.subbot;
            let subscription = details.subscription;


            // Send Telegram message. We don't use await as we want
            // to trigger as many as possible in a short space of time
            if (outgoing.text != null) {
                telegram.sendMessage(subbot, subscription, outgoing.text).catch(function(err){
                    minilogger.print(`ERROR // telegram.sendMessage // ${err.message}`);
                });

            } else if (outgoing.photoUrl != null) {
                telegram.sendMessage(subbot, subscription, outgoing.photoUrl).catch(function(err){
                    minilogger.print(`ERROR // telegram.sendMessage // ${err.message}`);
                });
            }


            // Delete item from queue
            item.destroy().catch(function(err){
                minilogger.print(`ERROR // outgoingQueue(item).destroy // ${err.message}`);
            });
        }

    } catch(err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
    }


    // Function will call itself again after x milliseconds
    setTimeout(outgoingQueueSender, msWaitBetweenBatches);
}


module.exports = {
    run
};
