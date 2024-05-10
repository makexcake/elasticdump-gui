const express = require('express');
const { exec } = require('child_process');
const path = require('path');


const app = express();

app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/extract-logs', (req, res) => {
  const scheme = process.env.SCHEME || 'http';
  const username = req.body.username || process.env.USERNAME;
  const password = req.body.password || process.env.PASSWORD;
  const endpoint = req.body.endpoint || process.env.ENDPOINT;
  const indexName = req.body.indexName || process.env.INDEX_NAME;
  const outputFilename = req.body.outputFilename;
  const filter = req.body.filter;
  const useHttps = scheme === 'https';

  const commands = [
    'cd /app/imported-indices',
    `elasticdump --output=${outputFilename}-mapping.json --input=${scheme}://${username}:${password}@${endpoint}/${indexName} --type=mapping --limit=10000`,
    `elasticdump --output=${outputFilename}-data.json --input=${scheme}://${username}:${password}@${endpoint}/${indexName} --type=data --limit=10000 --searchBody='${filter}'`,
  ];

  exec(commands.join(' && '), (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      res.status(500).send('An error occurred while extracting logs.');
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
    res.send('Logs extracted successfully!');
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});