const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || path.join(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath);

// The specific assessment ID to insert responses for
const ASSESSMENT_ID = '808263e0-83e9-4a2c-8e43-9d4a7572346b';

// Sample questions that would be generated
const sampleQuestions = {
  technical: [
    {"question":"What is your experience with Python, and how have you used it in previous projects?","category":"technical","difficulty":"easy"},
    {"question":"Can you explain the difference between monolithic architecture and microservices architecture?","category":"technical","difficulty":"easy"},
    {"question":"How do you optimize the performance of a PostgreSQL database?","category":"technical","difficulty":"medium"},
    {"question":"What is FastAPI, and how does it differ from other Python web frameworks like Flask or Django?","category":"technical","difficulty":"easy"},
    {"question":"Can you write a simple RESTful API using Python and FastAPI?","category":"technical","difficulty":"medium"},
    {"question":"How do you handle errors and exceptions in a Python application?","category":"technical","difficulty":"easy"}
  ],
  behavioral: [
    {"question":"Can you describe a project you worked on that involved collaboration with a frontend developer?","category":"behavioral","difficulty":"easy"},
    {"question":"Tell me about a time when you had to debug a difficult issue in a complex system. How did you approach it?","category":"behavioral","difficulty":"medium"},
    {"question":"How do you handle feedback or criticism of your code?","category":"behavioral","difficulty":"easy"},
    {"question":"Can you describe your experience with code reviews? How do you approach reviewing someone else's code?","category":"behavioral","difficulty":"easy"},
    {"question":"Tell me about a project you led or contributed to that you're particularly proud of. What was your role, and what did you learn from it?","category":"behavioral","difficulty":"medium"}
  ],
  situational: [
    {"question":"If you were tasked with designing a scalable API for a high-traffic application, how would you approach it?","category":"situational","difficulty":"medium"},
    {"question":"Suppose you're working on a project and realize that the database schema needs to be changed. How would you handle this situation?","category":"situational","difficulty":"easy"},
    {"question":"If a colleague came to you with a problem they're having with their code, how would you help them troubleshoot it?","category":"situational","difficulty":"easy"},
    {"question":"Imagine you're working on a project with a tight deadline, and you realize that one of the dependencies is causing issues. What would you do?","category":"situational","difficulty":"medium"}
  ],
  cultural: [
    {"question":"What do you value most in a team or company culture, and why?","category":"cultural","difficulty":"easy"},
    {"question":"Can you tell me about a time when you had to adapt to a new technology or process? How did you handle it?","category":"cultural","difficulty":"easy"},
    {"question":"How do you prioritize your own professional development and continuous learning?","category":"cultural","difficulty":"easy"},
    {"question":"What do you think are the most important qualities for a software engineer to have, and why?","category":"cultural","difficulty":"easy"}
  ]
};

const sampleResponses = {
  technical: [
    "Python and FastAPI are basically the same thing. I usually just write SQL queries inside the frontend code.",
    "I don't bother optimizing APIs; I just add more servers when it's slow.",
    "PostgreSQL and MySQL are interchangeable; I never really check compatibility or performance.",
    "Docker is just a way to compress files. I don't use containers in projects.",
    "Errors in Python? I usually just ignore them and hope nothing crashes.",
    "Cloud platforms are too complicated. I usually deploy projects by copying files via FTP."
  ],
  behavioral: [
    "I avoid collaborating with others as much as possible. I prefer to do everything myself.",
    "Debugging is unnecessary; I just guess what might be wrong.",
    "I don't write unit tests or integration tests. Tests slow down development.",
    "Feedback on my code? I usually ignore it or argue with the reviewer.",
    "Code reviews are a waste of time; I rarely look at other people's code."
  ],
  situational: [
    "If I had to design a new API, I would just copy an existing endpoint without thinking about performance or security.",
    "If the database schema needs changes, I just make random updates without informing the team.",
    "Optimizing a slow API? I would just hope the user doesn't notice.",
    "When balancing design trade-offs, I usually choose whatever is easiest for me, ignoring scalability and maintainability."
  ],
  cultural: [
    "I don't really care about team culture; I just want to finish my tasks.",
    "Adapting to new technologies is boring, so I try to avoid it.",
    "Professional development? I don't spend time learning new things; I just stick with what I know."
  ]
};

// Function to flatten responses into array format
function formatResponses(responseObj) {
  const allResponses = [];
  
  Object.keys(responseObj).forEach(category => {
    responseObj[category].forEach(answer => {
      allResponses.push(answer);
    });
  });
  
  return allResponses;
}

async function insertResponses() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log(`Inserting responses for assessment: ${ASSESSMENT_ID}\n`);

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

        console.log('✓ Assessment found');
        console.log(`  Current Status: ${assessment.status}`);

        // Update assessment with questions and set to completed
        db.run(
          `UPDATE assessments 
           SET questions = ?, status = 'completed'
           WHERE id = ?`,
          [JSON.stringify(sampleQuestions), ASSESSMENT_ID],
          (err) => {
            if (err) {
              console.error('❌ Error updating assessment:', err);
              return reject(err);
            }
            console.log('✓ Updated assessment questions and status\n');

            // Check if response already exists
            db.get(
              'SELECT * FROM assessment_response WHERE response LIKE ?',
              [`%"assessmentId":"${ASSESSMENT_ID}"%`],
              (err, existingResponse) => {
                if (err) {
                  console.error('❌ Error checking existing response:', err);
                  return reject(err);
                }

                const formattedResponses = formatResponses(sampleResponses);
                const responseData = JSON.stringify({
                  assessmentId: ASSESSMENT_ID,
                  responses: formattedResponses
                });

                if (existingResponse) {
                  // Update existing response
                  console.log('⚠️  Response already exists. Updating...');
                  
                  db.run(
                    'UPDATE assessment_response SET response = ? WHERE id = ?',
                    [responseData, existingResponse.id],
                    (err) => {
                      if (err) {
                        console.error('❌ Error updating response:', err);
                        return reject(err);
                      }
                      console.log(`✓ Updated assessment response: ${existingResponse.id}\n`);
                      console.log('✅ Response data updated successfully!\n');
                      console.log('Response data structure:');
                      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
                      resolve();
                    }
                  );
                } else {
                  // Create new response
                  const responseId = uuidv4();
                  
                  db.run(
                    'INSERT INTO assessment_response (id, response) VALUES (?, ?)',
                    [responseId, responseData],
                    (err) => {
                      if (err) {
                        console.error('❌ Error creating response:', err);
                        return reject(err);
                      }
                      console.log(`✓ Created assessment response: ${responseId}\n`);
                      console.log('✅ Response data inserted successfully!\n');
                      console.log('Response data structure:');
                      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
                      resolve();
                    }
                  );
                }
              }
            );
          }
        );
      });
    });
  });
}

// Run the script
insertResponses()
  .then(() => {
    console.log('\n🔍 Next steps:');
    console.log('   1. Navigate to the job detail page');
    console.log('   2. Find the candidate with completed assessment');
    console.log('   3. Click "Create Analysis" button');
    console.log('   4. The AI will analyze the responses\n');
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      } else {
        console.log('Database connection closed.');
        process.exit(0);
      }
    });
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    db.close();
    process.exit(1);
  });