// Chart objects
let cpuChart, memoryChart, diskChart, combinedChart;
let allData = null;


// Initialize charts
function initCharts() {
  const cpuCtx = document.getElementById('cpuChart').getContext('2d');
  const memoryCtx = document.getElementById('memoryChart').getContext('2d');
  const diskCtx = document.getElementById('diskChart').getContext('2d');
  const combinedCtx = document.getElementById('combinedChart').getContext('2d');

  // Chart configuration
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4
      }
    }
  };

  // CPU Chart
  cpuChart = new Chart(cpuCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'CPU Usage',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2
      }]
    },
    options: commonOptions
  });

  // Memory Chart
  memoryChart = new Chart(memoryCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Memory Usage',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2
      }]
    },
    options: commonOptions
  });

  // Disk Chart
  diskChart = new Chart(diskCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Disk Usage',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2
      }]
    },
    options: commonOptions
  });

  // Combined Chart
  combinedChart = new Chart(combinedCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'CPU',
          data: [],
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2
        },
        {
          label: 'Memory',
          data: [],
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2
        },
        {
          label: 'Disk',
          data: [],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2
        }
      ]
    },
    options: {
      ...commonOptions,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  });
}

// Format date for display
function formatDate(date) {
  return date.toLocaleTimeString();
}

// Calculate averages
function calculateAverages(data) {
  if (!data || !data.cpu || data.cpu.length === 0) return;
  
  const sumCpu = data.cpu.reduce((a, b) => a + b, 0);
  const sumMem = data.memory.reduce((a, b) => a + b, 0);
  const sumDisk = data.disk.reduce((a, b) => a + b, 0);
  
  const avgCpu = (sumCpu / data.cpu.length).toFixed(1);
  const avgMem = (sumMem / data.memory.length).toFixed(1);
  const avgDisk = (sumDisk / data.disk.length).toFixed(1);
  
  document.getElementById('avgCpu').textContent = avgCpu + '%';
  document.getElementById('avgMem').textContent = avgMem + '%';
  document.getElementById('avgDisk').textContent = avgDisk + '%';
  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

// Fetch data from API
async function fetchData() {
  try {
    const response = await fetch('/api/metrics');
    allData = await response.json();
    
    // Format dates for labels
    const labels = allData.timestamps.map(timestamp => formatDate(new Date(timestamp)));
    
    // Update charts
    updateChart(cpuChart, labels, allData.cpu);
    updateChart(memoryChart, labels, allData.memory);
    updateChart(diskChart, labels, allData.disk);
    
    // Update combined chart
    combinedChart.data.labels = labels;
    combinedChart.data.datasets[0].data = allData.cpu;
    combinedChart.data.datasets[1].data = allData.memory;
    combinedChart.data.datasets[2].data = allData.disk;
    combinedChart.update();
    
    // Calculate averages
    calculateAverages(allData);
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}

// Update chart with new data
function updateChart(chart, labels, data) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  fetchData();
  
  // Auto-refresh every 5 minutes
  setInterval(fetchData, 5 * 60 * 1000);
});