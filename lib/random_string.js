
let allowedChars = "abcdefghijklmnopqrstuvwxyz0123456789";


/**
 * Set allowed chars
 * 
 * @param {string} chars
 */
function setAllowedChars(chars="") {
    if (chars.length > 0) {
        allowedChars = chars;
    }
}


/**
 * Generate random string of x characters
 * 
 * @param {integer} length
 */
function generate(length=12) {

    let ret = "";
    for (let i=1; i <= length; i++) {
        let randomFrom = Math.floor(Math.random() * allowedChars.length);
        let randomTo = randomFrom + 1;
        ret += allowedChars.substring(randomFrom, randomTo);
    }
    
    return ret;

}


// Expose module parts
module.exports = {

    generate:           generate,
    setAllowedChars:    setAllowedChars,

}
