
import * as environment from '../../config/environment.json'

const PRINTER_URL = environment.printerUrl;


const PRINTER_HOSTNAME = typeof PRINTER_URL === 'string' 
    ? PRINTER_URL.substring(PRINTER_URL.indexOf('://') + 3, PRINTER_URL.lastIndexOf('/')) 
    : undefined;


export abstract class PrinterSettings {

    public static get url() {
        return typeof PRINTER_URL === 'string' 
            ? PRINTER_URL 
            : `${window.location.protocol}//${window.location.hostname}/`;
    }

    public static get hostname() {
        return PRINTER_HOSTNAME || window.location.hostname;
    }

}


export enum PrinterStatusEnum {
    updating,
    off,
    halted,
    pausing,
    paused,
    resuming,
    processing,
    simulating,
    busy,
    changingTool,
    idle
}





