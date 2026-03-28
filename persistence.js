require('dotenv').config()
const {MongoClient, ObjectId} = require('mongodb')
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
    if (!ObjectId.isValid(empId)){
        return undefined;}
    let result= await db.collection('employees').findOne({_id: new ObjectId(empId)})
    return result
    
}

/**
 * Get a single shift given the shiftId
 * @param {string} shiftId 
 * @returns {{shiftId:string, date:string, startTime:string, endTime:string}|undefined}
 */
async function findShift(shiftId) {
    const db = await getDb()
    if (!ObjectId.isValid(shiftId)){
        return undefined;}
    return await db.collection('shifts').findOne({_id: new ObjectId(shiftId)})
}

/**
 * Get a list of shiftIDs for an employee.
 * @param {string} empId 
 * @returns {Array<{shiftId:string, date:string, startTime:string, endTime:string }>}
 */
async function getEmployeeShifts(empId) {
    const db = await getDb()
    if (!ObjectId.isValid(empId)){
        return [];}
    let shifts = await db.collection('shifts').find({employees: new ObjectId(empId)}).toArray()
    return shifts
}

/**
 * Add a new employee record to the system. The empId is automatically generated based
 * on the next available ID number from what is already in the file.
 * @param {{name:string, phone:string}} emp 
 */
async function addEmployeeRecord(emp) {
    const db = await getDb()
    await db.collection('employees').insertOne(emp)

}

module.exports = {
    getAllEmployees, findEmployee,
    findShift, getEmployeeShifts,
    addEmployeeRecord, getDb
}