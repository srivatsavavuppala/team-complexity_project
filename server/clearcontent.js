const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to your SQLite database
const dbPath = process.env.DB_PATH || path.join(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
});

// ✅ Replace this with the job position ID you want to delete
const jobIdToDelete = 'cd111215-fc89-403b-bb2a-b3d83ba61248';

async function deleteJobPositionById(jobId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log(`🧹 Deleting job position with ID: ${jobId}`);

      db.run('DELETE FROM job_positions WHERE id = ?', [jobId], function (err) {
        if (err) {
          console.error('❌ Error deleting job position:', err.message);
          return reject(err);
        }

        if (this.changes > 0) {
          console.log(`✅ Deleted ${this.changes} job position(s) with ID: ${jobId}`);
        } else {
          console.log(`⚠️ No job position found with ID: ${jobId}`);
        }

        resolve(this.changes);
      });
    });
  });
}

(async () => {
  try {
    await deleteJobPositionById(jobIdToDelete);

    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
        process.exit(1);
      } else {
        console.log('🔒 Database connection closed.');
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Fatal error:', error.message || error);
    db.close(() => process.exit(1));
  }
})();
