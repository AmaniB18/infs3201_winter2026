require('dotenv').config()

const express = require('express')
const business = require('./business.js')
const bodyParser= require('body-parser')
const handlebars = require('express-handlebars')
const {ObjectId} = require('mongodb');
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

let sessions = {}

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
    if (!user || user.password !== hashPassword(password)) {
        return res.redirect("/login?error=Invalid. Try again: ")
    }
    const sessionId = crypto.randomBytes(16).toString("hex")

    sessions[sessionId] = {
        username,
        expires: Date.now() + 5 * 60 * 1000
    }
    res.cookie("sessionId", sessionId)
    res.redirect("/")
})

app.get('/logout', (req, res) => {
    const sessionId = req.cookies.sessionId
    delete sessions[sessionId]
    res.clearCookie('sessionId')
    res.redirect('/login')
})

function auth(req, res, next) {
    const sessionId = req.cookies.sessionId
    if (!sessionId || !sessions[sessionId]) {
        //return res.redirect('/login?error=Please login first')
        return res.redirect('/login')
    }
    if (sessions[sessionId].expires < Date.now()) {
        delete sessions[sessionId]
        return res.redirect('/login?error=Session expired')
    }
    sessions[sessionId].expires = Date.now() + 5 * 60 * 1000
    req.user = sessions[sessionId].username
    next()
}

app.use((req, res, next) => {
    if (req.path === '/login' || req.path === '/logout') {
        return next()
    }
    auth(req, res, next)
})

app.use(async (req, res, next) => {
    const db = await require('./persistence.js').getDb()
    await db.collection('security_log').insertOne({
        timestamp: new Date(),
        username: req.user || 'guest',
        url: req.url,
        method: req.method
    })
    next()
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