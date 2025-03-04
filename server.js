// server.js - A simple Express server that serves metrics dashboard
const express = require('express');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/api/metrics', async (req, res) => {
  try {
    const metricsData = await readMetricsFile('/var/log/system_metrics.log');
    res.json(metricsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// app.get('/api/metrics', async (req, res) => {
//   try {
//     const response = await fetch('http://13.232.19.26/api/metrics'); // Fetch data from external API
//     if (!response.ok) {
//       throw new Error(`Failed to fetch metrics: ${response.statusText}`);
//     }
//     const metricsData = await response.json(); // Parse JSON response
//     res.json(metricsData); // Send it to client
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

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

  const lines = [];
  for await (const line of rl) {
    lines.push(line);
    if (lines.length > 10) lines.shift(); // Keep only the last 1000 lines
  }

  for (const line of lines) {
    const [timestamp, cpu, memory, disk] = line.split('|');
    data.timestamps.push(new Date(parseInt(timestamp) * 1000));
    data.cpu.push(parseFloat(cpu));
    data.memory.push(parseFloat(memory));
    data.disk.push(parseFloat(disk));
  }
  
  // console.log(data);
  return data;
}


app.listen(port, () => {
  console.log(`Metrics dashboard server running at http://localhost:${port}`);
});