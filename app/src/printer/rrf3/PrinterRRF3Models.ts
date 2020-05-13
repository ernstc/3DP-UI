export class FullStatus {
    boards: Board[];
    directories: Directories;
    fans: Fan[];
    heat: Heat;
    httpEndpoints: any[];
    inputs: Input[];
    job: Job;
    limits: Limits;
    messages: any[];
    move: Move;
    network: Network;
    scanner: Scanner;
    sensors: Sensors;
    spindles: Spindle[];
    state: State;
    tools: Tool[];
    userSessions: UserSession[];
    userVariables: any[];
    volumes: Volume[];
}


class Board {
    bootloaderFileName: string;
    canAddress: number;
    firmwareDate: string;
    firmwareFileName: string;
    firmwareName: string;
    firmwareVersion: string;
    iapFileNameSBC: string;
    iapFileNameSD: string;
    maxHeaters: number;
    maxMotors: number;
    mcuTemp: Measure;
    name: string;
    shortName: string;
    supports12864: boolean;
    v12: Measure;
    vIn: Measure;
}


class Measure {
    current: number;
    min: number;
    max: number;
}


class Directories {
    filaments: string;
    firmware: string;
    gCodes: string;
    macros: string;
    menu: string;
    scans: string;
    system: string;
    web: string;
}


class Fan {
    actualValue: number;
    blip: number;
    frequency: number;
    max: number;
    min: number;
    name: string;
    requestedValue: number;
    rpm: number;
    thermostatic: Thermostatic;
}


class Thermostatic {
    heaters: number[];
    highTemperature: number;
    lowTemperature: number;
}


class Heat {
    bedHeaters: number[];
    chamberHeaters: number[];
    coldExtrudeTemperature: number;
    coldRetractTemperature: number;
    heaters: Heater[];
}


class Heater {
    active: number;
    current: number;
    max: number;
    min: number;
    model: HeaterModel;
    monitors: HeaterMonitor[];
    name: string;
    sensor: number;
    standby: number;
    state: string;
}


class HeaterModel {
    deadTime: number;
    enabled: boolean;
    gain: number;
    inverted: boolean;
    maxPwm: number;
    pid: HeaterModelPID;
    standardVoltage: number;
    timeConstant: number;
}


class HeaterModelPID {
    overridden: boolean;
    p: number;
    i: number;
    d: number;
    used: boolean;
}


class HeaterMonitor {
    action: number;
    condition: string;
    limit: number;
}


class Input {
    axesRelative: boolean;
    compatibility: string;
    distanceUnit: string;
    drivesRelative: boolean;
    feedRate: number;
    inMacro: boolean;
    name: string;
    stackDepth: number;
    state: string;
    lineNumber: number;   
    volumetric: boolean;
}


class Job {
    build: any;
    duration: number;
    file: JobFile;
    filePosition: number;
    firstLayerDuration: number;
    lastDuration: number;
    lastFileName: string;
    lastFileAborted: boolean;
    lastFileCancelled: boolean;
    lastFileSimulated: boolean;
    layer: number;
    layerTime: number;
    layers: JobLayer[];
    timesLeft: JobTimesLeft;
    warmUpDuration: number;
}


class JobLayer {
    duration: number;
    filament: number[];
    fractionPrinted: number;
    height: number;
}


class JobFile {
    filament: any[];
    fileName: string;
    firstLayerHeight: number;
    generatedBy: any;
    height: number;
    lastModified: any;
    layerHeight: number;
    numLayers: number;
    printTime: any;
    simulatedTime: any;
    size: number;
}


class JobTimesLeft {
    filament: any;
    file: any;
    layer: any;
}


class Limits {
    axes: number;
    axesPlusExtruders: number;
    bedHeaters: number;
    boards: number;
    chamberHeaters: number;
    drivers: number;
    driversPerAxis: number;
    extruders: number;
    extrudersPerTool: number;
    fans: number;
    gpInPorts: number;
    gpOutPorts: number;
    heaters: number;
    heatersPerTool: number;
    monitorsPerHeater: number;
    restorePoints: number;
    sensors: number;
    spindles: number;
    tools: number;
    trackedObjects: number;
    triggers: number;
    volumes: number;
    workplaces: number;
    zProbeProgramBytes: number;
    zProbes: number;
}


class Move {
    axes: MoveAxis[];
    calibration: MoveCalibration;
    compensation: MoveCompensation;
    currentMove: CurrentMove;
    daa: DAA;
    extruders: Extruder[];
    idle: Idle;
    kinematics: Kinematics;
    printingAcceleration: number;
    speedFactor: number;
    travelAcceleration: number;
    workspaceNumber: number;
}


class MoveAxis {
    acceleration: number;
    babystep: number;
    current: number;
    drivers: string[];
    homed: boolean;
    jerk: number;
    letter: string;
    machinePosition: number;
    max: number;
    maxProbed: boolean;
    microstepping: Microstepping;
    min: number;
    minProbed: boolean;
    speed: number;
    stepsPerMm: number;
    userPosition: number;
    visible: boolean;
    workplaceOffsets: number[]
}


class Microstepping {
    interpolated: boolean;
    value: number;
}


class MoveCalibration {
    final: Calibration;
    initial: Calibration;
    numFactors: number;
}


class Calibration {
    deviation: number;
    mean: number;
}


class MoveCompensation {
    fadeHeight: number;
    file: any;
    meshDeviation: any;
    probeGrid: ProbeGrid;
    skew: Skew;
    type: string;
}


class ProbeGrid {
    xMin: number;
    xMax: number;
    xSpacing: number;
    yMin: number;
    yMax: number;
    ySpacing: number;
    radius: number;
}


class Skew {
    tanXY: number;
    tanXZ: number;
    tanYZ: number;
}


class CurrentMove {
    acceleration: number;
    deceleration: number;
    laserPwm: any;
    requestedSpeed: number;
    topSpeed: number;
}


class DAA {
    enabled: boolean;
    minimumAcceleration: number;
    period: number;
}


class Extruder {
    acceleration: number;
    current: number;
    driver: string;
    filament: string;
    factor: number;
    jerk: number;
    microstepping: Microstepping;
    nonlinear: Nonlinear;
    position: number;
    pressureAdvance: number;
    rawPosition: number;
    speed: number;
    stepsPerMm: number;
}


class Nonlinear {
    a: number;
    b: number;
    upperLimit: number;
}


class Idle {
    timeout: number;
    factor: number;
}


class Kinematics {
    forwardMatrix: number[][];
    inverseMatrix: number[][];
    name: string;
}


class Network {
    hostname: string;
    interfaces: NetworkInterface[];
    name: string;
}


class NetworkInterface {
    activeProtocols: any[];
    actualIP: string;
    configuredIP: string;
    firmwareVersion: string;
    gateway: string;
    mac: string;
    numReconnects: any;
    signal: any;
    speed: any;
    subnet: string;
    type: string;
}


class Scanner {
    progress: number;
    status: string;
}


class Sensors {
    analog: AnalogSensor[];
    endstops: Endstop[];
    filamentMonitors: FilamentMonitor[];
    gpIn: any[];
    probes: Probe[];
}


class AnalogSensor {
    lastReading: number;
    name: string;
    type: string;
}


class Endstop {
    triggered: boolean;
    type: string;
    probeNumber: any;
}


class FilamentMonitor {
    filamentPresent: boolean;
    enabled: boolean;
    type: string;
}


class Probe {
    calibrationTemperature: number;
    deployedByUser: boolean;
    disablesHeaters: boolean;
    diveHeight: number;
    maxProbeCount: number;
    offsets: number[];
    recoveryTime: number;
    speed: number;
    temperatureCoefficient: number;
    threshold: number;
    tolerance: number;
    travelSpeed: number;
    triggerHeight: number;
    type: number;
    value: number[];
}


class Spindle {
    active: number;
    current: number;
    frequency: number;
    min: number;
    max: number;
    tool: number;
}


class State {
    atxPower: any;
    beep: any;
    currentTool: number;
    displayMessage: string;
    dsfVersion: string;
    gpOut: any[];
    laserPwm: any;
    logFile: string;
    messageBox: any;
    machineMode: string;
    nextTool: number;
    powerFailScript: string;
    previousTool: number;
    restorePoints: RestorePoint[];
    status: string;
    upTime: number;
}


class RestorePoint {
    coords: number[];
    extruderPos: number;
    feedRate: number;
    ioBits: number;
    laserPwm: any;
    spindleSpeeds: number[];
    toolNumber: number;
}


class Tool {
    active: number[];
    axes: number[][];
    extruders: number[];
    fans: number[];
    filamentExtruder: number;
    heaters: number[];
    mix: number[];
    name: string;
    number: number;
    offsets: number[];
    offsetsProbed: number;
    retraction: ToolRetraction;
    standby: number[];
    state: string;
}


class ToolRetraction {
    extraRestart: number;
    length: number;
    speed: number;
    unretractSpeed: number;
    zHop: number;
}


class UserSession {
    id: number;
    accessLevel: string;
    sessionType: string;
    origin: string;
    originId: number;
}


class Volume {
    capacity: number;
    freeSpace: number;
    mounted: boolean;
    name: any;
    openFiles: any;
    path: string;
    speed: any;
}
