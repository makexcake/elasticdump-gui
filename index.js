const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
// const updateFilterTimestamp = require('./utils/updateFilterTimestamp');

const filterFilePath = 'filters/filter.json';
const app = express();
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/default-filter', (req, res) => {
  res.sendFile(path.join(__dirname, 'filters', 'default-filter.json'), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

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
  let filter = req.body.filter;

  const useHttps = scheme === 'https';

  // If no filter is provided in gui, use the default filter
  if (filter == null || filter === '') {
    const existingFilterJson = fs.readFileSync(filterFilePath, 'utf8');
    const existingFilter = JSON.parse(existingFilterJson);
    // const updatedFilter = updateFilterTimestamp(existingFilter);
    const updatedFilterVariable = updatedFilter;
    console.log('Updated Filter:', updatedFilterVariable);
    filter = JSON.stringify(updatedFilterVariable);
  }

  const commands = [
    'cd /app/imported-indices',
    `elasticdump --output=${outputFilename}-mapping.json --input=${scheme}://${username}:${password}@${endpoint}/${indexName} --type=mapping --limit=10000`,
    `elasticdump --output=${outputFilename}-data.json --input=${scheme}://${username}:${password}@${endpoint}/${indexName} --type=data --limit=10000 --searchBody='${JSON.stringify(filter)}'`,
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