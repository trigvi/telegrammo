
const db          = require("../db");
const minilogger  = require("../minilogger");
const telegram    = require("../telegram");



async function run() {
    outgoingQueueSender();
}



async function outgoingQueueSender() {
    try {

        // Telegram says max 30 messages per second, we keep on the safe side
        let batchSize = 25;
        let msWaitBetweenBatches = 2000;
        let functionName = "post";
        let moduleName = "background-workers";


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


            // Send Telegram message
            if (outgoing.text != null) {
                telegram.sendMessage(
                    subbot,
                    subscription,
                    outgoing.text
                );

            } else if (outgoing.photoUrl != null) {
                telegram.sendPhotoByUrl(
                    subbot,
                    subscription,
                    outgoing.photoUrl
                );
            }

            // Delete item from queue
            item.destroy();
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
