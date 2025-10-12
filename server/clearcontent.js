const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath);

async function deleteAllAssessments() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('🧹 Deleting all rows from assessment table...');

      db.run('DELETE FROM assessments', function (err) {
        if (err) {
          console.error('❌ Error deleting rows:', err);
          return reject(err);
        }

        console.log(`✅ Deleted ${this.changes} rows from assessments table.`);
        resolve();
      });
    });
  });
}

deleteAllAssessments()
  .then(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('🔒 Database connection closed.');
      }
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    db.close();
    process.exit(1);
  });
