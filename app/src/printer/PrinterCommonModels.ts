export class PrinterFile {
    type: string;
    name: string;
    size: number;
    date: string;
}


export class PrinterFilesList {
    dir: string;
    files: PrinterFile[];
    first: number;
    next: number;
}


export class PrinterFiles {
    dir: string;
    files: string[];
    first: number;
    next: number;
    err: number;
}


export class GCodeFile {
    filament: number[];
    fileName: string;
    firstLayerHeight: number;
    generatedBy: string;
    height: number;
    lastModified: string;
    layerHeight: number;
    printDuration: number;
    printTime: number;
    size: number;
    err: number;

    get numLayers() {
        if (this.height && this.firstLayerHeight && this.layerHeight) {
			// approximate the number of layers if it isn't given
			return Math.round((this.height - this.firstLayerHeight) / this.layerHeight) + 1
		}
    }
}


export class HeightMap {
    geometry: HeightMapGeometry;
    statics: HeightMapStatistics;
    points: number[][];
}


export class HeightMapStatistics {
    minError: number;
    maxError: number;
    meanError: number;
    rmsError: number;
}


export class HeightMapGeometry {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    radius: number;
    xspacing: number;
    yspacing: number;
    xnum: number;
    ynum: number;
    area: number;
}
