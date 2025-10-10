const matchingService = require('../services/matchingService');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = jobSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { title, description, requirements, skillsRequired, experienceRequired } = value;
    const jobId = uuidv4();

    db.run(
      `INSERT INTO job_positions (id, title, description, requirements, skills_required, experience_required, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [jobId, title, description, requirements, skillsRequired, experienceRequired, req.user.userId],
      async function (err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create job position' });
        }

        const job = {
          id: jobId,
          title,
          description,
          requirements,
          skills_required: skillsRequired,
          experience_required: experienceRequired
        };

        // 🔥 Auto-match candidates for this job
        const matches = await matchingService.matchCandidatesForJob(job);
        await matchingService.saveMatches(jobId, matches);

        res.status(201).json({
          message: 'Job position created and candidates matched successfully',
          job,
          matchesCount: matches.length
        });
      }
    );
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
