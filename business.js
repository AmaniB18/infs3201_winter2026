const persistence = require('./persistence.js')
const fs = require('fs/promises')

/**
 * Reads the max daily hours from config.json
 * @returns {Promise<number>} Maximum daily hours allowed for any employee
 */
async function getMaxDailyHours() {
    const config = JSON.parse(await fs.readFile('config.json', 'utf8'))
    return config.maxDailyHours
}

/**
 * Retrieves all employees.
 * @returns {Promise<Array>} Array of employee objects
 */
async function getAllEmployees() {
    return await persistence.getAllEmployees()
}

/**
 * Adds a new employee record.
 * @param {string} name - Employee's name
 * @param {string} phone - Employee's phone number
 * @returns {Promise<{success: boolean, message: string}>} Result of operation
 */
async function addNewEmployee(name, phone) {
    return await persistence.addNewEmployee(name, phone)
}

/**
 * Assigns a shift to an employee if possible.
 * @param {string} empId - Employee ID
 * @param {string} shiftId - Shift ID
 * @returns {Promise<{success: boolean, message: string}>} Result of the assignment
 */
async function assignShift(empId, shiftId) {
    let employee = await persistence.findEmployee(empId)
    if (!employee) {
        return "Employee does not exist"
    }

    let shift = await persistence.findShift(shiftId)
    if (!shift) {
        return "Shift does not exist"
    }
    let assignment = await persistence.findAssignment(empId, shiftId)
    if (assignment) {
        return "Employee already assigned to shift"
    }
    let existingShifts = await persistence.getEmployeeShifts(empId)
    let totalHours = 0
    for (let s of existingShifts) {
        if (s.date === shift.date) {
            totalHours += computeShiftDuration(s.startTime, s.endTime)
        }
    }

    let newShiftHours = computeShiftDuration(shift.startTime, shift.endTime)
    let maxHours = await getMaxDailyHours()

    if (totalHours + newShiftHours > maxHours) {
        return "Cannot assign shift: exceeds max daily hours of " + maxHours
    }



    await persistence.addAssignment(empId, shiftId)
    return "Shift recorded"
}

/**
 * Retrieve the schedule of an employee.
 * @param {string} empId - Employee ID
 * @returns {Promise<Array>} Array of shift objects assigned to the employee
 */
async function getEmployeeSchedule(empId) {
    return await persistence.getEmployeeSchedule(empId)
}

/**
 * Calculates the duration of a shift in hours.
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} Duration in hours (can be fractional)
 */
function computeShiftDuration(startTime, endTime) {
    let startParts = startTime.split(':')
    let endParts = endTime.split(':')
    let startH = Number(startParts[0])
    let startM = Number(startParts[1])
    let endH = Number(endParts[0])
    let endM = Number(endParts[1])
    return (endH + endM / 60) - (startH + startM / 60)
}


module.exports = {
    getAllEmployees,
    addNewEmployee,
    assignShift,
    getEmployeeSchedule,
    computeShiftDuration
}
