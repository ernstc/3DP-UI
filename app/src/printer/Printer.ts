import { EventAggregator } from 'aurelia-event-aggregator';
import { IPrinter } from "./IPrinter"
import * as Messages from './PrinterMessages';
import { IPrinterStatusView } from './IPrinterStatusView';
import { GCodeFile, PrinterFilesList, PrinterFiles, HeightMap, HeightMapGeometry, PrinterFile } from './PrinterCommonModels';


export abstract class Printer implements IPrinter {

    filaments: PrinterFile[];
    macros: PrinterFiles;
    files: PrinterFiles;
    filesInfo: { [name: string]: GCodeFile } = {};

    public abstract isOnline: boolean;
    public abstract view: IPrinterStatusView;


    constructor(
        protected eventAggregator: EventAggregator
    )
    { }


    protected abstract _loadFileList(path: string, page?: number): Promise<PrinterFilesList>;
    protected abstract _loadFiles(path: string, page?: number): Promise<PrinterFiles>;
    protected abstract _downloadFile(name: string): Promise<string>;
    protected abstract _updateFile(name: string, content: string): Promise<void>;
    protected abstract _loadFileInfo(name?: string): Promise<GCodeFile>;
    protected abstract _sendGCode(gcode: string): Promise<void>;
    protected abstract _loadFullStatus(): Promise<void>;


    async loadFilaments(): Promise<void> {
        var result = await this._loadFileList(this.view.rootDirFilaments);
        this.filaments = result?.files;
    }

    async loadMacros(path: string = this.view.rootDirMacros): Promise<void> {
        if (path.startsWith(this.view.rootDirMacros)) {
            this.macros = await this._loadFiles(path);
            this.eventAggregator.publish(Messages.MESSAGE_PRINTER_LOADED_MACROS);
        }
    }

    async loadGCodeFiles(path: string = this.view.rootDirGCodeFiles): Promise<void> {
        if (path.startsWith(this.view.rootDirGCodeFiles)) {
            this.files = await this._loadFiles(path);
            /*if (this.files?.files != undefined) {
                for (var i = 0; i < this.files.files.length; i++) {
                    var fileName = this.files.files[i];
                    if (!fileName.startsWith('*')) {
                        await this._loadFileInfo(fileName);
                    }
                }
            }*/
            this.eventAggregator.publish(Messages.MESSAGE_PRINTER_LOADED_GCODES);
        }
    }

    async getFileContent(name: string): Promise<string> {
        return await this._downloadFile(name);
    }

    async updateFileContent(name: string, content: string): Promise<void> {
        await this._updateFile(name, content);
    }

    async getCurrentJobFile(): Promise<GCodeFile> {
        return this._loadFileInfo();
    }

    async runMacro(name: string): Promise<void> {
        var command = 'M98 P"' + this.macros.dir + '/' + name + '"';
        await this._sendGCode(command);
    }

    async simulatePrinting(name: string): Promise<void> {
        var fileName = this.files.dir + '/' + name;
        if (fileName.startsWith(this.view.rootDirGCodeFiles)) {
            fileName = fileName.substr(this.view.rootDirGCodeFiles.length + 1);
        }
        var command = 'M37 P"' + fileName + '"';
        await this._sendGCode(command);
    }

    async startPrinting(name: string): Promise<void> {
        var fileName = this.files.dir + '/' + name;
        var command = 'M32 "' + fileName + '"';
        await this._sendGCode(command);
    }

    async pausePrinting(): Promise<void> {
        await this._sendGCode('M25');
    }

    async cancelPrinting(): Promise<void> {
        await this._sendGCode('M0 H1');
    }

    async resumePrinting(): Promise<void> {
        await this._sendGCode('M24');
    }

    async restartPrinting(): Promise<void> {
        if (this.view.jobFileExists) {
            var command = this.view.jobLasFileSimulated ?
                'M37 P"' + this.view.jobLastFileName + '"'
                : 'M32 P"' + this.view.jobLastFileName + '"';
            await this._sendGCode(command);
        }
    }

    async homeAxis(x: boolean, y: boolean, z: boolean): Promise<void> {
        var command: string;
        if (x && y && z) {
            await this._sendGCode('G28');
        }
        else if (x || y || z) {
            command = 'G28';
            if (x) command += ' X';
            if (y) command += ' Y';
            if (z) command += ' Z';
            await this._sendGCode(command);
        }
    }

    async moveAxisAbsolute(x?: number, y?: number, z?: number, feedrate: number = 6000): Promise<void> {
        var command = 'M120\nG90\nG1' + (x != undefined ? ' X' + x : '') + (y != undefined ? ' Y' + y : '') + (z != undefined ? ' Z' + z : '') + ' F' + feedrate + '\nM121';
        await this._sendGCode(command);
    }

    async moveAxisRelative(x?: number, y?: number, z?: number, feedrate: number = 6000): Promise<void> {
        var command = 'M120\nG91\nG1' + (x != undefined ? ' X' + x : '') + (y != undefined ? ' Y' + y : '') + (z != undefined ? ' Z' + z : '') + ' F' + feedrate + '\nM121';
        await this._sendGCode(command);
    }

    async extrude(length: number, speed: number): Promise<void> {
        var command = 'M120\nM83\nG1 E' + length + ' F' + (speed * 60) + '\nM121';
        await this._sendGCode(command);
    }

    async retract(length: number, speed: number): Promise<void> {
        var command = 'M120\nM83\nG1 E' + (-length) + ' F' + (speed * 60) + '\nM121';
        await this._sendGCode(command);
    }

    async emergencyStop(): Promise<void> {
        var command = 'M112\nM999';
        await this._sendGCode(command);
    }

    async addZBabyStepping(delta: number): Promise<void> {
        var command = 'M290 S' + delta;
        await this._sendGCode(command);
    }

    async setSpeedFactor(percentage: number): Promise<void> {
        var command = 'M220 S' + percentage;
        await this._sendGCode(command);
    }

    async setExtrusionFactor(tool: number, speedPercentage: number): Promise<void> {
        var command = 'M221 D' + tool + ' S' + speedPercentage;
        await this._sendGCode(command);
    }

    async setToolFanSpeed(percentage: number): Promise<void> {
        var command = 'M106 S' + percentage / 100;
        await this._sendGCode(command);
    }

    async setFanSpeed(fanIndex: number, speedPercentage: number): Promise<void> {
        var command = 'M106 P' + fanIndex + ' S' + speedPercentage;
        await this._sendGCode(command);
    }

    async activateTool(tool: number): Promise<void> {
        var command = 'T' + tool;
        await this._sendGCode(command);
    }

    async standbyTool(): Promise<void> {
        var command = 'T-1';
        await this._sendGCode(command);
    }

    async switchOffTool(tool: number): Promise<void> {
        var command = 'G10 P' + tool + ' S-273.15 R-273.15';
        await this._sendGCode(command);
    }

    async setToolTemperature(tool: number, activeTemp?: number, standbyTemp?: number): Promise<void> {
        var command = 'G10 P' + tool;
        if (activeTemp != undefined) command += ' S' + activeTemp;
        if (standbyTemp != undefined) command += ' R' + standbyTemp;
        await this._sendGCode(command);
    }

    async activateBed(temperature?: number): Promise<void> {
        var command = 'M140 S' + (temperature ?? this.view.bedActiveTemp);
        await this._sendGCode(command);
    }

    async standbyBed(): Promise<void> {
        var command = 'M144';
        await this._sendGCode(command);
    }

    async switchOffBed(): Promise<void> {
        var command = 'M140 S-273.15';
        await this._sendGCode(command);
    }

    async runAutoBedCompensation(): Promise<void> {
        var command = 'G32';
        await this._sendGCode(command);
    }

    async loadMeshBedCompensation(): Promise<void> {
        var command = 'G29 S1';
        await this._sendGCode(command);
        await this._loadFullStatus();
    }

    async disableBedCompensation(): Promise<void> {
        var command = 'M561';
        await this._sendGCode(command);
        await this._loadFullStatus();
    }

    async getHeightMap(): Promise<HeightMap> {
        var mapFile = await this._downloadFile('0:/sys/heightmap.csv');        
        if (mapFile == undefined)
            return null;

        var lines = mapFile.split('\n');
        var statistics: number[] = lines[0].split(',').slice(1).map(e => 
            parseFloat(e.substr(e.lastIndexOf(' ')))
        );
        
        var geometry: HeightMapGeometry = new HeightMapGeometry();
        var geometryLabels = lines[1].split(',');
        var geometryValues = lines[2].split(',');
        for (let i = 0; i < geometryLabels.length; i++) {
            geometry[geometryLabels[i]] = parseFloat(geometryValues[i]);
        }
        geometry.area = geometry.xspacing * geometry.yspacing * (geometry.xnum - 1) * (geometry.ynum - 1) / 100;

        var points: number[][] = [];
        var y = geometry.ymin;
        for (let i = 0; i < geometry.ynum; i++) {
            var x = geometry.xmin;
            var zPoints = lines[i + 3].trim().split(',').map(n => parseFloat(n));
            for (let zIndex = 0; zIndex < zPoints.length; zIndex++) {
                const z = zPoints[zIndex];                
                var point: number[] = [x, y, z];
                points.push(point);
                x += geometry.xspacing;
            }
            y += geometry.yspacing;
        }

        var minError = Number.MAX_VALUE;
        var maxError = Number.MIN_VALUE;
        var totErrors = 0;
        var totQuadraticErrors = 0;
        for (let i = 0; i < points.length; i++) {
            const z = points[i][2];
            if (z < minError) minError = z;
            if (z > maxError) maxError = z;
            totErrors += z;
            totQuadraticErrors += (z * z);
        }
        var meanError = totErrors / points.length;

        var map: HeightMap = new HeightMap();
        map.statics = {
            minError: minError,
            maxError: maxError,
            meanError: meanError,
            rmsError: Math.sqrt(totQuadraticErrors * points.length - totErrors * totErrors) / points.length
        };
        map.geometry = geometry;
        map.points = points;
        return map;
    }

    async setZHeight(zHeight: number, save: boolean = true): Promise<void> {
        if (save)
            this._sendGCode(`G31 Z${zHeight.toFixed(2)}\nM500 P31`);
        else
            this._sendGCode(`G31 Z${zHeight.toFixed(2)}`);
    }
}
