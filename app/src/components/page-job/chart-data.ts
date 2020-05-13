var layers = [40, 45, 55, 42, 30, 33, 18, 44, 40, 45, 55, 42, 30, 33, 18, 44, 40, 70, 85, 42, 50, 53, 38, 44,40, 45, 55, 42, 30, 33, 18, 44, 40, 45, 55, 42, 30, 33, 18, 44, 40, 70, 85, 42, 50, 53, 38, 44];


export let chartData = {
    // The type of chart we want to create
    type: 'line',
    // The data for our dataset
    data: {
        datasets: [
        {
            fill: false,
            label: 'seconds / layer',
            borderColor: 'rgba(200, 104, 11, .5)',
            borderWidth: 6,
            pointRadius: 3,
            data: [0].map(function(e, i) { return {x: i, y: e}}),
            target: {
                value: 110,
                borderWidth: 2
            },
            lineTension: 0
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
        
        scales: {                
            yAxes: [{
                display: true,
                gridLines: {
                    drawBorder: true,
                    //color: 'transparent'
                },
                ticks: {
                    fontColor: "black",
                    fontSize: 18,
                    fontFamily: '\'PT Mono\', monospace',
                    suggestedMin: 0,
                    //suggestedMax: 250,
                }
            }],
            xAxes: [{
                display: false,
                type: 'time',
                time: {
                    unit: 'second',
                },
                ticks: {
                    min: 0,
                    max: 40
                }
            }]
        }
    }
};
