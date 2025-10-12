const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath);

// Replace with the assessment ID you want to update
const ASSESSMENT_ID = '3127525d-0b46-43ab-b397-064a5d6738a1';
// Replace with the status you want to set
const NEW_STATUS = 'completed';

async function updateAssessmentStatus() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log(`🔄 Updating status for assessment: ${ASSESSMENT_ID}`);

      // Check if assessment exists
      db.get('SELECT * FROM assessments WHERE id = ?', [ASSESSMENT_ID], (err, assessment) => {
        if (err) {
          console.error('❌ Error fetching assessment:', err);
          return reject(err);
        }

        if (!assessment) {
          console.error(`❌ Assessment with ID ${ASSESSMENT_ID} not found!`);
          return reject(new Error('Assessment not found'));
        }

        // Update the status
        db.run(
          `UPDATE assessments SET status = ? WHERE id = ?`,
          [NEW_STATUS, ASSESSMENT_ID],
          function (err) {
            if (err) {
              console.error('❌ Error updating status:', err);
              return reject(err);
            }

            console.log(`✅ Updated status for assessment ${ASSESSMENT_ID} to "${NEW_STATUS}"`);
            resolve();
          }
        );
      });
    });
  });
}

updateAssessmentStatus()
  .then(() => {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      else console.log('🔒 Database connection closed.');
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    db.close();
    process.exit(1);
  });
