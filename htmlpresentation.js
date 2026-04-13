require('dotenv').config()

const express = require('express')
const business = require('./business.js')
const bodyParser= require('body-parser')
const handlebars = require('express-handlebars')
const {ObjectId} = require('mongodb');
const crypto = require('crypto')
const cookieParser = require('cookie-parser')

const emailSystem = require('./emailSystem.js')

app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

let sessions = {}

let twoFACodes = {}
let loginAttempts = {}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}
app.get('/login', (req, res) => {
    res.render('login', { error: req.query.error })
})


app.post('/login', async (req, res) => {
    const { username, password } = req.body

    const db = await require('./persistence.js').getDb()
    const user = await db.collection("users").findOne({ username })

    if (!loginAttempts[username]) {
        loginAttempts[username] = 0
    }

    if (!user || user.password !== hashPassword(password)) {
        loginAttempts[username]++

        if (loginAttempts[username] === 3) {
            emailSystem.sendEmail(username, "Suspicious Activity", "3 failed login attempts detected.")
        }

        if (loginAttempts[username] >= 10) {
            await db.collection("users").updateOne(
                { username },
                { $set: { locked: true } }
            )
            return res.send("Account locked")
        }

        return res.redirect("/login?error=Invalid credentials")
    }

    if (user.locked) {
        return res.send("Account is locked")
    }

   
    loginAttempts[username] = 0

  
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    twoFACodes[username] = {
        code: code,
        expires: Date.now() + 3 * 60 * 1000
    }

    emailSystem.sendEmail(username, "Your 2FA Code", code)

    res.render("2fa", { username })
})

app.post('/verify-2fa', (req, res) => {
    const { username, code } = req.body

    const record = twoFACodes[username]

    if (!record) {
        return res.send("No code found")
    }

    if (record.expires < Date.now()) {
        delete twoFACodes[username]
        return res.send("Code expired")
    }

    if (record.code !== code) {
        return res.send("Invalid code")
    }

    delete twoFACodes[username]

    const sessionId = crypto.randomBytes(16).toString("hex")

    sessions[sessionId] = {
        username,
        expires: Date.now() + 5 * 60 * 1000
    }

    res.cookie("sessionId", sessionId, { maxAge: 5 * 60 * 1000 })
    res.redirect("/")
})

app.get('/logout', (req, res) => {
    const sessionId = req.cookies.sessionId
    delete sessions[sessionId]
    res.clearCookie('sessionId')
    res.redirect('/login')
})

/**
 * Middleware that enforces authentication.
 * Validates session existence and expiry, and implements expiration.
 * Redirects unauthenticated users to login.
 * @param {Object} req
 * @param {Object} res
 */
function auth(req, res, next) {
    const sessionId = req.cookies.sessionId
    if (!sessionId || !sessions[sessionId]) {
        if (req.path === '/'){
            return res.redirect('/login')
        }
        return res.redirect('/login?error=Please login first')
}
    if (sessions[sessionId].expires < Date.now()) {
        delete sessions[sessionId]
        return res.redirect('/login?error=Session expired')
    }
    sessions[sessionId].expires = Date.now() + 5 * 60 * 1000
    res.cookie("sessionId", sessionId, {maxAge: 5 * 60 * 1000})
    req.user = sessions[sessionId].username
    next()
}


/**
 * Middleware that logs all incoming requests to the security_log collection.
 * Records timestamp, username, URL, and HTTP method.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
app.use(async (req, res, next) => {
    const db = await require('./persistence.js').getDb()
    const sessionId = req.cookies.sessionId
    let username = 'guest'
    if (sessionId && sessions[sessionId]) {
        username = sessions[sessionId].username
    }
    await db.collection('security_log').insertOne({
        timestamp: new Date(),
        username: username,
        url: req.url,
        method: req.method
    })
    next()
})


app.use((req, res, next) => {
    if (req.path === '/login' || req.path === '/logout') {
        return next()
    }
    auth(req, res, next)
})


app.get('/employee/edit/:id', async (req,res)=>{
    const emp = await business.findEmployee(req.params.id)
    res.render('employee_edit', { employee: emp })
})

app.post('/employee/edit/:id', async (req,res)=>{
    const { name, phone } = req.body
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    

    if (!trimmedName) {
        return res.send('Name cant be empty!')}

    if (!/^\d{4}-\d{4}$/.test(trimmedPhone)) {
        return res.send('Phone must be in XXXX-XXXX format!')}
    

    const db = await require('./persistence.js').getDb()
    await db.collection('employees').updateOne(
        {_id: new ObjectId(req.params.id)},
        {$set: { name: trimmedName, phone: trimmedPhone}}
    )

    
    res.redirect('/')
})

app.get('/employee/:id', async (req, res) => {
    const emp = await business.findEmployee(req.params.id)
    const shifts = await business.getEmployeeShifts(req.params.id)

    shifts.sort((a,b) => new Date(a.date + ' ' + a.startTime) - new Date(b.date + ' ' + b.startTime))

    res.render('employee_details', {
        employee: emp,
        shifts: shifts
    })
})


/**
 * handles the root route and renders the employee list page.
 * fetches all employees from the business layer and passes them
 * to the employee_list handlebars template.
 *
 * @function handleRoot
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 * @returns {Promise<void>} resolves after the page is rendered
 */
async function handleRoot(req,res){
    let employees = await business.getAllEmployees()

    res.render('employee_list', {
        employees: employees
    })
}


app.engine('handlebars', handlebars.engine(
    {defaultLayout: false,
  helpers: {
    ltTime: (time, cutoff) => {
        const timeParts = time.split(':')
        const cutoffParts = cutoff.split(':')

        const h1 = Number(timeParts[0])
        const m1 = Number(timeParts[1])

        const h2 = Number(cutoffParts[0])
        const m2 = Number(cutoffParts[1])

        return h1 < h2 || (h1 === h2 && m1 < m2)
    }
  }
}))


app.set('views', __dirname + '/templates')
app.set('view engine', 'handlebars')


app.get('/', handleRoot)

app.listen(8000)