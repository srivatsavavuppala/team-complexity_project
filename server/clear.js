const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || path.join(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath);

// The specific assessment ID to insert responses for
const ASSESSMENT_ID = '1ea2585d-69ba-415e-ab0c-01f3d1a98ba4';

// Sample questions that would be generated
const sampleQuestions = {
  technical: [
    {
      question: "Explain the difference between let, const, and var in JavaScript.",
      category: "technical",
      difficulty: "medium"
    },
    {
      question: "What is the Virtual DOM and how does React use it?",
      category: "technical",
      difficulty: "medium"
    },
    {
      question: "How would you optimize a slow SQL query?",
      category: "technical",
      difficulty: "hard"
    }
  ],
  behavioral: [
    {
      question: "Tell me about a time when you had to work with a difficult team member.",
      category: "behavioral",
      difficulty: "medium"
    },
    {
      question: "Describe a situation where you had to meet a tight deadline.",
      category: "behavioral",
      difficulty: "medium"
    }
  ],
  situational: [
    {
      question: "If you discovered a security vulnerability in production code, what would you do?",
      category: "situational",
      difficulty: "hard"
    },
    {
      question: "How would you handle conflicting priorities from different stakeholders?",
      category: "situational",
      difficulty: "medium"
    }
  ],
  cultural: [
    {
      question: "What type of work environment helps you be most productive?",
      category: "cultural",
      difficulty: "easy"
    },
    {
      question: "How do you approach continuous learning and professional development?",
      category: "cultural",
      difficulty: "medium"
    }
  ]
};

// Sample responses - good quality
const sampleResponses = {
  technical: [
    "Let, const, and var differ in scope and mutability. Var is function-scoped and can be redeclared, while let and const are block-scoped. Const cannot be reassigned after initialization, making it ideal for constants. I prefer using const by default and let only when reassignment is needed.",
    "The Virtual DOM is an in-memory representation of the actual DOM. React uses it to efficiently update the UI by comparing the virtual DOM with the previous version (diffing), then only updating the changed parts in the real DOM. This minimizes expensive DOM operations and improves performance.",
    "To optimize a slow query, I would: 1) Use EXPLAIN to analyze the execution plan, 2) Add appropriate indexes on frequently queried columns, 3) Avoid SELECT *, 4) Consider denormalization if needed, 5) Use query caching, and 6) Break complex queries into smaller ones if possible."
  ],
  behavioral: [
    "In my previous role, I worked with a team member who was resistant to code reviews. I scheduled a one-on-one to understand their concerns, explaining the benefits of peer review. We agreed on a constructive approach, and over time, they became one of our most thorough reviewers.",
    "During a product launch, we had only two weeks instead of the planned month. I prioritized features using MoSCoW method, coordinated daily standups, and delegated effectively. We launched on time with all critical features, and added nice-to-haves in the next sprint."
  ],
  situational: [
    "I would immediately assess the severity and impact of the vulnerability. If critical, I'd notify my team lead and security team right away. I'd prepare a patch, test it thoroughly, and coordinate with the team for an emergency deployment. Then, I'd document the incident and conduct a post-mortem to prevent similar issues.",
    "I would first understand the business impact of each priority, then arrange a meeting with all stakeholders to discuss trade-offs transparently. I'd propose a solution that balances different needs, document the decision, and ensure everyone agrees on the path forward."
  ],
  cultural: [
    "I thrive in collaborative environments with clear communication and autonomy. I appreciate having the flexibility to deep-focus when needed, but also enjoy pair programming and brainstorming sessions. Regular feedback and opportunities to learn from experienced colleagues are important to me.",
    "I'm passionate about continuous learning. I dedicate time each week to reading technical blogs, working on side projects, and contributing to open source. I also attend conferences when possible and enjoy mentoring junior developers, which helps reinforce my own knowledge."
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