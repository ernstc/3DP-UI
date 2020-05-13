import { IPrinterStatusView } from "../IPrinterStatusView";
import { PrinterRRF2 } from "./PrinterRRF2";
import { PrinterStatusEnum } from '../PrinterSettings';


export class PrinterRRF2StatusView implements IPrinterStatusView {
    
    private readonly ROOT_DIR_MACROS: string = '0:/macros';
    private readonly ROOT_DIR_FILAMENTS: string = '0:/filaments';
    private readonly ROOT_DIR_GCODES: string = "0:/gcodes";

    private readonly PRINTER_STATE_MAP = {
        'I': PrinterStatusEnum.idle, 
        'P': PrinterStatusEnum.processing,
        'S': PrinterStatusEnum.paused,
        'M': PrinterStatusEnum.simulating,
        'H': PrinterStatusEnum.halted
    };
     

    constructor(
        private printer: PrinterRRF2
    )
    { }

    public get rootDirFilaments(): string {
        return this.ROOT_DIR_FILAMENTS;
    }

    public get rootDirMacros(): string {
        return this.ROOT_DIR_MACROS;
    }

    public get rootDirGCodeFiles(): string {
        return this.ROOT_DIR_GCODES;
    }

    public get bedCurrentTemp(): number {
        return this.printer.status.temps.bed.current;
    }

    public get bedActiveTemp(): number {
        return this.printer.status.temps.bed.active;
    }
    
    public get bedStandbyTemp(): number {
        return this.printer.status.temps.bed.standby;
    }

    public get bedState(): number {
        return this.printer.status.temps.bed.state;
    }
    
    public get bedCompensation(): string {
        return this.printer.status.compensation;
    }


    public get toolCurrentTemp(): number {
        return this.printer.status.temps.current[1];
    }

    public get toolActiveTemp(): number {
        return this.printer.status.temps.tools.active[0][0];
    }

    public get toolStandbyTemp(): number {
        return this.printer.status.temps.tools.standby[0][0];
    }

    public get toolState(): number {
        return this.printer.status.temps.state[1];
    }

    public get mcuFanPercent(): number {
        return this.printer.status.params.fanPercent[1];
    }

    public get toolFanPercent(): number {
        return this.printer.status.params.fanPercent[0];
    }

    public get axisCoord(): number[] {
        return this.printer.status.coords.xyz;
    }

    public get printerStatus(): number {
        var s = this.PRINTER_STATE_MAP[this.printer.status.status];
        return s ? s : -1;
    }

    public get printerName(): string {
        return this.printer.status.name;
    }

    public get speedFactor(): number {
        return this.printer.status.params.speedFactor;
    }

    public get extrFactor(): number {
        return this.printer.status.params.extrFactors[0];
    }

    public get babystep(): number {
        return this.printer.status.params.babystep;
    }

    public get currentLayer(): number {
        return this.printer.status.currentLayer;
    }

    public get currentLayerTime(): number {
        return this.printer.status.currentLayerTime;
    }

    public get extrRaws(): number[] {
        return this.printer.status.extrRaw;
    }

    public get probeHeight(): number {
        return this.printer.status.probe.height;
    }

    public get mcuTemp(): number {
        return this.printer.status.mcutemp.cur;
    }

    public get vIn(): number {
        return this.printer.status.vin.cur;
    }

    public get v12(): number {
        return null;
    }

    public get firmwareElectronics(): string {
        return this.printer.configuration.firmwareElectronics;
    }

    public get firmwareName(): string {
        return this.printer.configuration.firmwareName;
    }

    public get firmwareVersion(): string {
        return this.printer.configuration.firmwareVersion;
    }

    public get firmwareDate(): string {
        return this.printer.configuration.firmwareDate;
    }

    public get dwsVersion(): string {
        return this.printer.configuration.dwsVersion;
    }

    public get dsfVersion(): string {
        return null;
    }

    public get coldRetractTemp(): number {
        return this.printer.status.coldRetractTemp;
    }

    public get coldExtrudeTemp(): number {
        return this.printer.status.coldExtrudeTemp;
    }

    public get axesHomed(): number[] {
        return this.printer.status.coords.axesHomed;
    }

    public get jobDuration(): number {
        return 0;
    }

    public get jobFileExists(): boolean {
        return this.printer.jobFile != undefined;
    }

    public get jobFileName(): string {
        return this.printer.jobFile?.fileName;
    }

    public get jobFileFilament(): number[] {
        return this.printer.jobFile?.filament;
    }

    public get jobFileLayerHeight(): number {
        return this.printer.jobFile?.layerHeight;
    }

    public get jobFileLayersCount(): number {
        return this.printer.jobFile ?
            Math.ceil(this.printer.jobFile.height / this.printer.jobFile.layerHeight)
            : 0;
    }

    public get jobLasFileSimulated(): boolean {
        return this.printer.jobLastFileSimulated;
    }
    
    public get jobLastFileName(): string {
        return this.printer.jobFile?.fileName;
    }
    
    public get jobLayersTime(): number[] {
        return null;
    }
}
