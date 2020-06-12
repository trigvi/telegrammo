
const path        = require("path");
const Sequelize   = require("sequelize");

const minilogger  = require("./minilogger");
const settings    = require("../mysettings.json");


// Open db connection
const sequelize = new Sequelize(settings.database, {
    define: {
        freezeTableName: true,
        charset: 'utf8',
        dialectOptions: {
            collate: 'utf8_general_ci'
        },
        timestamps: true,
        underscored: false,
    },
    logging: false,
});


// Define models
const Subbot = sequelize.define('Subbot', {
    subbotId:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, },
    tgBotUsername:      { type: Sequelize.STRING, unique: 'compositeIndex', },
    subbotIdentifier:   { type: Sequelize.STRING, unique: 'compositeIndex', },
    description:        { type: Sequelize.STRING, },
    isActive:           { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true, },
},
{
    indexes: [{
        unique: false,
        fields: ["subbotIdentifier"],
    }],
});

const Outgoing = sequelize.define('Outgoing', {
    outgoingId:     { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, },
    subbotId:       { type: Sequelize.INTEGER, references: {model:'Subbot',key:'subbotId'}, onDelete:'CASCADE'},
    text:           { type: Sequelize.TEXT, },
});

const Subscription = sequelize.define('Subscription', {
    subscriptionId: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, },
    subbotId:       { type: Sequelize.INTEGER, unique: 'compositeIndex', references: {model:'Subbot',key:'subbotId'}, onDelete:'CASCADE'},
    tgChatId:       { type: Sequelize.STRING, unique: 'compositeIndex', },
    tgName:         { type: Sequelize.STRING, },
    isDirect:       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
    isGroup:        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
    isChannel:      { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false, },
});


/**
 * Create db schema based on defined models
 * 
 * http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html
 */
async function sync() {

    let functionName = 'sync';
    let moduleName = path.basename(__filename);

    try {
        await sequelize.sync({alter: true});
        minilogger.print("Db sync: success");
    } catch (err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return false;
    }

    try {
        await vacuum();
        minilogger.print("Db vacuum: success");
    } catch (err) {
        minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${err.message}`);
        return false;
    }
    
    return true;
}


/**
 * Execute all db operations in the given callback as one transaction
 * 
 * http://docs.sequelizejs.com/manual/tutorial/transactions.html
 * 
 * @param {function} [callback]
 */
function transaction(callback) {
    return sequelize.transaction(callback);
}


/**
 * Cleanup database
 */
function vacuum() {
    return sequelize.query("VACUUM;");
}


/**
 * Close db connection
 */
function close() {
    sequelize.close();
}


// Expose module parts
module.exports = {

    Outgoing:       Outgoing,
    Subbot:         Subbot,
    Subscription:   Subscription,

    close:          close,
    sync:           sync,
    transaction:    transaction,
    vacuum:         vacuum,

}
