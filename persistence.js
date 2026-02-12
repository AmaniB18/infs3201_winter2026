const fs = require('fs/promises')

async function readData(fileName) {
  const data = await fs.readFile(fileName, "utf8")
  return JSON.parse(data)
}

async function writeData(fileName, data) {
    await fs.writeFile(fileName, JSON.stringify(data))
}

async function getAllEmployees() {
  return await readData("employees.json")
}

async function getAllShifts() {
  return await readData("shifts.json")
}

async function getAllAssignments() {
  return await readData("assignments.json")
}


async function findEmployee(empId) {
    let employees = await getAllEmployees()
    for (let emp of employees) {
        if (emp.employeeId === empId) {
            return emp
        }
    }
    return undefined
}

async function findShift(shiftId) {
    let shifts = await getAllShifts()
    for (let shift of shifts) {
        if (shift.shiftId == shiftId) {
            return shift
        }
    }
    return undefined
}


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


async function findAssignment(empId, shiftId) {
    let assignments = await getAllAssignments()
    for (let asn of assignments) {
        if (asn.employeeId === empId && asn.shiftId === shiftId) {
            return asn
        }
    }
    return undefined
}


async function addAssignment(empId, shiftId) {
    let assignments = await getAllAssignments()
    assignments.push({employeeId: empId, shiftId: shiftId})
    await writeData('assignments.json', assignments)
}


async function assignShift(empId, shiftId) {
    // check that empId exists
    let employee = await findEmployee(empId)
    if (!employee) {
        return "Employee does not exist"
    }
    // check that shiftId exists
    let shift = await findShift(shiftId)
    if (!shift) {
        return "Shift does not exist"
    }
    // check that empId,shiftId doesn't exist
    let assignment = await findAssignment(empId, shiftId)
    if (assignment) {
        return "Employee already assigned to shift"
    }
    // add empId,shiftId into the bridge
    await addAssignment(empId, shiftId)
    return "shift recorded"
}


async function getEmployeeSchedule(empId) {
    
    let details = await getEmployeeShifts(empId)
    return details
}

/*
async function displayEmployees() {
    let employees = await getAllEmployees()
    console.log('Employee ID  Name                Phone')
    console.log('-----------  ------------------- ---------')
    for (let emp of employees) {
        console.log(`${emp.employeeId.padEnd(13)}${emp.name.padEnd(20)}${emp.phone}`)
    }
}*/

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
    assignShift,
    getEmployeeSchedule,
    addNewEmployee,



}