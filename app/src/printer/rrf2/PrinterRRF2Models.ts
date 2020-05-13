class Coords {
    axesHomed: number[];
    wpl: number;
    xyz: number[];
    machine: number[];
    extr: number[]
}


class Speeds {
    requested: number;
    top: number;
}


class Params {
    atxPower: boolean;
    fanPercent: number[];
    speedFactor: number;
    extrFactors: number[];
    babystep: number;
}


class Sensors {
    probeValue: number;
    fanRPM: number;
}


class Bed {
    current: number;
    active: number;
    standby: number;
    state: number;
    heater: number;
}


class ToolsTargetTemps {
    active: number[][];
    standby: number[][];
}


class Extra {
    name: string;
    temp: number;
}


class Temps {
    bed: Bed;
    current: number[];
    state: number[];
    tools: ToolsTargetTemps;
    extra: Extra[];
}


export class Status {
    status: string;
    coords: Coords;
    speeds: Speeds;
    currentTool: number;
    params: Params;
    seq: number;
    sensors: Sensors;
    temps: Temps;
    time: number;
}


class TimeLeft {
    file: number;
    filament: number;
    layer: number;
}


export class JobStatus extends Status {
    currentLayer: number;
    currentLayerTime: number;
    extrRaw: number[];
    fractionPrinted: number;
    filePosition: number;
    firstLayerDuration: number;
    firstLayerHeight: number;
    printDuration: number;
    warmUpDuration: number;
    timesLeft: TimeLeft;
}


class Probe {
    threshold: number;
    height: number;
    type: number;
}


class Tool {
    number: number;
    heaters: number[];
    drives: number[];
    axisMap: number[][];
    fans: number;
    filament: string;
    offset: number[];
}


class SensorValues {
    min: number;
    cur: number;
    max: number;
}


export class FullStatus extends JobStatus {
    coldExtrudeTemp: number;
    coldRetractTemp: number;
    compensation: string;
    controllableFans: number;
    tempLimit: number;
    endstops: number;
    firmwareName: string;
    geometry: string;
    axes: number;
    totalAxes: number;
    axisNames: string;
    volumes: number;
    mountedVolumes: number;
    name: string;
    probe: Probe;
    tools: Tool[];
    mcutemp: SensorValues;
    vin: SensorValues;
}


export class Configuration {
    accelerations: number[];
    axisMaxes: number[];
    axisMins: number[];
    currents: number[];
    dwsVersion: string;
    firmwareDate: string;
    firmwareElectronics: string;
    firmwareName: string;
    firmwareVersion: string;
    idleCurrentFactor: number;
    idleTimeout: number;
    maxFeedrates: number[];
    minFeedrates: number[];
}
