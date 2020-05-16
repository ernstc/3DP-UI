import { autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { WebClient } from '../../webClient';
import { IPrinter } from '../IPrinter';
import * as Messages from '../PrinterMessages';
import * as Models from './PrinterRRF2Models';
import { PrinterSettings } from '../PrinterSettings';
import * as moment from 'moment';
import { IPrinterStatusView } from '../IPrinterStatusView';
import { PrinterRRF2StatusView } from './PrinterRRF2StatusView';
import { Printer } from '../Printer';
import { PrinterFiles, PrinterFile, GCodeFile, PrinterFilesList } from 'printer/PrinterCommonModels';


const REFRESH_STATUS_DELAY = 300;
const LOAD_FULL_STATUS_FREQUENCY = 10;


@autoinject
export class PrinterRRF2 extends Printer implements IPrinter  {

    static STATUS_IDLE: string = 'I';

    private _statusLoadCount: number = 0;
    private _isOnline: boolean = true;

    boardType: string;
    sessionTimeout: number;
    err: number;

    configuration: Models.Configuration;
    status: Models.FullStatus;
    jobFile: GCodeFile;
    jobLastFileSimulated: boolean = false;


    public view: IPrinterStatusView;


    constructor(
        private webClient: WebClient,
        eventAggregator: EventAggregator
    ) {
        super(eventAggregator);
        this.webClient.setBaseAddress(PrinterSettings.url);
        this.view = new PrinterRRF2StatusView(this);
        this._initialize();
    }

    public get isOnline(): boolean {
        return this._isOnline;
    }

    public set isOnline(value: boolean) {
        if (this._isOnline != value) {
            this.eventAggregator.publish(
                value ?
                    Messages.MESSAGE_PRINTER_ONLINE :
                    Messages.MESSAGE_PRINTER_OFFLINE
            );
        }
        this._isOnline = value;
    }

    //---------------------------------------------------------------
    // Private methods

    /*private delay(ms: number): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }*/

    private _toQueryString(obj: any): string {
        var str = [];
        for (var p in obj)
            if (obj.hasOwnProperty(p) && obj[p] != undefined) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    }

    private async _sendRequest(command: string, params?: object, headers?: object): Promise<any> {
        var query = params ? command + '?' + this._toQueryString(params) : command;
        try {
            var result = await this.webClient.get(query, headers).timeout(1000);
            this.isOnline = true;
            return result;
        }
        catch (e) {
            this.isOnline = false;
            return null;
        }
    }

    private async _connect(): Promise<void> {
        var data = await this._sendRequest('rr_connect', {
            password: 'reprap',
            time: moment().format('YYYY-MM-ddTHH:mm:ss')
        });
        if (data != null) {
            this.boardType = data.boardType;
            this.sessionTimeout = data.sessionTimeout;
            this.err = data.err;
        }
    }

    private async _replay(): Promise<void> {
        var replayMessage: string = await this._sendRequest('rr_reply', null, { 'Accept': 'text/plain' });
        if (replayMessage != undefined) {

            replayMessage = replayMessage.trim();
            if (replayMessage.length > 0) {

                var errors = replayMessage
                    .split('\n')
                    .filter(s => s.trim().length > 0)
                    .map(s => {
                        var m = s.trim();
                        if (m.startsWith('Error:')) m = m.substr(m.indexOf(':') + 1);
                        return m;
                    });

                var uniqueErrors = Array.from(new Set(errors));
                this.eventAggregator.publish(Messages.MESSAGE_PRINTER_ERROR, uniqueErrors);
            }
        }
    }

    private async _loadIdleStatus(): Promise<void> {
        var s: Models.Status = await this._sendRequest('rr_status', {
            type: 1
        });
        if (s != null) {
            this.status.status = s.status;
            this.status.coords = s.coords;
            this.status.speeds = s.speeds;
            this.status.currentTool = s.currentTool;
            this.status.params = s.params;
            this.status.seq = s.seq;
            this.status.sensors = s.sensors;
            this.status.temps = s.temps;
            this.status.time = s.time;
            this.eventAggregator.publish(Messages.MESSAGE_STATUS_UPDATED);
        }
    }

    private async _loadJobStatus(): Promise<void> {
        var s: Models.JobStatus = await this._sendRequest('rr_status', {
            type: 3
        });
        if (s != null) {
            this.status.status = s.status;
            this.status.coords = s.coords;
            this.status.speeds = s.speeds;
            this.status.currentTool = s.currentTool;
            this.status.params = s.params;
            this.status.seq = s.seq;
            this.status.sensors = s.sensors;
            this.status.temps = s.temps;
            this.status.time = s.time;

            this.status.currentLayer = s.currentLayer;
            this.status.currentLayerTime = s.currentLayerTime;
            this.status.extrRaw = s.extrRaw;
            this.status.fractionPrinted = s.fractionPrinted;            
            this.status.filePosition = s.filePosition;
            this.status.firstLayerDuration = s.firstLayerDuration;
            this.status.firstLayerHeight = s.firstLayerHeight;
            this.status.printDuration = s.printDuration;
            this.status.warmUpDuration = s.warmUpDuration;
            this.status.timesLeft = s.timesLeft;

            this.eventAggregator.publish(Messages.MESSAGE_STATUS_UPDATED);
        }
    }

    private _startLoadStatusLoop() {
        var delayAccumulator = 0;
        var delay = REFRESH_STATUS_DELAY * 3;
        setInterval(() => {
            if (!this.isOnline) {
                delayAccumulator += REFRESH_STATUS_DELAY;
            }
            if (this.isOnline || delayAccumulator > delay) {
                delayAccumulator = 0;
                this._loadStatus();
            }
        }, REFRESH_STATUS_DELAY);
    }

    private async _initialize(): Promise<void> {
        await this._connect();
        await this.loadFilaments();
        this._startLoadStatusLoop();
        await this.loadMacros();
        await this._replay();
        await this._loadConfiguration();
        await this.loadGCodeFiles();
    }

    private async _loadConfiguration(): Promise<void> {
        this.configuration = await this._sendRequest('rr_config');
    }

    private async _loadStatus(): Promise<void> {
        var currentStatus = this.status?.status ?? '';        
        if (this._statusLoadCount++ % 10 == 0) {
            await this._loadFullStatus().timeout(1000);
        }
        else {
            if (this.status.status == PrinterRRF2.STATUS_IDLE)
                await this._loadIdleStatus().timeout(1000);
            else
                await this._loadJobStatus().timeout(1000);
        }
        if (this.status.status != PrinterRRF2.STATUS_IDLE 
            && (this.jobFile == undefined || currentStatus == PrinterRRF2.STATUS_IDLE)) {
            this.jobFile = await this.getCurrentJobFile();
        }
    }

    //---------------------------------------------------------------
    // Override of protected abstract methods of the parent class
    
    protected async _loadFileList(path: string, page: number = 0): Promise<PrinterFilesList> {
        var files: PrinterFilesList = await this._sendRequest('rr_filelist', {
            dir: path,
            first: page
        });
        return files;
    }

    protected async _loadFiles(path: string, page: number = 0): Promise<PrinterFiles> {
        var files: PrinterFiles = await this._sendRequest('rr_files', {
            dir: path,
            first: page,
            flagDirs: 1
        });
        return files;
    }

    protected async _loadFileInfo(name?: string): Promise<GCodeFile> {
        var info: GCodeFile;
        if (name == undefined) {
            // Get the current file
            info = await this._sendRequest('rr_fileinfo');
        }
        else if (this.filesInfo[name] == undefined) {
            // Get the requested file
            info = await this._sendRequest('rr_fileinfo', {
                name: name
            });
        }
        if (info != null) {
            this.filesInfo[name] = info;
        }
        return info;
    }

    protected async _downloadFile(name: string): Promise<string> {
        var query = {
            name: name,
            _: new Date().valueOf().toString()
        }
        var content: string = await this._sendRequest('rr_download', query, { 'Accept': 'text/html, */*; q=0.01', });
        return content;
    }

    protected async _updateFile(name: string, content: string): Promise<void> {
        // TODO
    }

    protected async _loadFullStatus(): Promise<void> {
        var s: Models.FullStatus = await this._sendRequest('rr_status', {
            type: 2
        });
        if (s != null) {
            this.status = s;
            this.eventAggregator.publish(Messages.MESSAGE_STATUS_UPDATED);
        }
    }
    
    protected async _sendGCode(gcode: string): Promise<void> {
        await this._sendRequest('rr_gcode', {
            gcode: gcode
        });
        await this._replay();
    }


    //---------------------------------------------------------------
    // Overrides of public methods

    async startPrinting(name: string): Promise<void> {
        var fileName = this.files.dir + '/' + name;
        await super.startPrinting(name);
        this.jobFile = await this.getCurrentJobFile();
        this.jobFile.fileName = fileName;
        this.jobLastFileSimulated = false;
    }

    async restartPrinting(): Promise<void> {
        await super.restartPrinting();
        if (this.jobFile != undefined) {
            this.jobFile = await this.getCurrentJobFile();
        }
    }

    async simulatePrinting(name: string): Promise<void> {
        await super.simulatePrinting(name);
        this.jobLastFileSimulated = true;
    }

}
