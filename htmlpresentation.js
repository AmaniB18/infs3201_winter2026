const express = require('express')
const business = require('./business.js')
const bodyParser= require('body-parser')
const handlebars = require('express-handlebars')
app = express()

app.use(bodyParser.urlencoded({ extended: false }))

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
        { employeeId: req.params.id },
        { $set: { name: trimmedName, phone: trimmedPhone } }
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