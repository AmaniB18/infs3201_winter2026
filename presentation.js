const business = require('./business.js')
const prompt = require('prompt-sync')();


/**
 * The UI function for displaying the menu and calling the various UI functions.  The function
 * is made async because many of the called functions are also async.
 */
async function displayMenu() {
    while (true) {
        console.log('1. Show all employees')
        console.log('2. Add new employee')
        console.log('3. Assign employee to shift')
        console.log('4. View employee schedule')
        console.log('5. Exit')
        let choice = Number(prompt("What is your choice> "))
        if (choice === 1) {
            let employees = await business.getAllEmployees()
            console.log('Employee ID  Name                Phone')
            console.log('-----------  ------------------- ---------')
            for (let emp of employees) {
                console.log(`${emp.employeeId.padEnd(13)}${emp.name.padEnd(20)}${emp.phone}`)
            }
            console.log('\n')
        }
        else if (choice === 2) {
            let name = prompt('Enter employee name: ')
            let phone = prompt('Enter phone number: ')
            await business.addNewEmployee(name, phone)
            console.log('employee added\n')
        }
        else if (choice === 3) {
            let empId = prompt('Enter employee ID: ')
            let shiftId = prompt('Enter shift ID: ')
            let result =await business.assignShift(empId, shiftId)
            console.log(result + '\n')
        }
        else if (choice === 4) {let empId = prompt('Enter employee ID: ')
            let schedule = await business.getEmployeeSchedule(empId)

            if (schedule.length === 0) {
                console.log('no shifts assigned\n')
                continue
            }

            console.log('ShiftID  Date       Start   End')
            console.log('-------  ---------- ------- -------')
            for (let s of schedule) {
                console.log(`${s.shiftId.padEnd(8)}${s.date.padEnd(11)}${s.startTime.padEnd(8)}${s.endTime}`)
            }
            console.log()}
        
        else if (choice == 5) {
            break
        }
        else {
            console.log("Error in selection")
        }
    }
    console.log('*** Goodbye!')
}

displayMenu()