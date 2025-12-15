const express = require('express');
const axios = require('axios');
const router = express.Router();

const VIDEO_REGEX = /\.(mp4|webm|ogv|mkv|avi)$/i;

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Query missing" });

    // 🔥 IMPORTANT: rows=10 (not 1)
    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      q
    )}+AND+mediatype:(movies)&rows=10&output=json`;

    const search = await axios.get(searchUrl);
    const docs = search.data?.response?.docs || [];

    for (const doc of docs) {
      const identifier = doc.identifier;

      try {
        const meta = await axios.get(`https://archive.org/metadata/${identifier}`);
        const files = meta.data?.files || [];

        const video = files.find(f =>
          f.name &&
          (
            VIDEO_REGEX.test(f.name) ||
            /h\.?264|mpeg4|mp4/i.test(f.format || "")
          )
        );

        if (!video) continue;

        return res.json({
          found: true,
          title: doc.title || identifier,
          identifier,
          file: video.name,
          size: video.size || null,
          download: `https://archive.org/download/${identifier}/${video.name}`
        });

      } catch (e) {
        continue;
      }
    }

    // Agar koi valid movie na mile
    return res.json({ found: false });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
