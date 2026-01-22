const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Agentic Empire!');
});

app.listen(3000, () => {
  console.log('Agentic Empire listening on port 3000');
});