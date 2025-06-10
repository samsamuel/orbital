import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/fetch-feed', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(500).json({ error: 'Failed to fetch feed' });
    const xml = await response.text();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching feed' });
  }
});

app.listen(PORT, () => {
  console.log(`Feed proxy server running on port ${PORT}`);
});
