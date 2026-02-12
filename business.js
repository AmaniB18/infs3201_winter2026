const persistence = require('./persistence.js')

async function getAllEmployees() {
    return await persistence.getAllEmployees()
}

async function addNewEmployee(name, phone) {
    return await persistence.addNewEmployee(name, phone)
}

async function assignShift(empId, shiftId) {
    return await persistence.assignShift(empId, shiftId)
}

async function getEmployeeSchedule(empId) {
    return await persistence.getEmployeeSchedule(empId)
}

module.exports = {
    getAllEmployees,
    addNewEmployee,
    assignShift,
    getEmployeeSchedule
}
