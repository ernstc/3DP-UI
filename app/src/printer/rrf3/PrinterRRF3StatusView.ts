import { IPrinterStatusView } from "../IPrinterStatusView";
import { PrinterRRF3 } from "./PrinterRRF3";
import { PrinterStatusEnum } from "printer/PrinterSettings";

export class PrinterRRF3StatusView implements IPrinterStatusView {

    constructor(
        private printer: PrinterRRF3
    )
    { }

    public get rootDirFilaments(): string {
        var s = this.printer.status.directories.filaments;
        return (s.endsWith('/')) ? s.substr(0, s.length -1) : s;
    }

    public get rootDirMacros(): string {
        var s = this.printer.status.directories.macros;
        return (s.endsWith('/')) ? s.substr(0, s.length -1) : s;
    }

    public get rootDirGCodeFiles(): string {
        var s = this.printer.status.directories.gCodes;
        return (s.endsWith('/')) ? s.substr(0, s.length -1) : s;
    }

    public get bedCurrentTemp(): number {
        return this.printer.status.heat.heaters[0].current;
    }

    public get bedActiveTemp(): number {
        return this.printer.status.heat.heaters[0].active;
    }
    
    public get bedStandbyTemp(): number {
        return this.printer.status.heat.heaters[0].standby;
    }

    public get bedState(): number {
        var state = this.printer.status.heat.heaters[0].state;
        return state == 'off' ? 0
            : state == 'standby' ? 1
            : state == 'active' ? 2
            : state == 'fault' ? 3
            : -1;
    }
    
    public get bedCompensation(): string {
        return this.printer.status.move.compensation.type;
    }

    public get toolCurrentTemp(): number {
        return this.printer.status.heat.heaters[1].current;
    }

    public get toolActiveTemp(): number {
        return this.printer.status.heat.heaters[1].active;
    }

    public get toolStandbyTemp(): number {
        return this.printer.status.heat.heaters[1].standby;
    }

    public get toolState(): number {
        var state = this.printer.status.heat.heaters[1].state;
        return state == 'off' ? 0
            : state == 'standby' ? 1
            : state == 'active' ? 2
            : state == 'fault' ? 3
            : -1;
    }

    public get mcuFanPercent(): number {
        return this.printer.status.fans[1].actualValue * 100;
    }

    public get toolFanPercent(): number {
        return this.printer.status.fans[0].actualValue * 100;
    }

    public get printerStatus(): number {
        return PrinterStatusEnum[this.printer.status.state.status];
    }

    public get printerName(): string {
        return this.printer.status.network.name;
    }

    public get speedFactor(): number {
        return this.printer.status.move.speedFactor * 100;
    }

    public get extrFactor(): number {
        return this.printer.status.move.extruders[0].factor * 100;
    }

    public get babystep(): number {
        return this.printer.status.move.axes[2].babystep;
    }

    public get currentLayer(): number {
        return this.printer.status.job.layer;
    }

    public get currentLayerTime(): number {
        return this.printer.status.job.layerTime;
    }

    public get extrRaws(): number[] {
        return this.printer.status.move.extruders.map(e => e.position);
    }

    public get probeHeight(): number {
        return this.printer.status.sensors.probes[0].triggerHeight;
    }

    public get mcuTemp(): number {
        return this.printer.status.boards[0].mcuTemp.current;
    }

    public get vIn(): number {
        return this.printer.status.boards[0].vIn.current;
    }

    public get v12(): number {
        return this.printer.status.boards[0].v12.current;
    }

    public get firmwareElectronics(): string {
        return this.printer.status.boards[0].name;
    }

    public get firmwareName(): string {
        return this.printer.status.boards[0].firmwareName;
    }

    public get firmwareVersion(): string {
        return this.printer.status.boards[0].firmwareVersion;
    }

    public get firmwareDate(): string {
        return this.printer.status.boards[0].firmwareDate;
    }

    public get dwsVersion(): string {
        return '';
    }

    public get dsfVersion(): string {
        return this.printer.status.state.dsfVersion;
    }

    public get coldRetractTemp(): number {
        return this.printer.status.heat.coldRetractTemperature;
    }

    public get coldExtrudeTemp(): number {
        return this.printer.status.heat.coldExtrudeTemperature;
    }

    public get axesHomed(): number[] {
        var xHomed = this.printer.status.move.axes[0].homed ? 1 : 0;
        var yHomed = this.printer.status.move.axes[1].homed ? 1 : 0;
        var zHomed = this.printer.status.move.axes[2].homed ? 1 : 0;
        return [xHomed, yHomed, zHomed];
    }

    public get axisCoord(): number[] {
        var xCoord = this.printer.status.move.axes[0].userPosition;
        var yCoord = this.printer.status.move.axes[1].userPosition;
        var zCoord = this.printer.status.move.axes[2].userPosition;
        return [xCoord, yCoord, zCoord];
    }
    
    public get jobDuration(): number {
        return this.printer.status.job.duration;
    }

    public get jobFileExists(): boolean {
        return this.printer.status.job.file?.fileName != undefined;
    }

    public get jobFileName(): string {
        return this.printer.status.job.file?.fileName;
    }

    public get jobFileFilament(): number[] {
        return this.printer.status.job.file?.filament;
    }

    public get jobFileLayerHeight(): number {
        return this.printer.status.job.file?.layerHeight;
    }

    public get jobFileLayersCount(): number {
        return this.printer.status.job.file?.numLayers;
    }

    public get jobLasFileSimulated(): boolean {
        return this.printer.status.job.lastFileSimulated;
    }
    
    public get jobLastFileName(): string {
        return this.printer.status.job.lastFileName;
    }

    public get jobLayersTime(): number[] {
        return this.printer.status.job.layers.map(l => l.duration);
    }
}
