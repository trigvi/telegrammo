
let path        = require("path");
let Sequelize   = require("sequelize");

let minilogger  = require("./minilogger");
let settings    = require("../mysettings.json");


// Open db connection
let sequelize = new Sequelize(settings.database, {
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
let Subbot = sequelize.define('Subbot', {
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

let Outgoing = sequelize.define('Outgoing', {
    outgoingId:     { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, },
    subbotId:       { type: Sequelize.INTEGER, references: {model:'Subbot',key:'subbotId'}, onDelete:'CASCADE'},
    text:           { type: Sequelize.TEXT, },
});

let Subscription = sequelize.define('Subscription', {
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
 * 
 * @return {Promise}
 */
function sync() {

    let functionName = 'sync';
    let moduleName = path.basename(__filename);

    sequelize.sync({alter: true})
        .then(
        function(good) {
            minilogger.print("Db sync: success");
            return vacuum();
        },
        function(error) {
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${error}`);
            process.exit();
        }
    )
    .then(
        function(good) {
            minilogger.print("Db vacuum: success");
        },
        function(error) {
            minilogger.print(`ERROR // ${moduleName} // ${functionName} // ${error}`);
            process.exit();
        }
    );
}


/**
 * Execute all db operations in the given callback as one transaction
 * 
 * http://docs.sequelizejs.com/manual/tutorial/transactions.html
 * 
 * @param {function} [callback]
 * 
 * @return {Promise}
 */
function transaction(callback) {
    return sequelize.transaction(callback);
}


/**
 * Cleanup database
 * 
 * @return {Promise}
 */
function vacuum() {
    return sequelize.query("VACUUM;");
}


/**
 * Close db connection
 * 
 * @return {null}
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
