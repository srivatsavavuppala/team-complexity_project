const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const db = database.getDb();

// Get dashboard statistics
router.get('/stats', authenticateToken, (req, res) => {
  const queries = [
    // Total candidates
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM candidates', (err, row) => {
        if (err) reject(err);
        else resolve({ totalCandidates: row.total });
      });
    }),
    
    // Total job positions
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM job_positions', (err, row) => {
        if (err) reject(err);
        else resolve({ totalJobs: row.total });
      });
    }),
    
    // Total interviews
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM interviews', (err, row) => {
        if (err) reject(err);
        else resolve({ totalInterviews: row.total });
      });
    }),
    
    // Interviews by status
    new Promise((resolve, reject) => {
      db.all(
        'SELECT status, COUNT(*) as count FROM interviews GROUP BY status',
        (err, rows) => {
          if (err) reject(err);
          else {
            const interviewsByStatus = {};
            rows.forEach(row => {
              interviewsByStatus[row.status] = row.count;
            });
            resolve({ interviewsByStatus });
          }
        }
      );
    }),
    
    // Recent candidates (last 30 days)
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM candidates WHERE created_at >= date('now', '-30 days')",
        (err, row) => {
          if (err) reject(err);
          else resolve({ recentCandidates: row.count });
        }
      );
    }),
    
    // Recent interviews (last 30 days)
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM interviews WHERE created_at >= date('now', '-30 days')",
        (err, row) => {
          if (err) reject(err);
          else resolve({ recentInterviews: row.count });
        }
      );
    }),
    
    // Average interview score
    new Promise((resolve, reject) => {
      db.get(
        'SELECT AVG(score) as average FROM interviews WHERE score IS NOT NULL',
        (err, row) => {
          if (err) reject(err);
          else resolve({ averageInterviewScore: Math.round(row.average || 0) });
        }
      );
    }),
    
    // Top skills from candidates
    new Promise((resolve, reject) => {
      db.all(
        'SELECT skills FROM candidates WHERE skills IS NOT NULL AND skills != "[]"',
        (err, rows) => {
          if (err) reject(err);
          else {
            const skillCount = {};
            rows.forEach(row => {
              try {
                const skills = JSON.parse(row.skills);
                skills.forEach(skill => {
                  skillCount[skill] = (skillCount[skill] || 0) + 1;
                });
              } catch (e) {
                // Skip invalid JSON
              }
            });
            
            const topSkills = Object.entries(skillCount)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([skill, count]) => ({ skill, count }));
            
            resolve({ topSkills });
          }
        }
      );
    })
  ];

  Promise.all(queries)
    .then(results => {
      const stats = Object.assign({}, ...results);
      res.json({ stats });
    })
    .catch(error => {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    });
});

// Get recent activity
router.get('/activity', authenticateToken, (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const queries = [
    // Recent candidates
    new Promise((resolve, reject) => {
      db.all(
        `SELECT 'candidate' as type, id, name as title, created_at as timestamp
         FROM candidates 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [Math.ceil(limit / 3)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    }),
    
    // Recent job positions
    new Promise((resolve, reject) => {
      db.all(
        `SELECT 'job' as type, id, title, created_at as timestamp
         FROM job_positions 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [Math.ceil(limit / 3)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    }),
    
    // Recent interviews
    new Promise((resolve, reject) => {
      db.all(
        `SELECT 'interview' as type, i.id, 
                c.name || ' - ' || j.title as title, 
                i.created_at as timestamp,
                i.status
         FROM interviews i
         JOIN candidates c ON i.candidate_id = c.id
         JOIN job_positions j ON i.job_position_id = j.id
         ORDER BY i.created_at DESC 
         LIMIT ?`,
        [Math.ceil(limit / 3)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    })
  ];

  Promise.all(queries)
    .then(results => {
      const activities = results.flat()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      res.json({ activities });
    })
    .catch(error => {
      console.error('Dashboard activity error:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    });
});

// Get interview performance trends
router.get('/trends/interviews', authenticateToken, (req, res) => {
  const days = parseInt(req.query.days) || 30;

  db.all(
    `SELECT 
       date(created_at) as date,
       COUNT(*) as total_interviews,
       AVG(CASE WHEN score IS NOT NULL THEN score ELSE NULL END) as avg_score,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_interviews
     FROM interviews 
     WHERE created_at >= date('now', '-${days} days')
     GROUP BY date(created_at)
     ORDER BY date(created_at)`,
    (err, rows) => {
      if (err) {
        console.error('Trends query error:', err);
        return res.status(500).json({ error: 'Failed to fetch interview trends' });
      }

      const trends = rows.map(row => ({
        date: row.date,
        totalInterviews: row.total_interviews,
        averageScore: Math.round(row.avg_score || 0),
        completedInterviews: row.completed_interviews
      }));

      res.json({ trends });
    }
  );
});

// Get candidate pipeline
router.get('/pipeline', authenticateToken, (req, res) => {
  const queries = [
    // Candidates by experience level
    new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           CASE 
             WHEN experience_years < 2 THEN 'Junior (0-2 years)'
             WHEN experience_years < 5 THEN 'Mid-level (2-5 years)'
             WHEN experience_years < 10 THEN 'Senior (5-10 years)'
             ELSE 'Expert (10+ years)'
           END as level,
           COUNT(*) as count
         FROM candidates 
         WHERE experience_years IS NOT NULL
         GROUP BY 
           CASE 
             WHEN experience_years < 2 THEN 'Junior (0-2 years)'
             WHEN experience_years < 5 THEN 'Mid-level (2-5 years)'
             WHEN experience_years < 10 THEN 'Senior (5-10 years)'
             ELSE 'Expert (10+ years)'
           END`,
        (err, rows) => {
          if (err) reject(err);
          else resolve({ candidatesByExperience: rows });
        }
      );
    }),
    
    // Interview success rate by job
    new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           j.title,
           COUNT(i.id) as total_interviews,
           COUNT(CASE WHEN i.score >= 70 THEN 1 END) as successful_interviews,
           ROUND(COUNT(CASE WHEN i.score >= 70 THEN 1 END) * 100.0 / COUNT(i.id), 1) as success_rate
         FROM job_positions j
         LEFT JOIN interviews i ON j.id = i.job_position_id AND i.score IS NOT NULL
         GROUP BY j.id, j.title
         HAVING COUNT(i.id) > 0
         ORDER BY success_rate DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve({ successRateByJob: rows });
        }
      );
    })
  ];

  Promise.all(queries)
    .then(results => {
      const pipeline = Object.assign({}, ...results);
      res.json({ pipeline });
    })
    .catch(error => {
      console.error('Pipeline error:', error);
      res.status(500).json({ error: 'Failed to fetch pipeline data' });
    });
});

module.exports = router;