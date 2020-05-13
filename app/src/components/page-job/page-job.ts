import { autoinject } from 'aurelia-framework';
import * as data from './chart-data';
import { Chart } from 'chart.js';
import { App } from '../../app';
import { IPrinter, PrinterStatusEnum } from '../../printer';
import { IScreen } from 'IScreen';


class LayerData {
    constructor (
        public layer: number,
        public seconds: number
    )
    {}
}


@autoinject
export class PageJob implements IScreen {

    private graphLayers: HTMLCanvasElement;

    private chart: Chart;
    private chartData: any;
    private chartDrawn: boolean = false;

    state: number = 0;
    layersCount: number = 0;
    currentLayer: number = 0;

    title: string = 'No Job in progress';
    fileName: string = '';
    zBabystepping: number = 0;
    speedFactor: string = '100';
    toolName: string = 'E0';
    extrusionFactor: string = '100';
    fan: string = '0';

    isStatusIdle: boolean = true;
    showPauseButton: boolean = true;
    showResumeButton: boolean = false;
    showCancelButton: boolean = false;
    showRestartButton: boolean = false;
    showEmptyButton: boolean = true;
    showLayers: boolean = false;
    existsModel: boolean = false;

    private MAX_DATA: number = 40;
    private layersData: LayerData[] = [];


    public editingZBabystepping: boolean = false;


    constructor(
        private app: App,
        private printer: IPrinter
    ) {
        this.chartData = data.chartData;
    }

    attached() {
        this.setGraphLayers();
    }

    setGraphLayers() {
        var ctx = this.graphLayers.getContext('2d');
        this.chart = new Chart(ctx, this.chartData);
    }

    private getProgress(): number {
        var jobFileFilament: number[] = this.printer.view.jobFileFilament;
        var extrRaw: number = 0;
        var filament: number = 0;
        var extrRaws: number[] = this.printer.view.extrRaws;
        if (extrRaws != undefined) {
            for (let i = 0; i < extrRaws.length; i++) {
                extrRaw += extrRaws[i];
                filament += jobFileFilament[i];
            }

            var progress: number = extrRaw / filament * 100;
            if (progress > 100) progress = 100;
            else if (progress < 0) progress = 0;
            return progress;
        }
        else {
            return null;
        }
    }

    private getFileName(): string {
        var name = (this.printer.view.jobLastFileName || this.printer.view.jobFileName) ?? '';
        return name.substr(name.lastIndexOf('/') + 1);
    }

    public updateStatus() {
        if (this.printer.view.printerStatus == PrinterStatusEnum.processing 
            || this.printer.view.printerStatus == PrinterStatusEnum.simulating) {
            this.showPauseButton = true;
            this.showResumeButton = false;
            this.showCancelButton = false;
            this.showRestartButton = false;
            this.showEmptyButton = true;
            this.isStatusIdle = false;
            this.showLayers = true;
            this.existsModel = true;
            this.fileName = this.getFileName();
            var progress = this.getProgress();
            if (progress != null) {
                this.title = 'Printing ' + this.getProgress().toFixed(1) + '%';
                this.updateLayersCount();
            }
            this.updateGraph();
        }
        else if (this.printer.view.printerStatus == PrinterStatusEnum.paused) {
            this.showPauseButton = false;
            this.showResumeButton = true;
            this.showCancelButton = true;
            this.showRestartButton = false;
            this.showEmptyButton = false;
            this.isStatusIdle = false;
            this.showLayers = true;
            this.existsModel = true;
            this.fileName = this.getFileName();
            var progress = this.getProgress();
            if (progress != null) {
                this.title = 'Paused ' + this.getProgress().toFixed(1) + '%';
                this.updateLayersCount();
            }
            this.updateGraph();
        }
        else if (this.printer.view.printerStatus == PrinterStatusEnum.idle) {
            this.showPauseButton = true;
            this.showResumeButton = false;
            this.showCancelButton = false;
            this.showRestartButton = false;
            this.showEmptyButton = true;
            this.isStatusIdle = true;
            this.showLayers = false;
            this.fileName = this.getFileName();

            if (!this.printer.view.jobFileExists) {
                this.title = "No job in progress";
                this.showPauseButton = true;
                this.showRestartButton = false;
                this.existsModel = false;
            }
            else {
                this.title = "Job completed";
                this.showPauseButton = false;
                this.showRestartButton = true;
                this.existsModel = true;
                this.updateGraph();
            }
        }
        this.speedFactor = this.printer.view.speedFactor.toFixed(0);
        this.extrusionFactor = this.printer.view.extrFactor.toFixed(0);
        this.fan = this.printer.view.toolFanPercent.toFixed(0);
        this.zBabystepping = this.printer.view.babystep;
    }

    private updateLayersCount() {
        this.layersCount = this.printer.view.jobFileLayersCount;
        this.currentLayer = this.printer.view.currentLayer;
    }
    
    private updateGraph() {
        var layers = this.printer.view.jobLayersTime;
        if (layers == null) {
            this.updateGraph_legacy();
            return;
        }
        var completedLayersTime: number = 0;
        layers.forEach(l => completedLayersTime += l);
        var currentLayer = this.printer.view.currentLayer;
        var currentLayerTime = this.printer.view.jobDuration - completedLayersTime;
        this.layersData = layers.map((t: number, index: number) => new LayerData(index + 1, t));
        
        if (currentLayer != undefined) {
            if (this.layersData.length > 0) {
                var last = this.layersData[this.layersData.length - 1];
                if (last.layer != currentLayer) this.layersData.push(new LayerData(currentLayer, currentLayerTime));
            }
            else {
                this.layersData.push(new LayerData(currentLayer, currentLayerTime));
            }
            this.updateGraphData();
        }
        else {
            if (!this.chartDrawn) this.updateGraphData();
        }   
        this.chartDrawn = true;     
    }

    private updateGraph_legacy() {
        var updateGraph: boolean = false;
        var l = this.printer.view.currentLayer;
        if (l == undefined) {
            return;
        }
        var s = this.printer.view.currentLayerTime;
        var lastKnown: LayerData = 
            this.layersData.length > 0 ? 
            this.layersData[this.layersData.length - 1] : 
            null;

        if (lastKnown == null) {
            this.layersData.push(new LayerData(l, s));
            updateGraph = true;
        }
        else {
            if (l == lastKnown.layer) {
                if (s != lastKnown.seconds) {
                    lastKnown.seconds = s;
                    updateGraph = true;
                }
            }
            else if (l > lastKnown.layer) {
                this.layersData.push(new LayerData(l, s));
                updateGraph = true;
            }
            else {
                this.resetGraph();
            }
        }

        if (updateGraph) this.updateGraphData();
    }

    private updateGraphData() {
        while (this.layersData.length > this.MAX_DATA) {
            this.layersData.shift();
        }
        var graphData = this.layersData.map((d, i) => {
            return {
                x: i,
                y: d.seconds
            };
        });
        if (graphData.length == 0) {
            this.resetGraph();
        }
        else {
            this.chartData.data.datasets[0].data = graphData;
            this.chart.update();
        }
    }

    private resetGraph() {
        this.layersData = [];
        this.chartData.data.datasets[0].data = [{x: 0, y: 0}];
        this.chart.update();
    }

    clickedPause() {
        this.printer.pausePrinting();
    }

    clickedResume() {
        this.printer.resumePrinting();
    }

    clickedCance() {
        this.printer.cancelPrinting();
    }

    clickedRestart() {
        this.printer.restartPrinting();
    }

    clickedZBabystepping() {
        this.editingZBabystepping = !this.editingZBabystepping;
        this.app.screenEditZBabystepping.isHidden = !this.editingZBabystepping;
    }

    async clickedModel() {
        if (this.existsModel) {
            var progress = this.getProgress();
            this.app.screenModel.isHidden = false;
            this.app.screenModel.progressPercentage = progress / 100;
            this.app.screenModel.title = progress.toFixed(1) + '%';
            await this.app.screenModel.loadModel(this.printer.view.jobLastFileName);
            this.updateModelProgress();
        }
    }

    clickedSpeedFactor() {
        this.app.editValue('Speed Factor %', parseInt(this.speedFactor), (value: number) => this.updateSpeedFactor(value));
    }

    updateSpeedFactor(value: number) {
        this.printer.setSpeedFactor(value);
    }

    clickedExtrusionFactor() {
        this.app.editValue('Extrusion Factor %', parseInt(this.extrusionFactor), (value: number) => this.updateExtrusionFactor(value));
    }

    updateExtrusionFactor(value: number) {
        this.printer.setExtrusionFactor(0, value);
    }

    clickedFan() {
        this.app.editValue('Fan Speed %', this.printer.view.toolFanPercent, (value: number) => this.updateFanSpeed(value));
    }

    updateFanSpeed(speedPerc: number) {
        if (speedPerc < 0) speedPerc = 0;
        else if (speedPerc > 100) speedPerc = 100;
        this.printer.setToolFanSpeed(speedPerc);
    }

    private async updateModelProgress() {
        var lastFixedProgress = this.getProgress().toFixed(1);
        setTimeout(() => {
            if (!this.app.screenModel.isHidden) {
                var newProgress = this.getProgress();

                if (newProgress == 0 && this.printer.view.printerStatus == PrinterStatusEnum.idle)
                    newProgress = 100;
                    
                var newFixedProgress = newProgress.toFixed(1);
                if (newFixedProgress != lastFixedProgress) {
                    this.app.screenModel.title = newFixedProgress + '%';
                    this.app.screenModel.progressPercentage = newProgress / 100;
                }
                this.updateModelProgress();
            }
        }, 5000);
    }
}
