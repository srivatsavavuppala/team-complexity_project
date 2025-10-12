const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = process.env.DB_PATH || path.join(__dirname, './database.sqlite');
const db = new sqlite3.Database(dbPath);

// The specific assessment ID to insert responses for
const ASSESSMENT_ID = '03cc0a50-003b-417a-9396-9e3928b2c955';

// Replace your current sampleQuestions with this updatedQuestions (your JSON preserved)
const sampleQuestions = {
  "meta": {
    "jobTitle": "SDE",
    "difficulty": "easy",
    "total_questions": 13,
    "notes": "Voice-recording friendly; all questions difficulty='easy'; 'readable' is for interviewer."
  },
  "technical": [
    {
      "question": "What is your experience with Python and FastAPI?",
      "readable": "Python and FastAPI experience",
      "category": "technical",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 30,
      "recommended_pause_ms": 15000,
      "follow_up": [
        "Can you give an example?"
      ]
    },
    {
      "question": "How do you optimize database queries in PostgreSQL or MySQL?",
      "readable": "Database query optimization",
      "category": "technical",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 45,
      "recommended_pause_ms": 20000,
      "follow_up": [
        "What tools do you use?"
      ]
    },
    {
      "question": "Can you explain the concept of RESTful APIs?",
      "readable": "RESTful APIs explanation",
      "category": "technical",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 20,
      "recommended_pause_ms": 10000,
      "follow_up": []
    },
    {
      "question": "What is your experience with containerization using Docker?",
      "readable": "Docker experience",
      "category": "technical",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 25,
      "recommended_pause_ms": 12000,
      "follow_up": [
        "How do you troubleshoot Docker issues?"
      ]
    },
    {
      "question": "How do you ensure high-performance systems in your development work?",
      "readable": "High-performance systems",
      "category": "technical",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 40,
      "recommended_pause_ms": 18000,
      "follow_up": []
    }
  ],
  "behavioral": [
    {
      "question": "Tell me about a time when you had to collaborate with a frontend developer to resolve an issue.",
      "readable": "Collaboration experience",
      "category": "behavioral",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 50,
      "recommended_pause_ms": 25000,
      "follow_up": [
        "What was the outcome?"
      ]
    },
    {
      "question": "Can you describe your experience with code reviews and how you handle feedback?",
      "readable": "Code review experience",
      "category": "behavioral",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 35,
      "recommended_pause_ms": 16000,
      "follow_up": []
    },
    {
      "question": "How do you approach debugging complex issues in your code?",
      "readable": "Debugging approach",
      "category": "behavioral",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 30,
      "recommended_pause_ms": 14000,
      "follow_up": [
        "Can you give an example?"
      ]
    },
    {
      "question": "Tell me about a project you worked on that you're particularly proud of and your role in it.",
      "readable": "Proud project experience",
      "category": "behavioral",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 45,
      "recommended_pause_ms": 22000,
      "follow_up": []
    }
  ],
  "situational": [
    {
      "question": "If you were tasked with optimizing a slow API endpoint, how would you approach the problem?",
      "readable": "Optimizing slow API",
      "category": "situational",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 40,
      "recommended_pause_ms": 20000,
      "follow_up": [
        "What tools would you use?"
      ]
    },
    {
      "question": "How would you handle a situation where a team member is not pulling their weight in a project?",
      "readable": "Team member not pulling weight",
      "category": "situational",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 50,
      "recommended_pause_ms": 25000,
      "follow_up": [
        "What would you say to the team member?"
      ]
    },
    {
      "question": "If you encountered a technical issue that you couldn't resolve on your own, what would you do?",
      "readable": "Technical issue resolution",
      "category": "situational",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 35,
      "recommended_pause_ms": 17000,
      "follow_up": []
    }
  ],
  "cultural": [
    {
      "question": "What do you value most in a team's culture and why?",
      "readable": "Team culture values",
      "category": "cultural",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 30,
      "recommended_pause_ms": 15000,
      "follow_up": []
    },
    {
      "question": "Can you tell me about a time when you had to adapt to a new team or work environment?",
      "readable": "Adapting to new team",
      "category": "cultural",
      "difficulty": "easy",
      "expected_answer_duration_seconds": 40,
      "recommended_pause_ms": 20000,
      "follow_up": [
        "What did you learn from the experience?"
      ]
    }
  ]
};

// Mock "perfect" answers for automated insertion / testing.
// Each array matches the order of questions inside the corresponding category.
const sampleResponses = {
  technical: [
    // 1
    "I have 4 years of production experience with Python and 2 years using FastAPI. I use Python for backend services, data processing, and scripting. With FastAPI I built several REST services that handle ~500 requests/minute — I rely on pydantic for schema validation, async endpoints for concurrency, and uvicorn/gunicorn for deployment. For example, I migrated an internal reporting API from Flask to FastAPI and reduced average response time from 320ms to 110ms by switching to async database calls and connection pooling.",
    // 2
    "I optimize queries by first profiling them with EXPLAIN (ANALYZE) and checking indexes and join order. Common steps: add/adjust indexes, rewrite joins/subqueries, avoid SELECT *, use LIMIT/offset carefully, and introduce materialized views for expensive aggregations. I also monitor slow-query logs, use pg_stat_statements (Postgres) or the MySQL slow query log, and employ connection pooling and caching (Redis) for repeated reads.",
    // 3
    "RESTful APIs are HTTP-based interfaces that map CRUD operations to HTTP verbs (GET, POST, PUT/PATCH, DELETE). They are resource-oriented, use URIs to identify resources, and should be stateless: each request contains all info needed. Good REST APIs use proper status codes, versioning, pagination, and input validation.",
    // 4
    "I use Docker daily for local development and deployment. I containerize services with multi-stage Dockerfiles to keep images small, define healthchecks, and use docker-compose for local stacks. For debugging, I inspect container logs, run an interactive shell into the container, and validate environment variables and mounted volumes. For example, I traced a missing config by mounting the container and verifying the file path.",
    // 5
    "I ensure performance by measuring first (metrics and APM), then addressing bottlenecks: optimize hot code paths, use asynchronous IO for concurrency, employ connection pooling and caching (Redis), and ensure database queries are efficient. I also use horizontal scaling where appropriate, set sensible timeouts/retries, and add load tests to validate improvements before rollout."
  ],

  behavioral: [
    // 1
    "On a recent project my backend service returned paginated data needed by the frontend. The frontend developer reported a mismatch in the data shape. I scheduled a short pairing session, we reviewed the API contract (OpenAPI), and discovered a missing field and inconsistent timestamps. I updated the serializer to include the field, added unit tests, and we agreed on the contract in the API spec. The issue was resolved within a day and reduced back-and-forth by documenting the contract.",
    // 2
    "I treat code reviews as a learning opportunity. I focus on correctness, readability, and long-term maintainability. When I receive feedback, I acknowledge it, ask clarifying questions if needed, and make the necessary changes. When giving feedback, I focus on concrete suggestions and explain rationale—I try to pair with the author for larger design feedback.",
    // 3
    "I debug by reproducing the issue, collecting logs and metrics, and narrowing down the scope. I use breakpoints, logging, and binary search on the code path to isolate the cause. Example: for a race condition in an async worker, I added additional logging, reproduced the issue under load, and then introduced locking around the shared resource and added retries to eliminate the failure.",
    // 4
    "I led a small service to convert incoming CSV reports into normalized database records. I designed the ETL pipeline, wrote the ingestion service, added validation and retry logic, and implemented monitoring. The service processed 10k+ records daily with error rates under 0.1%. I learned the importance of idempotency and good observability."
  ],

  situational: [
    // 1
    "I would start by measuring and profiling the endpoint (APM or flamegraphs) to identify the bottleneck — DB, CPU, network, or serialization. Then possible actions: add indexes or optimize queries, introduce caching (Redis) for repeated requests, enable pagination or limit fields returned, and use async processing or background jobs for heavy tasks. I’d validate each change with benchmarks before pushing to production.",
    // 2
    "First I’d try to understand why the person is underperforming: workload, blockers, or skill gaps. I’d have a private conversation to share observations and offer support, propose concrete changes (pairing, mentoring, reassign tasks) and set short measurable goals. If no improvement follows, escalate to the manager with documented attempts to resolve. My goal is to be fair, constructive, and solution-oriented.",
    // 3
    "I would attempt to collect relevant logs, reproduce the issue locally or in a staging environment, and search internal docs and previous issues. If I still can’t resolve it, I’d prepare a concise summary (what I tried, logs, hypotheses) and reach out to a subject-matter expert or the team with that context, so they can assist quickly. I prefer collaborative troubleshooting rather than blocking progress."
  ],

  cultural: [
    // 1
    "I value psychological safety and clear communication most—where people can ask questions and raise concerns without blame. That encourages experimentation and faster learning. It also helps when the team shares ownership and focuses on outcomes rather than title-driven decisions.",
    // 2
    "When I joined a cross-functional team with a different process, I focused on listening and learning the reasons behind existing practices for the first two weeks. Then I suggested small improvements (better CI feedback, clearer PR templates) and iterated based on feedback. I learned to balance respect for existing norms with pragmatic changes that reduce friction."
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