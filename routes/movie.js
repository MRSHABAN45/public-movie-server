const express = require('express');
const axios = require('axios');
const router = express.Router();

// Supported video formats
const VIDEO_REGEX = /\.(mp4|webm|ogv|mkv|avi)$/i;

// Words to AVOID (HD / restricted files cause play issues)
const BAD_REGEX = /(access|hd|hires|master)/i;

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Query missing" });

    // 🔍 Search multiple results for better matching
    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      q
    )}+AND+mediatype:(movies)&rows=10&output=json`;

    const search = await axios.get(searchUrl);
    const docs = search.data?.response?.docs || [];

    for (const doc of docs) {
      const identifier = doc.identifier;

      try {
        // 📂 Fetch metadata
        const meta = await axios.get(`https://archive.org/metadata/${identifier}`);
        const files = meta.data?.files || [];

        // 🎥 Filter ONLY playable + WhatsApp-safe videos
        const videos = files.filter(f =>
          f.name &&
          VIDEO_REGEX.test(f.name) &&
          !BAD_REGEX.test(f.name) &&   // 🚫 skip HD / access files
          f.size                         // must have size
        );

        if (!videos.length) continue;

        // 📉 Select SMALLEST file (best for WhatsApp)
        videos.sort((a, b) => parseInt(a.size) - parseInt(b.size));
        const video = videos[0];

        return res.json({
          found: true,
          title: doc.title || identifier,
          identifier,
          file: video.name,
          size: parseInt(video.size),
          download: `https://archive.org/download/${identifier}/${video.name}`
        });

      } catch (e) {
        continue;
      }
    }

    // ❌ No playable movie found
    return res.json({ found: false });

  } catch (err) {
    console.error("MOVIE SEARCH ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
