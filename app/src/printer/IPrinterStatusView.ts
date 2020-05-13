export abstract class IPrinterStatusView {

    public abstract rootDirFilaments: string;
    public abstract rootDirMacros: string;
    public abstract rootDirGCodeFiles: string;

    public abstract bedCurrentTemp: number;
    public abstract bedActiveTemp: number;
    public abstract bedStandbyTemp: number;
    public abstract bedState: number;
    public abstract bedCompensation: string;

    public abstract toolCurrentTemp: number;
    public abstract toolActiveTemp: number;
    public abstract toolStandbyTemp: number;
    public abstract toolState: number;
    
    public abstract mcuFanPercent: number;
    public abstract toolFanPercent: number;

    public abstract axesHomed: number[];
    public abstract axisCoord: number[];

    public abstract printerStatus: number;
    public abstract printerName: string;

    public abstract speedFactor: number;
    public abstract extrFactor: number;
    public abstract babystep: number;

    public abstract currentLayer: number;
    public abstract currentLayerTime: number;
    public abstract extrRaws: number[];

    public abstract probeHeight: number;
    public abstract mcuTemp: number;
    public abstract vIn: number;
    public abstract v12: number;

    public abstract firmwareElectronics: string;
    public abstract firmwareName: string;
    public abstract firmwareVersion: string;
    public abstract firmwareDate: string;
    public abstract dwsVersion: string;
    public abstract dsfVersion: string;

    public abstract coldRetractTemp: number;
    public abstract coldExtrudeTemp: number;

    public abstract jobDuration: number;
    public abstract jobFileExists: boolean;
    public abstract jobFileName: string;
    public abstract jobFileFilament: number[];
    public abstract jobFileLayerHeight: number;
    public abstract jobFileLayersCount: number;
    public abstract jobLasFileSimulated: boolean;
    public abstract jobLastFileName: string;
    public abstract jobLayersTime: number[];
}
