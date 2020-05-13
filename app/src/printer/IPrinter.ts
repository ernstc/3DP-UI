import { autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { IPrinterStatusView } from './IPrinterStatusView';
import { GCodeFile, PrinterFiles, HeightMap } from './PrinterCommonModels';
//import * as Models from './rrf2/PrinterRRF2Models';


export abstract class IPrinter
{
    isOnline: boolean;

    macros: PrinterFiles;
    files: PrinterFiles;
    view: IPrinterStatusView;

    
    abstract loadFilaments(): Promise<void>;
    abstract loadMacros(path: string): Promise<void>;
    abstract loadGCodeFiles(path: string): Promise<void>;
    abstract getFileContent(name: string): Promise<string>;
    abstract getCurrentJobFile(): Promise<GCodeFile>;
    abstract runMacro(name: string): Promise<void>;
    abstract simulatePrinting(name: string): Promise<void>;
    abstract startPrinting(name: string): Promise<void>;
    abstract pausePrinting(): Promise<void>;
    abstract cancelPrinting(): Promise<void>;
    abstract resumePrinting(): Promise<void>;
    abstract restartPrinting(): Promise<void>;
    abstract homeAxis(x: boolean, y: boolean, z: boolean): Promise<void>;
    abstract moveAxisAbsolute(x?: number, y?: number, z?: number, feedrate?: number): Promise<void>;
    abstract moveAxisRelative(x?: number, y?: number, z?: number, feedrate?: number): Promise<void>;
    abstract extrude(length: number, speed: number): Promise<void>;
    abstract retract(length: number, speed: number): Promise<void>;
    abstract emergencyStop(): Promise<void>;
    abstract addZBabyStepping(delta: number): Promise<void>;
    abstract setSpeedFactor(percentage: number): Promise<void>;
    abstract setExtrusionFactor(tool: number, speedPercentage: number): Promise<void>;
    abstract setToolFanSpeed(percentage: number): Promise<void>;
    abstract setFanSpeed(fanIndex: number, speedPercentage: number): Promise<void>;
    abstract activateTool(tool: number): Promise<void>;
    abstract standbyTool() : Promise<void>;
    abstract switchOffTool(tool: number): Promise<void>;
    abstract setToolTemperature(tool: number, activeTemp?: number, standbyTemp?: number): Promise<void>;
    abstract activateBed(temperature?: number): Promise<void>;
    abstract standbyBed(): Promise<void>;
    abstract switchOffBed(): Promise<void>;
    abstract runAutoBedCompensation(): Promise<void>;
    abstract loadMeshBedCompensation(): Promise<void>;
    abstract disableBedCompensation(): Promise<void>;
    abstract getHeightMap(): Promise<HeightMap>;
}
