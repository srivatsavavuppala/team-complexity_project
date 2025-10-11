const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the same DB path logic as your insert script
const dbPath = process.env.DB_PATH || path.join(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath);

// Use the same assessment ID format
const ASSESSMENT_ID = '1ea2585d-69ba-415e-ab0c-01f3d1a98ba4';

async function clearAnalysis() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log(`🧹 Clearing analysis column for assessment: ${ASSESSMENT_ID}\n`);

      // Check if the assessment exists first
      db.get('SELECT * FROM assessments WHERE id = ?', [ASSESSMENT_ID], (err, assessment) => {
        if (err) {
          console.error('❌ Error fetching assessment:', err);
          return reject(err);
        }

        if (!assessment) {
          console.error(`❌ Assessment with ID ${ASSESSMENT_ID} not found!`);
          return reject(new Error('Assessment not found'));
        }

        console.log('✓ Assessment found');
        console.log(`  Current analysis: ${assessment.analysis ? assessment.analysis.slice(0, 80) + '...' : '(empty)'}\n`);

        // Clear the analysis column
        db.run(
          `UPDATE assessments SET analysis = NULL WHERE id = ?`,
          [ASSESSMENT_ID],
          function (err) {
            if (err) {
              console.error('❌ Error clearing analysis column:', err);
              return reject(err);
            }

            if (this.changes === 0) {
              console.log(`ℹ️ No rows updated — maybe analysis was already empty.`);
            } else {
              console.log(`✅ Cleared analysis column for assessment: ${ASSESSMENT_ID}`);
            }
            resolve();
          }
        );
      });
    });
  });
}

clearAnalysis()
  .then(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      } else {
        console.log('🔒 Database connection closed.');
        process.exit(0);
      }
    });
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    db.close();
    process.exit(1);
  });
