// services/matchingService.js
const db = require('../config/database').getDb();

function calculateMatchScore(job, candidate) {
  let score = 0;
  let maxScore = 0;

  // Skills overlap scoring
  const jobSkills = (job.skills_required || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const candidateSkills = (candidate.skills || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

  if (jobSkills.length > 0) {
    maxScore += 70;
    const matches = jobSkills.filter(skill => candidateSkills.includes(skill));
    score += (matches.length / jobSkills.length) * 70;
  }

  // Experience scoring
  if (job.experience_required != null) {
    maxScore += 30;
    const expDiff = candidate.experience_years - job.experience_required;
    if (expDiff >= 0) {
      score += 30; // meets or exceeds requirement
    } else if (expDiff > -2) {
      score += 15; // slightly under
    }
  }

  // Normalize to 100
  if (maxScore > 0) {
    score = Math.round((score / maxScore) * 100);
  }

  return score;
}

async function matchCandidatesForJob(job) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM candidates', [], (err, candidates) => {
      if (err) return reject(err);

      const matches = candidates.map(candidate => {
        const score = calculateMatchScore(job, candidate);
        return {
          candidate_id: candidate.id,
          job_position_id: job.id,
          match_score: score,
          ai_reasoning: JSON.stringify({
            reasoning: `Matched based on skill overlap and experience level.`,
          })
        };
      }).filter(m => m.match_score > 0); // optionally filter weak matches

      resolve(matches);
    });
  });
}

async function saveMatches(jobId, matches) {
  return new Promise((resolve, reject) => {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO candidate_matches (id, candidate_id, job_position_id, match_score, ai_reasoning)
      VALUES (?, ?, ?, ?, ?)
    `);

    db.serialize(() => {
      matches.forEach(m => {
        const id = `${m.job_position_id}_${m.candidate_id}`;
        insertStmt.run(id, m.candidate_id, m.job_position_id, m.match_score, m.ai_reasoning);
      });

      insertStmt.finalize(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

module.exports = {
  matchCandidatesForJob,
  saveMatches
};
