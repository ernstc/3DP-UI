

const PRINTER_URL = (<any>window).PRINTER_URL;

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
    /// <summary>
    /// The firmware is being updated
    /// </summary>
    updating,
    
    /// <summary>
    /// The machine is turned off (i.e. the input voltage is too low for operation)
    /// </summary>
    off,
    
    /// <summary>
    /// The machine has encountered an emergency stop and is ready to reset
    /// </summary>
    halted,
    
    /// <summary>
    /// The machine is about to pause a file job
    /// </summary>
    pausing,
    
    /// <summary>
    /// The machine has paused a file job
    /// </summary>
    paused,
    
    /// <summary>
    /// The machine is about to resume a paused file job
    /// </summary>
    resuming,
    
    /// <summary>
    /// The machine is processing a file job
    /// </summary>
    processing,
    
    /// <summary>
    /// The machine is simulating a file job to determine its processing time
    /// </summary>
    simulating,
    
    /// <summary>
    /// The machine is busy doing something (e.g. moving)
    /// </summary>
    busy,
    
    /// <summary>
    /// The machine is changing the current tool
    /// </summary>
    changingTool,
    
    /// <summary>
    /// The machine is on but has nothing to do
    /// </summary>
    idle
}





