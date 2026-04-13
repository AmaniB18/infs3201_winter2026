/**
 * Sends an email (simulated)
 * @param {string} to
 * @param {string} subject
 * @param {string} message
 */
function sendEmail(to, subject, message) {
    console.log("TO:", to)
    console.log("SUBJECT:", subject)
    console.log("MESSAGE:", message)
}

module.exports = { sendEmail }