import {autoinject} from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import * as data from './chart-data';
import { Chart } from 'chart.js';
import { App }  from '../../app';
import { IScreen } from '../../IScreen';
import { IPrinter } from '../../printer';
import * as UI from '../../ui-messages';



const statusName: string[] = ['off', 'standby', 'active', 'fault'];

class TempData {
    x: Date;    // time
    y: number;  // temp
}


@autoinject
export class PageHome implements IScreen {

    private graphTemperatures: HTMLCanvasElement;
    
    private chart: Chart;
    private chartData: any;

    x: string = '0.00';
    y: string = '0.00';
    z: string = '0.00';
    homeAxis: string = 'XYZ';
    bedTemp: string = '0.0';
    bedStatus: string = 'off';
    toolName: string = 'E0';
    toolTemp: string = '0.0';
    toolStatus: string = 'off';
    fan: string = '0';

    public xSelected: boolean = false;
    public ySelected: boolean = false;
    public zSelected: boolean = false;
    public bedSelected: boolean = false;
    public toolSelected: boolean = false;

    xHomed: boolean = true;
    yHomed: boolean = true;
    zHomed: boolean = true;
    homeNeeded: boolean = false;

    private MAX_TEMPS = 1200;

    private bedTemps: TempData[] = [];
    private toolTemps: TempData[] = [];
  


    constructor(
        private app: App,
        private printer: IPrinter,
        private eventAggregator: EventAggregator
    ) {
        this.chartData = data.chartData;
    }

    attached() {
        this.setGraphTemp();        
    }

    setGraphTemp() {
        var ctx = this.graphTemperatures.getContext('2d');
        this.chart = new Chart(ctx, this.chartData);
    }

    public updateStatus(): void {
        this.xHomed = this.printer.view.axesHomed[0] == 1;
        this.yHomed = this.printer.view.axesHomed[1] == 1;
        this.zHomed = this.printer.view.axesHomed[2] == 1;

        this.homeNeeded = !(this.xHomed && this.yHomed && this.zHomed);

        var bedTempValue = this.printer.view.bedCurrentTemp;
        var toolTempValue = this.printer.view.toolCurrentTemp;

        this.x = this.printer.view.axisCoord[0].toFixed(2);
        this.y = this.printer.view.axisCoord[1].toFixed(2);
        this.z = this.printer.view.axisCoord[2].toFixed(2);
        this.bedTemp = bedTempValue.toFixed(1);
        this.bedStatus = statusName[this.printer.view.bedState];
        this.toolTemp = toolTempValue.toFixed(1);
        this.toolStatus = statusName[this.printer.view.toolState];
        this.fan = this.printer.view.toolFanPercent.toFixed(0);

        var now = (new Date()).valueOf();
        var t: number;

        this.bedTemps.push({
            x: new Date(now), 
            y: bedTempValue
        });
        t = now;
        while (this.bedTemps.length < this.MAX_TEMPS) {
            t = t - 300;
            this.bedTemps.push({
                x: new Date(t), 
                y: bedTempValue
            });
        }
        if (this.bedTemps.length > this.MAX_TEMPS) {
            this.bedTemps.shift();
        }

        this.toolTemps.push({
            x: new Date(now), 
            y: toolTempValue
        });
        t = now;
        while (this.toolTemps.length < this.MAX_TEMPS) {
            t = t - 300;
            this.toolTemps.push({
                x: new Date(t), 
                y: toolTempValue
            });
        }
        if (this.toolTemps.length > this.MAX_TEMPS) {
            this.toolTemps.shift();
        }

        this.chartData.data.datasets[0].data = this.clonedData(this.bedTemps);
        this.chartData.data.datasets[1].data = this.clonedData(this.toolTemps);

        this.chartData.options.horizontalLine[0].y = this.printer.view.bedActiveTemp;
        this.chartData.options.horizontalLine[1].y = this.printer.view.toolActiveTemp;

        this.chart.update();
    }


    private clonedData(data: any) {
        return JSON.parse(JSON.stringify(data));
    }


    reset() {
        this.xSelected = false;
        this.ySelected = false;
        this.zSelected = false;
        this.bedSelected = false;
        this.toolSelected = false;
        this.homeAxis = 'XYZ';
    }

    clickedX() {
        var selected = !this.xSelected;
        this.reset();
        this.xSelected = selected;
        this.homeAxis = this.xSelected ? 'X' : 'XYZ';
        this.app.screenEditAxis.axis = this.xSelected ? 'x' : null;
        this.eventAggregator.publish(UI.MESSAGE_UI_UPDATE);
    }

    clickedY() {
        var selected = !this.ySelected;
        this.reset();
        this.ySelected = selected;
        this.homeAxis = this.ySelected ? 'Y' : 'XYZ';
        this.app.screenEditAxis.axis = this.ySelected ? 'y' : null;
        this.eventAggregator.publish(UI.MESSAGE_UI_UPDATE);
    }

    clickedZ() {
        var selected = !this.zSelected;
        this.reset();
        this.zSelected = selected;
        this.homeAxis = this.zSelected ? 'Z' : 'XYZ';
        this.app.screenEditAxis.axis = this.zSelected ? 'z' : null;
        this.eventAggregator.publish(UI.MESSAGE_UI_UPDATE);
    }

    clickedHome() {
        if (this.xSelected)
            this.printer.homeAxis(true, false, false);
        else if (this.ySelected)
            this.printer.homeAxis(false, true, false);
        else if (this.zSelected)
            this.printer.homeAxis(false, false, true);
        else
            this.printer.homeAxis(true, true, true);
    }

    clickedBed() {
        var selected = !this.bedSelected;
        this.reset();
        this.bedSelected = selected;
        this.eventAggregator.publish(UI.MESSAGE_UI_UPDATE);
    }

    clickedTool() {
        var selected = !this.toolSelected;
        this.reset();
        this.toolSelected = selected;
        this.eventAggregator.publish(UI.MESSAGE_UI_UPDATE);
    }

    clickedFan() {
        this.app.editValue('Fan Speed %', this.printer.view.toolFanPercent, (value: number) => this.updateFanSpeed(value));
    }

    updateFanSpeed(speedPerc: number) {
        if (speedPerc < 0) speedPerc = 0;
        else if (speedPerc > 100) speedPerc = 100;
        this.printer.setToolFanSpeed(speedPerc);
    }

}
