let allData = null;

const sources = []

function handleSubmit(){
  const  input = document.getElementById("ip-input").value;
  console.log(input);
  const ipv4Regex = /^\d+\.\d+\.\d+\.\d+$/;
  if(ipv4Regex.test(input) && !sources.includes(input)){
    addToListOfSources(input);
  }else{
    console.log("ipv4 format is wrong or already in the list");
  }
  document.getElementById("ip-input").value = "";
}
function addToListOfSources(val){
    sources.push(val);
    // console.log(sources);
    localStorage.setItem("sources", JSON.stringify(sources));
    renderSourcesList();
    fetchData();

}

function renderSourcesList(){
  const sourcesList = document.getElementById("sources-list");
  sourcesList.innerHTML = "";
  sources.forEach(source => {
    const li = document.createElement("li");
    li.textContent = source;
    sourcesList.appendChild(li);
  });
}



function displaySources(){
  return sources;
}

function handleLocalDelete(){
  localStorage.removeItem("sources");
  sources.length = 0;
  renderSourcesList();
  updateCharts(null);
  calculateAverages(null);
  data_sources = [];
}
const commonChartOptions = {
  chart: {
    type: 'line',
    animation: true,
    style: {
      fontFamily: 'Arial, sans-serif'
    }
  },
  time:{
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
      format: '{value:%H:%M:%S}',
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
      const date = new Date(this.x);
      return '<b>' + this.series.name + '</b><br/>' +
        date.toLocaleString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) + '<br/>' +
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



function initCharts() {
  Highcharts.chart('cpuChart', { ...commonChartOptions, series: [] });
  Highcharts.chart('memoryChart', { ...commonChartOptions, series: [] });
  Highcharts.chart('diskChart', { ...commonChartOptions, series: [] });
  Highcharts.chart('combinedChart', { ...commonChartOptions, series: [] });
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
let data_sources = [];

function fetchData() {
  console.log(" fetchData called");
  console.log("Current sources:", sources);
  if (sources.length === 0) {
    console.log("No sources to fetch data from");
    return;
  }
  sources.forEach(source => {
    fetch(`http://${source}/api/metrics`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Data received from ${source}:`, data);
      data_sources.push(data);
      
    })
    .catch(error => {
      console.error(`Error fetching data from ${source}:`, error);
    })
    .finally(() => {
      postFetchOps();
    })
  });
}

function postFetchOps(){
  console.log("data_sources",data_sources);
  const procesedData = processDataForCharts(data_sources);
  console.log("procesedData",procesedData);
  updateCharts(procesedData);
  console.log("onto averages");
  calculateAverages(procesedData);
}

// Process data for Highcharts
function processDataForCharts(data) {
  console.log("in process data")
  console.log("data",data);
  // if (!data || !data.timestamps || data.timestamps.length === 0) return null;
  console.log("didt return null")
  const cpuData = [];
  const memoryData = [];
  const diskData = [];
  // console.log("data.timestamps",data[0].timestamps);
  for(let j=0;j<data.length;j++){
    for (let i = 0; i < data[j].timestamps.length; i++) {
      const timestamp = new Date(data[j].timestamps[i]).getTime(); 
      // Create data points for each metric
      // console.log(timestamp);
      cpuData.push([timestamp, data[j].cpu[i]]);
      memoryData.push([timestamp, data[j].memory[i]]);
      diskData.push([timestamp, data[j].disk[i]]);
      // console.log([timestamp, data.cpu[i]]);
    }
  }
  const object = {
    cpu: cpuData,
    memory: memoryData,
    disk: diskData
  };
  console.log("object",object);
  return object;
}

// Update all charts with new data
function updateCharts(allData) {
  if (!allData) return;
  console.log("in updateCharts", allData);

  const cpuChart = Highcharts.charts.find(chart => chart && chart.renderTo.id === 'cpuChart');
  const memoryChart = Highcharts.charts.find(chart => chart && chart.renderTo.id === 'memoryChart');
  const diskChart = Highcharts.charts.find(chart => chart && chart.renderTo.id === 'diskChart');
  const combinedChart = Highcharts.charts.find(chart => chart && chart.renderTo.id === 'combinedChart');

  const colors = ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#00A878'];

  // Since allData is an object, not an array, we directly use its properties
  if (cpuChart) {
    cpuChart.addSeries({
      name: 'CPU Usage',
      color: colors[0],
      data: allData.cpu
    }, true);
  }
  
  if (memoryChart) {
    memoryChart.addSeries({
      name: 'Memory Usage',
      color: colors[1],
      data: allData.memory
    }, true);
  }
  
  if (diskChart) {
    diskChart.addSeries({
      name: 'Disk Usage',
      color: colors[2],
      data: allData.disk
    }, true);
  }
  
  if (combinedChart) {
    combinedChart.addSeries({
      name: 'CPU Usage',
      color: colors[0],
      data: allData.cpu
    }, false);
    
    combinedChart.addSeries({
      name: 'Memory Usage',
      color: colors[1],
      data: allData.memory
    }, false);
    
    combinedChart.addSeries({
      name: 'Disk Usage',
      color: colors[2],
      data: allData.disk
    }, true);
  }
}


// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initCharts();
  const savedSources = localStorage.getItem("sources");
  if (savedSources) {
    sources.push(...JSON.parse(savedSources));
    renderSourcesList();
  }
  fetchData(); // Initial fetch
  setInterval(fetchData, 5 * 60 * 1000); // Fetch every 5 minutes
})