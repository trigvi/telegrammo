
/**
 * Print a timestamped message
 * 
 * @param {string}  [message]
 * @param {boolean}  [showDatetime]
 */
function print(message, showDatetime=true) {

    if(typeof message != "string") {
        message = "";
    }

    let dtNow = (new Date()).toISOString();
    message = message.replace(/\n/gm, ", ");

    if (showDatetime) {
        message = `[${dtNow}] ${message}`;
    }

    console.log(message);
}


/**
 * Print an empty line
 */
function printEmptyLine() {
    console.log("");
}


// Expose module parts
module.exports = {
    print:          print,
    printEmptyLine: printEmptyLine,
}
