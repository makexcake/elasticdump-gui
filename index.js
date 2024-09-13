const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static')));

// Serve the default filter
app.get('/default-filter', (req, res) => {
  const defaultFilterPath = path.join(__dirname, 'filters', 'default-filter.json');
  
  // Check if the default filter file exists
  if (fs.existsSync(defaultFilterPath)) {
    res.sendFile(defaultFilterPath, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    res.status(404).send('Default filter not found');
  }
});

// Serve the HTML file at the root path
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

  // Build the input URL
  let inputUrl;
  if (username && password) {
    inputUrl = `${scheme}://${username}:${password}@${endpoint}/${indexName}`;
  } else {
    inputUrl = `${scheme}://${endpoint}/${indexName}`;
  }

  const commands = [
    'cd /app/imported-indices',
    `elasticdump --output=${outputFilename}-mapping.json --input=${inputUrl} --type=mapping --limit=10000`,
  ];

  // Check if filter exists and is not empty
  if (filter && Object.keys(filter).length > 0) {
    commands.push(`elasticdump --output=${outputFilename}-data.json --input=${inputUrl} --type=data --limit=10000 --searchBody='${JSON.stringify(filter)}'`);
  } else {
    commands.push(`elasticdump --output=${outputFilename}-data.json --input=${inputUrl} --type=data --limit=10000`);
  }

  const childProcess = exec(commands.join(' && '));

  childProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  childProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Error: ${data}`);
      }
    });
  });

  childProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    res.send('Logs extracted successfully!');
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});