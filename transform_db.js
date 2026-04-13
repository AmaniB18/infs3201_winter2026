require('dotenv').config()
const { MongoClient } = require('mongodb')
let client = undefined
const dbName = 'infs3201_winter2026'
async function connectDatabase(){
    if(!client){
        client = new MongoClient(process.env.MONGO_URI)
    }
    await client.connect()
    return client.db(dbName)
}

async function addEmployeesArray(shifts){
    const allShifts = await shifts.find({}).toArray();
    for (let i = 0; i < allShifts.length; i++){
        await shifts.updateOne(
            {_id: allShifts[i]._id},
            {$set: {employees: []}}
        ); }
}

async function embedEmployees(shifts, assignments, employees){
    const allAssignments = await assignments.find({}).toArray();
    for (let i = 0; i < allAssignments.length; i++){
        let assignment = allAssignments[i];

        let emp = await employees.findOne({employeeId: assignment.employeeId });
        let shift = await shifts.findOne({shiftId: assignment.shiftId});
        if (emp && shift) {
            await shifts.updateOne(
                { _id: shift._id },
                { $push: { employees: emp._id } }
            );
        }}
}

async function cleanup(shifts, employees, db){
    await employees.updateMany({}, {$unset: {employeeId: ""}});
    await shifts.updateMany({}, {$unset: {shiftId: ""}});
    await db.collection("assignments").drop();
}

async function run(){
    const db = await connectDatabase();
    const shifts = db.collection("shifts");
    const assignments = db.collection("assignments");
    const employees = db.collection("employees");
    await addEmployeesArray(shifts);
    await embedEmployees(shifts, assignments, employees);
    await cleanup(shifts, employees, db);
}

run();