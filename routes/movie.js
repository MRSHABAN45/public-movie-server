const express = require('express');
const axios = require('axios');
const router = express.Router();

const VIDEO_REGEX = /\.(mp4|webm|ogv|mkv|avi)$/i;

// GET /api/movie/search?q=movie name
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Query missing" });

    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      q
    )}+AND+mediatype:(movies)&rows=1&output=json`;

    const search = await axios.get(searchUrl);
    const doc = search.data?.response?.docs?.[0];

    if (!doc) return res.json({ found: false });

    const identifier = doc.identifier;

    const meta = await axios.get(`https://archive.org/metadata/${identifier}`);
    const files = meta.data?.files || [];

    const video = files.find(f =>
      f.name &&
      (
        VIDEO_REGEX.test(f.name) ||
        /h\.?264|mpeg4|mp4/i.test(f.format || "")
      )
    );

    if (!video) return res.json({ found: false });

    res.json({
      found: true,
      title: doc.title || identifier,
      identifier,
      file: video.name,
      size: video.size || null,
      download: `https://archive.org/download/${identifier}/${video.name}`
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
