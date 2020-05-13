import {Chart} from "chart.js"

var horizonalLinePlugin = {

    beforeDraw: function(chartInstance: Chart) {

      var yScale = chartInstance.scales["y-axis-0"];
      var canvas = chartInstance.chart;
      var ctx = canvas.ctx;
      var index: number;
      var line: any;
      var style: string;
      var yValue: number;
  
      if (chartInstance.options.horizontalLine) {
        for (index = 0; index < chartInstance.options.horizontalLine.length; index++) {
          line = chartInstance.options.horizontalLine[index];
  
          if (!line.borderColor) {
            style = "rgba(169,169,169, .6)";
          } else {
            style = line.borderColor;
          }
  
          if (line.y) {
            yValue = yScale.getPixelForValue(line.y);
          } else {
            yValue = 0;
          }
  
          if (line.borderWidth) {
              ctx.lineWidth = line.borderWidth;
          } else {
            ctx.lineWidth = 3;
          }
  
          if (yValue) {
            ctx.beginPath();
            ctx.moveTo(chartInstance.chartArea.left, yValue);
            ctx.lineTo(canvas.width, yValue);
            ctx.strokeStyle = style;
            ctx.stroke();
          }
  
          if (line.text) {
            ctx.fillStyle = style;
            ctx.fillText(line.text, chartInstance.chartArea.left, yValue + ctx.lineWidth);
          }
        }
        return;
      };
    }
};
Chart.pluginService.register(horizonalLinePlugin);
