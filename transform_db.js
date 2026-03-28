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




async function addEmployeesArray(shifts) {
    const allShifts = await shifts.find({}).toArray();
    for (let i = 0; i < allShifts.length; i++) {
        await shifts.updateOne(
            { _id: allShifts[i]._id },
            { $set: { employees: [] } }
        ); }
}

async function run() {
    const db = await connectDatabase();
    const shifts = db.collection("shifts");
    await addEmployeesArray(shifts);
}

run();