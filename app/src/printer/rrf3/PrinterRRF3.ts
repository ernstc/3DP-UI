import { autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { WebClient } from '../../webClient';
import { IPrinter } from '../IPrinter';
import { IPrinterStatusView } from '../IPrinterStatusView';
import { PrinterSettings } from '../PrinterSettings';
import * as Messages from '../PrinterMessages';
import * as Models from './PrinterRRF3Models';
import * as moment from 'moment';
import { GCodeFile, PrinterFiles, HeightMap, PrinterFilesList, PrinterFile } from 'printer/PrinterCommonModels';
import { Printer } from 'printer/Printer';
import { PrinterRRF3StatusView } from './PrinterRRF3StatusView';



//------------------------------------------------------------------------
// Utilities 
    
class Error {
    constructor(
        public errorType: string,
        public errorDescription?: string
    ) { }
}

function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}


function mergeDeep(target: any, ...sources: any[]) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else if (Array.isArray(source[key]) && source[key].length && isObject(source[key][0])) {
                if (!target[key]) Object.assign(target, { [key]: []});
                for (let i = 0; i < source[key].length; i++) {
                    if (!target[key][i]) Object.assign(target[key], { [i]: {} });
                    mergeDeep(target[key][i], source[key][i]);
                }
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}


//------------------------------------------------------------------------
// Printer interface for RepRapFirmware 3


@autoinject
export class PrinterRRF3 extends Printer implements IPrinter {
    
    private readonly PING_INTERVAL: number = 2000;
    private readonly REQUEST_TIMEOUT: number = 2000;
    private readonly STATUS_REFRESH_DELAY: number = 200;

    status: Models.FullStatus;
        
    public view: IPrinterStatusView;

    private _isOnline: boolean = false;
    private _socket: WebSocket;
    private _pingTask: any;
    private _layers: any[] = [];
    private _reconnectTask: any;


    constructor(
        private webClient: WebClient,
        eventAggregator: EventAggregator
    ) {
        super(eventAggregator);
        this.webClient.setBaseAddress(PrinterSettings.url);
        this.view = new PrinterRRF3StatusView(this);
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
            if (value) {
                if (this._reconnectTask) {
                    clearTimeout(this._reconnectTask);
                    this._reconnectTask = null;
                }
            }
            /*else if (!this._reconnectTask) {
                this._reconnectTask = setTimeout(() => {
                    this._reconnectTask = null;
                    this._reconnect();
                }, 1000);
            }*/
        }
        this._isOnline = value;
    }

    //---------------------------------------------------------------
    // Private methods

    private _delay(ms: number): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    private _error(e: string) {
        this.eventAggregator.publish(Messages.MESSAGE_PRINTER_ERROR, [e]);
    }

    private _errors(list: string[]) {
        this.eventAggregator.publish(Messages.MESSAGE_PRINTER_ERROR, list);
    }

    private _toQueryString(obj: any): string {
        var str = [];
        for (var p in obj)
            if (obj.hasOwnProperty(p) && obj[p] != undefined) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    }

    private async _connect(): Promise<void> {
        const _self = this;
        const socketProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        this._socket = new WebSocket(`${socketProtocol}//${PrinterSettings.hostname}/machine`);
        await new Promise(function (resolve, reject) {
            _self._socket.onmessage = function (e) {
                // Successfully connected, the first message is the full object model
                const model = JSON.parse(e.data);
                _self.status = model;
                resolve(model);
            };
            _self._socket.onerror = _self._socket.onclose = function (e) {
                if (e.code === 1001 || e.code == 1011) {
                    // DCS unavailable or incompatible DCS version
                    _self._error(e.reason);
                    reject(e.reason);
                } else {
                    _self._error(e.reason);
                    reject(e.reason);
                }
            };
        });
        this._startSocket();
    }

    private async _reconnect(): Promise<void> {
		// TODO: Cancel pending requests

		// Attempt to reconnect
        const _self = this;
		await new Promise(function(resolve, reject) {
			const lastDsfVersion = _self.status.state.dsfVersion;
			const socketProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
			const socket = new WebSocket(`${socketProtocol}//${PrinterSettings.hostname}/machine`);
			socket.onmessage = function(e) {
				// Successfully connected, the first message is the full object model
				_self.status = JSON.parse(e.data);
				if (_self.status.job && _self.status.job.layers) {
					_self._layers = _self.status.job.layers;
				}
				_self._socket = socket;

				// Check if DSF has been updated
				if (lastDsfVersion !== _self.status.state.dsfVersion) {
					location.reload(true);
				}
				resolve();
			}
			socket.onerror = socket.onclose = function(e) {
                _self.isOnline = false;
				if (e.code === 1001 || e.code == 1011) {
					// DCS unavailable or incompatible DCS version
					reject(new Error('PrinterOffline', e.reason));
				} else {
					// TODO accomodate InvalidPasswordError and NoFreeSessionError here
					reject(new Error('NetworkError', e.reason));
                }
                _self._onClose();
			}
		});

		// Apply new socket and machine model
		_self._startSocket();
	}

    private _startSocket() {
        var model: any = this.status;
        if (model.messages !== undefined) {
            console.info(model.messages);
            delete model.message;
        }

        // Send PING in predefined intervals to detect disconnects from the client side
        this._pingTask = setTimeout(this._doPing.bind(this), this.PING_INTERVAL);

        // Set up socket events
        this._socket.onmessage = this._onMessage.bind(this);
        this._socket.onerror = this._onClose.bind(this);
        this._socket.onclose = this._onClose.bind(this);

        // Acknowledge status updated and receival
        this.eventAggregator.publish(Messages.MESSAGE_STATUS_UPDATED);
        this._socket.send('OK\n');
    }

    private _doPing() {
        // Although the WebSocket standard is supposed to provide PING frames,
        // there is no way to send them since a WebSocket instance does not provide a method for that.
        // Hence we rely on our own optional PING-PONG implementation
        this._socket.send('PING\n');
        this._pingTask = undefined;
    }

    private async _onMessage(e: any): Promise<void> {
        // Don't do anything if the connection has been terminated...
        if (this._socket == null) {
            return;
        }

        // Use PING/PONG messages to detect connection interrupts
        if (this._pingTask) {
            // We've just received something, reset the ping task
            clearTimeout(this._pingTask);
        }
        this._pingTask = setTimeout(this._doPing.bind(this), this.PING_INTERVAL);

        // It's just a PONG reply, ignore this
        if (e.data === 'PONG\n') {
            this.isOnline = true;
            return;
        }

        // Process model updates
        const data = JSON.parse(e.data);

        // Deal with generic messages
        if (data.messages) {
            data.messages.forEach(async function (message) {
                let reply;
                switch (message.type) {
                    case 1:
                        reply = `Warning: ${message.content}`;
                        break;
                    case 2:
                        reply = `Error: ${message.content}`;
                        break;
                    default:
                        reply = message.content;
                        break;
                }

                // TODO Pass supplied date/time from the messages here
                //await this.dispatch('onCodeCompleted', { code: undefined, reply });

            }, this);
            delete data.messages;
        }

        // Deal with layers
        if (data.job && data.job.layers !== undefined) {
            if (data.job.layers.length === 0) {
                this._layers = [];
            } else {
                data.job.layers.forEach((layer: any) => this._layers.push(layer), this);
            }
            data.job.layers = this._layers;
        }

        this.status = mergeDeep(this.status, data);

        // Acknowledge status updated and receival
        this.isOnline = true;
        this.eventAggregator.publish(Messages.MESSAGE_STATUS_UPDATED);
        await this._delay(this.STATUS_REFRESH_DELAY);
        this._socket.send('OK\n');
    }

    private _onClose() {
        // TODO: Cancel pending requests

        if (this._pingTask) {
            clearTimeout(this._pingTask);
            this._pingTask = undefined;
        }
        this.eventAggregator.publish(Messages.MESSAGE_PRINTER_OFFLINE);
        if (this._reconnectTask == undefined) {
            this._reconnectTask = setTimeout(() => {
                this._reconnectTask = undefined;
                this._reconnect();
            }, 2000);
        }
    }

    private async _sendRequest(method: string, url: string, body?: object, contentType?: string, headers?: object, withTimeout?: boolean): Promise<any> {
        try {
            var request: Promise<any>;            
            if (method == 'GET')
                request = this.webClient.get(url, headers);
            else if (method == 'POST')
                request = this.webClient.post(url, body, contentType, headers);
            else if (method == 'PUT')
                request = this.webClient.put(url, body, contentType, headers);
            else if (method == 'DELETE')
                request = this.webClient.delete(url, headers);
            else
                return;

            var result: any = (withTimeout === false) ? 
                await request : 
                await request.timeout(this.REQUEST_TIMEOUT);

            this.isOnline = true;
            return result;
        }
        catch (e) {
            this.isOnline = false;
            return null;
        }
    }

    async _initialize(): Promise<void> {
        await this._connect();
        await this.loadFilaments();
        await this.loadMacros();
        await this._loadConfiguration();
        await this.loadGCodeFiles();
    }

    async _loadConfiguration(): Promise<void> {
        // Intentionally empty
    }

    async _loadStatus(): Promise<void> {
        // Intentionally empty
    }


    //------------------------------------------------------------------------
    // Override of protected abstract methods defined in the class Printer

    protected async _loadFileList(path: string, page: number = 0): Promise<PrinterFilesList> {
        var response = await this._sendRequest('GET', 'machine/directory/' + encodeURIComponent(path));
        var files: PrinterFilesList = response;
        return files;
    }

    protected async _loadFiles(path: string, page: number = 0): Promise<PrinterFiles> {
        var response: PrinterFile[] = await this._sendRequest('GET', 'machine/directory/' + encodeURIComponent(path));
        var files: PrinterFiles = new PrinterFiles();
        files.dir = path;
        files.files = response.map(f => (f.type == 'd' ? '*' : '') + f.name);
        return files;
    }

    protected async _loadFileInfo(name?: string): Promise<GCodeFile> {
        var info: GCodeFile;
        if (name == undefined) {
            // Get the current file
            info = await this._sendRequest('GET', 'machine/fileinfo');
        }
        else if (this.filesInfo[name] == undefined) {
            // Get the requested file
            info = await this._sendRequest('GET', 'machine/fileinfo/' + encodeURIComponent(name));
        }
        if (info != null) {
            this.filesInfo[name] = info;
        }
        return info;
    }

    protected async _downloadFile(name: string) {
        var content: string = await this._sendRequest('GET', 'machine/file/' + encodeURIComponent(name), undefined, undefined, undefined, false);
        return content;
    }

    protected async _sendGCode(gcode) {
        var replayMessage = await this._sendRequest('POST', 'machine/code', gcode, 'text/plain;charset=UTF-8');
        if (typeof replayMessage === 'string') {
            var errors = replayMessage
                .trim()
                .split('\n')
                .filter(s => s.trim().length > 0)
                .map(s => {
                    var m = s.trim();
                    if (m.startsWith('Error:')) m = m.substr(m.indexOf(':') + 1);
                    return m;
                });
            if (errors.length > 0) {
                var uniqueErrors = Array.from(new Set(errors));
                this.eventAggregator.publish(Messages.MESSAGE_PRINTER_ERROR, uniqueErrors);
            }
        }
    }

    protected async _loadFullStatus(): Promise<void> {
        // Intentionally empty. The status is updated by websocket messaging.
    }

}
