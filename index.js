const express = require('express');
const app = express();

const movieRoute = require('./routes/movie');

app.use('/api/movie', movieRoute);

app.get('/', (req, res) => {
  res.send('🎬 Public Domain Movie Server is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🎬 Movie Server running on port', PORT);
});
