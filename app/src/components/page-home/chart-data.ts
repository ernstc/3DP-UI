const now = (new Date()).valueOf();

export let chartData = {
    // The type of chart we want to create
    type: 'line',
    // The data for our dataset
    data: {
        datasets: [
        {
            fill: false,
            label: 'Bed',                
            borderColor: 'rgba(17, 99, 130, .5)',
            borderWidth: 6,
            pointRadius: 0,
            data: [],
            target: {
                //value: 110,
                borderWidth: 1
            }
        },
        {
            fill: false,
            label: 'E0',                
            borderColor: 'rgba(121, 7, 50, .5)',
            borderWidth: 6,
            pointRadius: 0,
            data: [],
            target: {
                //value: 110,
                borderWidth: 1
            }
        }]
    },
    // Configuration options go here
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,

        legend: {
            labels: {
                fontColor: "black",
                fontFamily: '\'Open Sans\', sans-serif',
                fontSize: 22
            }
        },

        horizontalLine: [{
            y: 0, 
            borderColor: "rgba(17, 99, 130, 0.7)",
            borderWidth: 2
        }, {
            y: 0,
            borderColor: "rgba(121, 7, 50, 0.7)",
            borderWidth: 2
        }],               
        
        scales: {                
            yAxes: [{
                display: true,
                gridLines: {
                    drawBorder: true,
                    color: 'transparent'
                },
                ticks: {
                    fontColor: "black",
                    fontSize: 18,
                    fontFamily: '\'PT Mono\', monospace',
                    suggestedMin: 0,
                    suggestedMax: 250,
                }
            }],
            xAxes: [{
                display: false,
                type: 'time',
                time: {
                    unit: 'minute',
                }
            }]
        }
    }
};
