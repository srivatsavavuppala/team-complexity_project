const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
  else console.log('Connected to database');
});

// Delete all rows
db.run('DELETE FROM assessments', function(err) {
  if (err) console.error(err);
  else console.log(`Deleted ${this.changes} row(s) from candidates`);
});

db.close();