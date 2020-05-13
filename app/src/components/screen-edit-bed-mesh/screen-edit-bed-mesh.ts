import { autoinject } from 'aurelia-framework';
import { IPrinter } from '../../printer';
import { HeightMap } from 'printer/PrinterCommonModels';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { OrbitControls } from 'libraries/OrbitControls';
import { isArray } from 'util';
import { IScreen } from 'IScreen';



const viewWidth = 720;
const viewHeight = 428;

const pointTolerance = 2.0;
const smallIndicatorRadius = 0.01, mediumIndicatorRadius = 0.02, bigIndicatorRadius = 0.05;

const scaleZ = 0.5, maxVisualizationZ = 0.25;
const indicatorColor = 0xFFFFFF, indicatorOpacity = 0.4, indicatorOpacityHighlighted = 1.0;



@autoinject
export class ScreenEditBedMesh implements IScreen {

    isHidden: boolean = true;

    private autoBedLevelingEnabled: boolean = false;
    private probePoints: string;
    private area: string;
    private maxDeviationLow: string;
    private maxDeviationHigh: string;
    private meanError: string;
    private rmsError: string;
    private showingInfo: boolean = true;

    private heightMap: HeightMap;


    constructor(
        private printer: IPrinter
    ) { }

    public updateStatus() {
        this.autoBedLevelingEnabled = this.printer.view.bedCompensation.toLowerCase() != 'none';
    }

    public async loadHeightMap() {
        if (this.heightMap == undefined) {
            var map: HeightMap = await this.printer.getHeightMap();
            if (map != undefined) {
                this.probePoints = map.points.length.toString();
                this.area = map.geometry.area.toFixed(2);
                this.maxDeviationLow = map.statics.minError.toFixed(3);
                this.maxDeviationHigh = map.statics.maxError.toFixed(3);
                this.meanError = map.statics.meanError.toFixed(3);
                this.rmsError = map.statics.rmsError.toFixed(3);
                this.heightMap = map;
            }
        }

        setTimeout(() => {
            this.showHeightMap();    
        }, 300);        
    }

    clickedCancel() {
        this.isHidden = true;
        this.disposeScene();
    }

    clickedAutoBedLevelingSwitch() {
        if (!this.autoBedLevelingEnabled) {
            this.printer.loadMeshBedCompensation();
        }
        else {
            this.printer.disableBedCompensation();
        }
    }

    clickedRunMeshBedCompensation() {
        this.printer.runAutoBedCompensation();
    }

    private showHeightMap() {
        if (this.heightMap?.points != undefined && !this.ready) {
            this.initScene();
            this.showHeightmap(this.heightMap.points);
            this.animate();
        }
    }


    //------------------------------------------------------------------------

    private container: HTMLElement;
    private legend: HTMLCanvasElement;
    private tooltip: any;

    private hasHelpers: boolean;
    private ready: boolean;

    private tooltipX: number;
    private tooltipY: number;
    private tooltipZ: number;
    private tooltopVisible: boolean = false;
    private tooltipPosX: number;
    private tooltipPosY: number;


    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private lastIntersection: THREE.Intersection;


    private meshGeometry: THREE.Geometry;
    private meshPlane: THREE.Mesh;
    private meshIndicators: THREE.Mesh[];

    

    private initScene() {
        var camera = this.camera = new THREE.PerspectiveCamera(14, viewWidth / viewHeight, 0.1, 1000);
        camera.position.set(1, -1, 1);
        camera.up = new THREE.Vector3(0, 0, 1);

        var scene = this.scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 0, 30);

        const gridColor = new THREE.Color("rgb(70, 70, 70)");
        const grid = new THREE.GridHelper(1.1 * 100, 75, gridColor, gridColor);
        grid.rotation.x = -Math.PI / 2;
        scene.add(grid);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);

        var pointLight = new THREE.PointLight(0xffffff, 0.8);
        scene.add(camera);
        camera.add(pointLight);

        var renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(viewWidth, viewHeight);
        this.container.appendChild(renderer.domElement);

        var controls = this.controls = new OrbitControls(camera, renderer.domElement);
        controls.screenSpacePanning = true;
        controls.enableKeys = false;
        controls.enableZoom = true;
        controls.minDistance = 5;
        controls.maxDistance = 40;
        controls.target.set(0, 0, 0);
        controls.update();

        this._drawLegend(this.legend, maxVisualizationZ);

        window.addEventListener('resize', this.onWindowResize, false);
    }


    private disposeScene() {
        if (this.ready) {

            this.controls.dispose();

            var meshes: THREE.Mesh[] = [];
            this.scene.traverse(o => {
                if (o instanceof THREE.Mesh) {
                    meshes.push(o);
                }    
            });
            meshes.forEach(m => this.disposeMesh(m));

            this.scene.dispose();
            this.renderer.dispose();

            for (var i = this.container.children.length - 1; i >= 0 ; i--) {
                this.container.children[i].remove();
            }            

            this.scene = undefined;
            this.camera = undefined;
            this.renderer = undefined;
            this.controls = undefined;
            this.lastIntersection = undefined;
            this.meshIndicators = undefined;
            this.meshPlane = undefined;
            this.meshGeometry = undefined;

            this.hasHelpers = false;
            this.ready = false;
        }
    }


    private disposeMesh(mesh: THREE.Mesh) {
        if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
        }
        else if (isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
        }
        mesh.geometry.dispose();
        this.scene.remove(mesh);
    }


    private onWindowResize() {
        if (this.renderer != undefined) {
            this.renderer.setSize(viewWidth, viewHeight);
            this._drawLegend(this.legend, maxVisualizationZ);
        }
    }


    private animate() {
        if (this.renderer != undefined) {
            requestAnimationFrame(() => this.animate());
            this.render();
        }
    }


    private render() {
        this.renderer?.render(this.scene, this.camera);
    }


    private showHeightmap(points: number[][], probeRadius?: number) {
        // Clean up first
        if (this.meshGeometry) {
            this.scene.remove(this.meshPlane);
            this.meshIndicators.forEach(function (indicator) {
                this.remove(indicator);
            }, this.scene);

            this.meshGeometry = null;
            this.meshIndicators = null;
            this.lastIntersection = null;
        }

        // Generate stats
        let xMin, xMax, yMin, yMax;

        let numPoints: number = 0;
        let minDiff: number = undefined;
        let maxDiff: number = undefined;
        let meanError: number = 0;
        let rmsError: number = 0;
        let area: number;

        for (let i = 0; i < points.length; i++) {
            const z = points[i][2];
            if (!isNaN(z)) {
                const x = points[i][0];
                const y = points[i][1];
                if (xMin === undefined || xMin > x) { xMin = x; }
                if (xMax === undefined || xMax < x) { xMax = x; }
                if (yMin === undefined || yMin > y) { yMin = y; }
                if (yMax === undefined || yMax < y) { yMax = y; }

                numPoints++;
                meanError += z;
                rmsError += z * z;
                if (minDiff === undefined || minDiff > z) { minDiff = z; }
                if (maxDiff === undefined || maxDiff < z) { maxDiff = z; }
            }
        }

        area = probeRadius ? (probeRadius * probeRadius * Math.PI) : Math.abs((xMax - xMin) * (yMax - yMin));
        rmsError = Math.sqrt(((rmsError * numPoints) - (meanError * meanError))) / numPoints;
        meanError = meanError / numPoints;

        // Generate mesh geometry and apply face colors
        this.meshGeometry = this.generateMeshGeometry(points, xMin, xMax, yMin, yMax, scaleZ);
        this.setFaceColors(this.meshGeometry, scaleZ, maxVisualizationZ);

        // Make 3D mesh and add it
        const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
        this.meshPlane = new THREE.Mesh(this.meshGeometry, material);
        this.scene.add(this.meshPlane);

        // Make indicators and add them
        this.meshIndicators = this.generateIndicators(this.meshGeometry, numPoints, scaleZ, indicatorColor, indicatorOpacity);
        this.meshIndicators.forEach(function (indicator) {
            this.add(indicator);
        }, this.scene);

        if (!this.hasHelpers) {
            // Make axis arrows for XYZ
            var color = new THREE.Color();

            color.setHSL(0.4, 1, 0.5);
            this.arrow(0, 1, 0, 0.3, color);

            color.setHSL(0.008, 1, 0.5);
            this.arrow(1, 0, 0, 0.3, color);

            color.setHSL(0.56, 1, 0.5);
            this.arrow(0, 0, 1, 0.3, color);

            // Make grid on XY plane
            const grid = new THREE.GridHelper(1.1, 15);
            grid.rotation.x = -Math.PI / 2;
            this.scene.add(grid);

            // Don't add these helpers again
            this.hasHelpers = true;
        }

        // Render scene
        this.ready = true;
    }


    //------------------------------------------------------------------------
    // 3D Utilities

    private arrow(x: number, y: number, z: number, scale: number, color: THREE.Color) {

        const ox = -0.6, oy = -0.6, oz = 0;

        var geometry = new LineGeometry();
        geometry.setPositions([ox, oy, oz, ox + x * scale, oy + y * scale, oz + z * scale]);
        geometry.setColors([color.r, color.g, color.b, color.r, color.g, color.b]);

        var matLine = new LineMaterial({

            color: 0xffffff,
            linewidth: 0.005, // in pixels
            vertexColors: true,
            //resolution:  // to be set by renderer, eventually
            dashed: false

        });

        var line = new Line2(geometry, matLine);
        line.computeLineDistances();
        line.scale.set(1, 1, 1);
        this.scene.add(line);
    }


    private getColorByZ(z: number, maxVisualizationZ: number) {
        // Terrain color scheme (i.e. from blue to red, asymmetric)
        z = Math.max(Math.min(z, maxVisualizationZ), -maxVisualizationZ);
        const hue = 240 - ((z + maxVisualizationZ) / maxVisualizationZ) * 120;
        return new THREE.Color('hsl(' + hue + ',100%,45%)');
    }


    private setFaceColors(geometry: THREE.Geometry, scaleZ: number, maxVisualizationZ: number) {
        for (let i = 0; i < geometry.faces.length; i++) {
            const face = geometry.faces[i];
            const a = this.getColorByZ(geometry.vertices[face.a].z / scaleZ, maxVisualizationZ);
            const b = this.getColorByZ(geometry.vertices[face.b].z / scaleZ, maxVisualizationZ);
            const c = this.getColorByZ(geometry.vertices[face.c].z / scaleZ, maxVisualizationZ);

            if (face.vertexColors.length < 3) {
                face.vertexColors = [a, b, c];
            } else {
                face.vertexColors[0].copy(a);
                face.vertexColors[1].copy(b);
                face.vertexColors[2].copy(c);
            }
        }
        geometry.colorsNeedUpdate = true;
    }


    private getNearestZ(points: number[][], x: number, y: number, maxDelta?: number) {
        // Get the point that is closest to X+Y
        let point, delta;
        for (let i = 0; i < points.length; i++) {
            const deltaNew = Math.sqrt(Math.pow(x - points[i][0], 2) + Math.pow(y - points[i][1], 2));
            if (delta === undefined || deltaNew < delta) {
                point = points[i];
                delta = deltaNew;
            }
        }

        // Check if we exceed the maximum allowed delta
        if (delta === undefined || (maxDelta !== undefined && delta > maxDelta)) {
            return NaN;
        }

        // Otherwise return the closest Z coordinate of this point
        return point[2];
    }


    // Generate a mesh geometry
    private generateMeshGeometry(probePoints, xMin, xMax, yMin, yMax, scaleZ): THREE.Geometry {
        /** Cartesian 3-point and 5-point bed compensation (deprecated) **/

        if (probePoints.length === 3 || probePoints.length === 5) {
            const geometry: any = new THREE.Geometry();
            geometry.xMin = xMin;
            geometry.xMax = xMax;
            geometry.yMin = yMin;
            geometry.yMax = yMax;

            // Generate vertices
            for (let i = 0; i < probePoints.length; i++) {
                const x = (probePoints[i][0] - xMin) / (xMax - xMin) - 0.5;
                const y = (probePoints[i][1] - yMin) / (yMax - yMin) - 0.5;
                const z = probePoints[i][2] * scaleZ;

                geometry.vertices.push(new THREE.Vector3(x, y, z));
            }

            // Generate faces
            if (probePoints.length === 3) {
                geometry.faces.push(new THREE.Face3(0, 1, 2));
            } else {
                geometry.faces.push(new THREE.Face3(0, 1, 4));
                geometry.faces.push(new THREE.Face3(1, 2, 4));
                geometry.faces.push(new THREE.Face3(2, 3, 4));
                geometry.faces.push(new THREE.Face3(3, 0, 4));
            }

            return geometry;
        }

        /** New grid-based compensation **/

        // Find out how many different X+Y coordinates are used
        const xPoints = [], yPoints = [];
        for (let i = 0; i < probePoints.length; i++) {
            const z = probePoints[i][2];
            if (!isNaN(z)) {
                const x = probePoints[i][0], y = probePoints[i][1];
                if (xPoints.indexOf(x) === -1) {
                    xPoints.push(x);
                }
                if (yPoints.indexOf(y) === -1) {
                    yPoints.push(y);
                }
            }
        }

        // Check if the coordinates are valid
        if (!xPoints.some(point => !isNaN(point)) || !yPoints.some(point => !isNaN(point))) {
            throw new Error('InvalidHeightmapError');
        }

        // Generate plane geometry for grid
        const width = xMax - xMin, height = yMax - yMin;
        const planeWidth = (width < height) ? Math.abs(width / height) : 1.0;
        const planeHeight = (height < width) ? Math.abs(height / width) : 1.0;

        const planeGeometry: any = new THREE.PlaneGeometry(planeWidth, planeHeight, xPoints.length - 1, yPoints.length - 1);
        planeGeometry.xMin = xMin;
        planeGeometry.xMax = xMax;
        planeGeometry.yMin = yMin;
        planeGeometry.yMax = yMax;

        for (let i = planeGeometry.vertices.length - 1; i >= 0; i--) {
            const x = ((planeGeometry.vertices[i].x / planeWidth) + 0.5) * width + xMin;
            const y = ((planeGeometry.vertices[i].y / planeHeight) + 0.5) * height + yMin;
            const z = this.getNearestZ(probePoints, x, y) * scaleZ;

            planeGeometry.vertices[i].z = z;
        }

        // Add extra faces to each top row to avoid zig-zag lines (for round grids)
        let yCurrent;
        for (let i = 1; i < planeGeometry.vertices.length / 2; i++) {
            const vertex = planeGeometry.vertices[i], prevVertex = planeGeometry.vertices[i - 1];

            if (!isNaN(prevVertex.z) && isNaN(vertex.z)) {
                var yPoint = vertex.y;
                if (yCurrent === undefined || yCurrent > yPoint) {
                    // We are at the last defined point in this row
                    yCurrent = yPoint;

                    // Find the next two points below and below+right to this one
                    let a, b;
                    for (let k = i + 1; k < planeGeometry.vertices.length - 1; k++) {
                        const nextVertex = planeGeometry.vertices[k];
                        if (nextVertex.x === prevVertex.x && nextVertex.y === planeGeometry.vertices[k + 1].y) {
                            a = k;
                            b = k + 1;
                            break;
                        }
                    }

                    // If that succeeds add a new face
                    if (a !== undefined && !isNaN(planeGeometry.vertices[a].z) && !isNaN(planeGeometry.vertices[b].z)) {
                        const face = new THREE.Face3(a, b, i - 1);
                        planeGeometry.faces.push(face);
                    }
                }
            }
        }

        // Add extra faces to each bottom row to avoid zig-zag lines (for round grids)
        let prevVertex;
        for (let i = Math.floor(planeGeometry.vertices.length / 2); i < planeGeometry.vertices.length; i++) {
            const vertex = planeGeometry.vertices[i];

            // Check if this is the first defined point in this row
            if (prevVertex !== undefined && prevVertex.y === vertex.y && isNaN(prevVertex.z) && !isNaN(vertex.z)) {
                // Find the two points above and above+left to this one
                let a, b;
                for (let k = i - 1; k > 0; k--) {
                    const prevVertex = planeGeometry.vertices[k];
                    if (prevVertex.x === vertex.x && prevVertex.y === planeGeometry.vertices[k - 1].y) {
                        a = k - 1;
                        b = k;
                        break;
                    }
                }

                // If that succeeds add a new face
                if (a !== undefined && !isNaN(planeGeometry.vertices[a].z) && !isNaN(planeGeometry.vertices[b].z)) {
                    const face = new THREE.Face3(a, b, i);
                    planeGeometry.faces.push(face);
                }
            }
            prevVertex = vertex;
        }

        // Remove all the points and faces that have invalid values
        for (let i = planeGeometry.vertices.length - 1; i >= 0; i--) {
            if (isNaN(planeGeometry.vertices[i].z)) {
                // Remove and rearrange the associated face(s)
                for (let k = planeGeometry.faces.length - 1; k >= 0; k--) {
                    const face = planeGeometry.faces[k];
                    if (face.a === i || face.b === i || face.c === i) {
                        planeGeometry.faces.splice(k, 1);
                    } else {
                        if (face.a > i) { face.a--; }
                        if (face.b > i) { face.b--; }
                        if (face.c > i) { face.c--; }
                    }
                }

                // Remove this vertex
                planeGeometry.vertices.splice(i, 1);
            }
        }

        return planeGeometry;
    }


    private translateGridPoint(meshGeometry, vector, scaleZ) {
        let x, y;
        if (meshGeometry.type === 'PlaneGeometry') {
            x = (vector.x / meshGeometry.parameters.width + 0.5) * (meshGeometry.xMax - meshGeometry.xMin) + meshGeometry.xMin;
            y = (vector.y / meshGeometry.parameters.height + 0.5) * (meshGeometry.yMax - meshGeometry.yMin) + meshGeometry.yMin;
        } else if (meshGeometry.type === 'Geometry') {
            x = (vector.x + 0.5) * (meshGeometry.xMax - meshGeometry.xMin) + meshGeometry.xMin;
            y = (vector.y + 0.5) * (meshGeometry.yMax - meshGeometry.yMin) + meshGeometry.yMin;
        } else {
            throw new Error(`Unsupported geometry: ${meshGeometry.type}`);
        }
        const z = vector.z / scaleZ;
        return new THREE.Vector3(x, y, z);
    }


    // Generate ball-style indicators
    private generateIndicators(meshGeometry, numPoints, scaleZ, color, opacity): THREE.Mesh[] {
        let indicators: THREE.Mesh[] = [], centerPointGenerated = false;

        for (let i = 0; i < meshGeometry.vertices.length; i++) {
            // Convert world coordinate to 'real' probe coordinates
            const x = meshGeometry.vertices[i].x;
            const y = meshGeometry.vertices[i].y;
            const z = meshGeometry.vertices[i].z;
            const trueProbePoint = this.translateGridPoint(meshGeometry, new THREE.Vector3(x, y, z), scaleZ);

            // Skip center point if it already exists
            if (Math.sqrt(trueProbePoint.x * trueProbePoint.x + trueProbePoint.y * trueProbePoint.y) < pointTolerance) {
                if (centerPointGenerated) {
                    continue;
                }
                centerPointGenerated = true;
            }

            // If we have a close point, create a new indicator
            if (!isNaN(trueProbePoint.z)) {
                const radius = (numPoints > 64) ? smallIndicatorRadius
                    : (numPoints > 9) ? mediumIndicatorRadius
                        : bigIndicatorRadius;
                const sphereGeometry = new THREE.SphereGeometry(radius);
                sphereGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, z));

                const material = new THREE.MeshBasicMaterial({ color, opacity, transparent: true });
                const sphere: any = new THREE.Mesh(sphereGeometry, material);
                sphere.coords = trueProbePoint;

                indicators.push(sphere);
            }
        }
        return indicators;
    }


    //------------------------------------------------------------------------

    // Draw scale+legend next to the 3D control
    private _drawLegend(canvas: HTMLCanvasElement, maxVisualizationZ: number) {

        const font1: string = '18px \'Open Sans\', sans-serif';
        const font2: string = '14px \'Open Sans\', sans-serif';
        const x = 10;
        const y = -20;

        // Clear background
        const context = canvas.getContext('2d');
        canvas.width = 80;
        canvas.height = 428;
        context.rect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'transparent';
        context.fill();

        // Put annotations above gradient
        context.font = font1;
        context.textAlign = 'center';
        context.fillStyle = 'white';
        context.fillText(`${maxVisualizationZ}`, x + canvas.width / 2, y + 44);
        context.font = font2;
        context.fillText('mm', x + canvas.width / 2, y + 44 + 12);

        // Make scale gradient
        const showAxes = canvas.height > 180;
        let scaleHeight = showAxes ? (canvas.height - 139) : (canvas.height - 96);
        scaleHeight -= 16;

        const gradient = context.createLinearGradient(0, 66, 0, 66 + scaleHeight);
        gradient.addColorStop(0.0, 'hsl(0,100%,45%)');
        gradient.addColorStop(0.25, 'hsl(60,100%,45%)');
        gradient.addColorStop(0.5, 'hsl(120,100%,45%)');
        gradient.addColorStop(0.75, 'hsl(180,100%,45%)');
        gradient.addColorStop(1.0, 'hsl(240,100%,45%)');

        context.fillStyle = gradient;
        context.fillRect(x + canvas.width / 2 - 12, y + 66, 24, scaleHeight);

        // Put annotation below gradient
        context.fillStyle = 'white';
        context.font = font1;
        context.fillText(`${-maxVisualizationZ}`, x + canvas.width / 2, scaleHeight + y + 86);
        context.font = font2;
        context.fillText('mm', x + canvas.width / 2, scaleHeight + y + 86 + 12);
        scaleHeight += 16;

        // Add axes
        if (showAxes) {
            context.fillText('Axes', x + canvas.width / 2, scaleHeight + 109);
            context.font = 'bold ' + context.font;
            context.fillStyle = 'rgb(255, 12, 0)';
            context.fillText('X', x + canvas.width / 3, scaleHeight + 129);
            context.fillStyle = 'rgb(0, 255, 102)';
            context.fillText('Y', x + canvas.width / 2, scaleHeight + 129);
            context.fillStyle = 'rgb(0, 163, 255)';
            context.fillText('Z', x + 2 * canvas.width / 3, scaleHeight + 129);
        }
    }

}
