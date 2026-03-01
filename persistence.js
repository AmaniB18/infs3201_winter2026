require('dotenv').config()
const { MongoClient } = require('mongodb')
let client = undefined
const dbName = 'infs3201_winter2026'
async function connectDatabase(){
    if(!client){
        client = new MongoClient(process.env.MONGO_URI)
    }
    await client.connect()
}

async function getDb() {
    await connectDatabase()
    return client.db(dbName)
}

/**
 * Return a list of all employees loaded from the storage.
 * @returns {Array<{ employeeId: string, name: string, phone: string }>} List of employees
 */
async function getAllEmployees() {
    const db = await getDb()
    let result= await db.collection('employees').find({}).toArray()
    return result
}

/**
 * Find a single employee given their ID number.
 * @param {string} empId 
 * @returns {{ employeeId: string, name: string, phone: string }|undefined}
 */
async function findEmployee(empId) {
    const db = await getDb()
    let result= await db.collection('employees').findOne({ employeeId: empId })
    return result
    
}

/**
 * Get a single shift given the shiftId
 * @param {string} shiftId 
 * @returns {{shiftId:string, date:string, startTime:string, endTime:string}|undefined}
 */
async function findShift(shiftId) {
    const db = await getDb()
    return await db.collection('shifts').findOne({ shiftId: shiftId })
}

/**
 * Get a list of shiftIDs for an employee.
 * @param {string} empId 
 * @returns {Array<{string}>}
 */
async function getEmployeeShifts(empId) {
    const db = await getDb()
    let assignments = await db.collection('assignments').find({ employeeId: empId }).toArray()

    let shiftDetails = []
    for (let a of assignments) {
        let shift = await db.collection('shifts').findOne({shiftId: a.shiftId})
        if (shift){
            shiftDetails.push(shift)
        }
    }

    return shiftDetails
}






/**
 * Add a new employee record to the system. The empId is automatically generated based
 * on the next available ID number from what is already in the file.
 * @param {{name:string, phone:string}} emp 
 */
async function addEmployeeRecord(emp) {
    const db = await getDb()
    let employees = await db.collection('employees').find({}).toArray()
    let maxId = 0
    for (let e of employees) {
        let num = Number(e.employeeId.slice(1))
        if (num > maxId) maxId = num
    }
    emp.employeeId = `E${String(maxId+1).padStart(3,'0')}`
    await db.collection('employees').insertOne(emp)

}



module.exports = {
    getAllEmployees, findEmployee,
    findShift, getEmployeeShifts,
    addEmployeeRecord
}