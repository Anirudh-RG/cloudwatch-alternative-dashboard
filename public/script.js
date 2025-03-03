let allData = null;
const commonChartOptions = {
  chart: {
    type: 'line',
    animation: true,
    style: {
      fontFamily: 'Arial, sans-serif'
    }
  },
  time: {
    useUTC: false
  },
  title: {
    text: null
  },
  credits: {
    enabled: false
  },
  legend: {
    enabled: false
  },
  xAxis: {
    type: 'datetime',
    tickPixelInterval: 150,
    labels: {
      formatter: function() {
        return Highcharts.dateFormat('%H:%M:%S', this.value);
      }
    }
  },
  yAxis: {
    title: {
      text: 'Percentage'
    },
    min: 0,
    max: 100,
    tickAmount: 5,
    labels: {
      format: '{value}%'
    }
  },
  tooltip: {
    formatter: function() {
      return '<b>' + this.series.name + '</b><br/>' +
        Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
        Highcharts.numberFormat(this.y, 2) + '%';
    }
  },
  plotOptions: {
    line: {
      marker: {
        enabled: false
      }
    },
    series: {
      states: {
        hover: {
          lineWidth: 3
        }
      }
    }
  }
};

// Initialize charts
function initCharts() {
  // CPU Chart
  Highcharts.chart('cpuChart', {
    ...commonChartOptions,
    series: [{
      name: 'CPU Usage',
      color: '#FF6384',
      data: []
    }]
  });

  // Memory Chart
  Highcharts.chart('memoryChart', {
    ...commonChartOptions,
    series: [{
      name: 'Memory Usage',
      color: '#36A2EB',
      data: []
    }]
  });

  // Disk Chart
  Highcharts.chart('diskChart', {
    ...commonChartOptions,
    series: [{
      name: 'Disk Usage',
      color: '#4BC0C0',
      data: []
    }]
  });

  // Combined Chart
  Highcharts.chart('combinedChart', {
    ...commonChartOptions,
    legend: {
      enabled: true,
      align: 'center',
      verticalAlign: 'top',
      layout: 'horizontal'
    },
    series: [{
      name: 'CPU Usage',
      color: '#FF6384',
      data: []
    }, {
      name: 'Memory Usage',
      color: '#36A2EB',
      data: []
    }, {
      name: 'Disk Usage',
      color: '#4BC0C0',
      data: []
    }]
  });
}

function formatDate(date) {
  return date.toLocaleTimeString();
}

function calculateAverages(data) {
  console.log(data);
  
  if (!data || !data.cpu || data.cpu.length === 0 || data.memory.length === 0 || data.disk.length === 0){
    console.log("some error occured");
    return;
  } 
  if(data.memory.length !== data.cpu.length || data.cpu.length !== data.disk.length){
    console.log("fetched data length is unmatched");
  }
    
  const avgCpu = (data.cpu.reduce((sum,entry) => sum+entry[1],0)/data.cpu.length).toFixed(1);
  const avgMem = (data.memory.reduce((sum,entry) => sum+entry[1],0)/data.memory.length).toFixed(1);
  const avgDisk= (data.disk.reduce((sum,entry) => sum+entry[1],0)/data.disk.length).toFixed(1);
  document.getElementById('avgCpu').textContent = avgCpu + '%';
  document.getElementById('avgMem').textContent = avgMem + '%';
  document.getElementById('avgDisk').textContent = avgDisk + '%';
  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
  console.log("updated all fields");
}

// Fetch data from API
async function fetchData() {
  try{
    const response = await fetch("http://localhost:3000/api/metrics")
    if(!response.ok){
      throw new Error('Http error');
    }
    const allData = await response.json();
    const procesedData = processDataForCharts(allData);
    updateCharts(procesedData);
    calculateAverages(procesedData);


  }catch(err){
    console.log(err);
  }
    
}

// Process data for Highcharts
function processDataForCharts(data) {
  if (!data || !data.timestamps || data.timestamps.length === 0) return null;
  
  const cpuData = [];
  const memoryData = [];
  const diskData = [];
  
  for (let i = 0; i < data.timestamps.length; i++) {
    const timestamp = new Date(data.timestamps[i]).getTime();
    
    // Create data points for each metric
    cpuData.push([timestamp, data.cpu[i]]);
    memoryData.push([timestamp, data.memory[i]]);
    diskData.push([timestamp, data.disk[i]]);
  }
  
  return {
    cpu: cpuData,
    memory: memoryData,
    disk: diskData
  };
}

// Update all charts with new data
function updateCharts(data) {
  if (!data) return;
  
  // Update CPU Chart
  const cpuChart = Highcharts.charts.find(chart => chart && chart.renderTo.id === 'cpuChart');
  if (cpuChart) {
    cpuChart.series[0].setData(data.cpu, true);
  }
  
  // Update Memory Chart
  const memoryChart = Highcharts.charts.find(chart => chart && chart.renderTo.id === 'memoryChart');
  if (memoryChart) {
    memoryChart.series[0].setData(data.memory, true);
  }
  
  // Update Disk Chart
  const diskChart = Highcharts.charts.find(chart => chart && chart.renderTo.id === 'diskChart');
  if (diskChart) {
    diskChart.series[0].setData(data.disk, true);
  }
  
  // Update Combined Chart
  const combinedChart = Highcharts.charts.find(chart => chart && chart.renderTo.id === 'combinedChart');
  if (combinedChart) {
    combinedChart.series[0].setData(data.cpu, false);
    combinedChart.series[1].setData(data.memory, false);
    combinedChart.series[2].setData(data.disk, true);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  fetchData();
  
  // Auto-refresh every 5 minutes
  setInterval(fetchData, 5 * 60 * 1000);
});