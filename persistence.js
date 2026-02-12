const fs = require('fs/promises')

/**
 * reads a JSON file and returns its contents
 * @param {string} fileName - the file path
 * @returns {Promise<Object>} resolves to the parsed JSON object
 */
async function readData(fileName) {
  const data = await fs.readFile(fileName, "utf8")
  return JSON.parse(data)
}

/**
 * writes data to JSON file
 * @param {string} fileName - the file path
 * @param {Object} data - the data to write
 * @returns {Promise<void>}
 */
async function writeData(fileName, data) {
    await fs.writeFile(fileName, JSON.stringify(data))
}

/**
 * returns all employees
 * @returns {Promise<Array>} resolves to array of employee objects
 */
async function getAllEmployees() {
  return await readData("employees.json")
}

/**
 * returns all shifts
 * @returns {Promise<Array>} resolves to array of shift objects
 */
async function getAllShifts() {
  return await readData("shifts.json")
}

/**
 * returns all assignments
 * @returns {Promise<Array>} resolves to array of assignment objects
 */
async function getAllAssignments() {
  return await readData("assignments.json")
}

/**
 * finds a specific employee by ID
 * @param {string} empId - employee ID
 * @returns {Promise<Object|undefined>} resolves to employee object or undefined if not found
 */
async function findEmployee(empId) {
    let employees = await getAllEmployees()
    for (let emp of employees) {
        if (emp.employeeId === empId) {
            return emp
        }
    }
    return undefined
}

/**
 * finds a specific shift by ID
 * @param {string} shiftId - shift ID
 * @returns {Promise<Object|undefined>} resolves to shift object or undefined if not found
 */
async function findShift(shiftId) {
    let shifts = await getAllShifts()
    for (let shift of shifts) {
        if (shift.shiftId == shiftId) {
            return shift
        }
    }
    return undefined
}

/**
 * returns all shifts assigned to an employee
 * @param {string} empId - employee ID
 * @returns {Promise<Array>} resolves to array of shift objects
 */
async function getEmployeeShifts(empId) {
    let assignments = await getAllAssignments()
    let shiftIds = []
    for (let asn of assignments) {
        if (asn.employeeId == empId) {
            shiftIds.push(asn.shiftId)
        }
    }

    let shifts = await getAllShifts()
    let shiftDetails = []
    for (let sh of shifts) {
        if (shiftIds.includes(sh.shiftId)) {
            shiftDetails.push(sh)
        }
    }

    return shiftDetails
}

/**
 * finds a specific assignment given the employeeId + shiftId)
 * @param {string} empId
 * @param {string} shiftId
 * @returns {Promise<Object|undefined>} resolves to assignment object or undefined if not found
 */
async function findAssignment(empId, shiftId) {
    let assignments = await getAllAssignments()
    for (let asn of assignments) {
        if (asn.employeeId === empId && asn.shiftId === shiftId) {
            return asn
        }
    }
    return undefined
}

/**
 * adds a new assignment (employee + shift) to assignments.json
 * @param {string} empId
 * @param {string} shiftId
 * @returns {Promise<void>}
 */
async function addAssignment(empId, shiftId) {
    let assignments = await getAllAssignments()
    assignments.push({employeeId: empId, shiftId: shiftId})
    await writeData('assignments.json', assignments)
}

/**
 * returns schedule of an employee (all their shifts)
 * @param {string} empId
 * @returns {Promise<Array>} resolves to array of shift objects
 */
async function getEmployeeSchedule(empId) {
    
    let details = await getEmployeeShifts(empId)
    return details
}

/**
 * adds a new employee record to employees.json
 * @param {Object} emp - object with name and phone
 * @returns {Promise<void>}
 */
async function addEmployeeRecord(emp) {
    let maxId = 0
    let employeeList = await readData('employees.json')
    for (let e of employeeList) {
        let eid = Number(e.employeeId.slice(1))
        if (eid > maxId) maxId = eid
    }
    emp.employeeId = `E${String(maxId + 1).padStart(3,'0')}`
    employeeList.push(emp)
    await writeData('employees.json', employeeList)
}

/**
 * adds a new employee by name and phone
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<void>}
 */
async function addNewEmployee(name, phone) {
    await addEmployeeRecord({
        name: name,
        phone: phone
    })
    
}

module.exports= {readData,
    getAllEmployees,
    getAllShifts,
    getAllAssignments,
    findEmployee,
    findShift,
    getEmployeeShifts,
    findAssignment,
    addAssignment,
    getEmployeeSchedule,
    addNewEmployee

}