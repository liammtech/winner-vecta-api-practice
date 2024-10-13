const express = require('express');
const { getProjectById } = require('./winnerClient');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/project/:projectGuid', async (req, res) => {
  const { projectGuid } = req.params;
  const { shopGuid } = req.query;
  if (!shopGuid) {
    return res.status(400).json({ error: 'Missing shopGuid query parameter' });
  }
  try {
    const project = await getProjectById(shopGuid, projectGuid);
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
