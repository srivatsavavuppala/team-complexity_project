const database = require('../config/database');
const db = database.getDb();

const selectQuery = `SELECT * FROM assessments`;

db.all(selectQuery, [], (err, rows) => {
    console.log('rows: ', rows)
})