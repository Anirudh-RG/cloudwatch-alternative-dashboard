// server.js - A simple Express server that serves metrics dashboard
const express = require('express');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));

// API endpoint to get metrics data
app.get('/api/metrics', async (req, res) => {
  try {
    const metricsData = await readMetricsFile('/var/log/system_metrics.log');
    res.json(metricsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function to read and parse metrics file
async function readMetricsFile(filePath) {
  const data = {
    timestamps: [],
    cpu: [],
    memory: [],
    disk: []
  };

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const [timestamp, cpu, memory, disk] = line.split('|');
    // Convert timestamp to milliseconds for JavaScript Date
    data.timestamps.push(new Date(parseInt(timestamp) * 1000));
    data.cpu.push(parseFloat(cpu));
    data.memory.push(parseFloat(memory));
    data.disk.push(parseFloat(disk));
  }

  return data;
}

app.listen(port, () => {
  console.log(`Metrics dashboard server running at http://localhost:${port}`);
});