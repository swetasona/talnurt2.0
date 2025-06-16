const { id } = req.query;
const { status, feedback } = req.body;

if (!id) {
  releaseConnection();
  return res.status(400).json({ error: 'Candidate ID is required' });
}

// Ensure status is lowercase for consistency
const normalizedStatus = status ? status.toLowerCase() : null;

if (!normalizedStatus || !['pending', 'approved', 'rejected'].includes(normalizedStatus)) {
  releaseConnection();
  return res.status(400).json({ error: 'Valid status is required (pending, approved, or rejected)' });
} 