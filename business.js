const persistence = require('./persistence.js')

/**
 * Return a list of all employees loaded from the storage.
 * @returns {Array<{_id: ObjectId, name: string, phone: string }>} List of employees
 */
async function getAllEmployees() {
    return await persistence.getAllEmployees()
}

/**
 * Finds an employee by their ObjectId.
 * @param {string} empId - The employee's ObjectId as a string.
 * @returns {Promise<{ _id: ObjectId, name: string, phone: string } | undefined>}
 */
async function findEmployee(empId) {
    return await persistence.findEmployee(empId)
}

/**
 * Get a list of shiftIDs for an employee.
 * @param {string} empId 
 * @returns {Array<{ _id: ObjectId, date: string, startTime: string, endTime: string, employees: ObjectId[] }>}
 */
async function getEmployeeShifts(empId) {
    return await persistence.getEmployeeShifts(empId)
}


/**
 * Add a new employee record to the system. The _id is automatically generated 
 * @param {{name:string, phone:string}} emp 
 */
async function addEmployeeRecord(emp) {
    return await persistence.addEmployeeRecord(emp)
}




module.exports = {
    getAllEmployees, findEmployee, addEmployeeRecord, getEmployeeShifts
}