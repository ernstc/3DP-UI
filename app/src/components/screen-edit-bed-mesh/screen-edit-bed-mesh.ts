import { autoinject } from 'aurelia-framework';
import { IPrinter } from '../../printer';
import { HeightMap } from 'printer/PrinterCommonModels';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { OrbitControls } from 'libraries/OrbitControls';
import { IScreen } from 'IScreen';
import { BufferAttribute } from 'three';



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

    private hasHelpers: boolean;
    private ready: boolean;

    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;


    private meshGeometry: THREE.BufferGeometry;
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

            //this.scene.dispose();
            this.renderer.dispose();

            for (var i = this.container.children.length - 1; i >= 0 ; i--) {
                this.container.children[i].remove();
            }            

            this.scene = undefined;
            this.camera = undefined;
            this.renderer = undefined;
            this.controls = undefined;
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
        else if (Array.isArray(mesh.material)) {
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
        }

        // Generate stats
        let xMin: number, xMax: number, yMin: number, yMax: number;

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
        this.meshIndicators = this.generateIndicators(this.meshGeometry, numPoints, xMin, xMax, yMin, yMax, scaleZ, indicatorColor, indicatorOpacity);
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


    private setFaceColors(geometry: THREE.BufferGeometry, scaleZ: number, maxVisualizationZ: number): void {

        const vertices = geometry.getAttribute('position');
        const faces = geometry.getIndex();
        let colors = new Float32Array(vertices.array.length);

        for (let i = 0; i < faces.count; i++) {
            const faceA = faces.getX(i), faceB = faces.getY(i), faceC = faces.getZ(i);
            const a = this.getColorByZ(vertices.getZ(faceA) / scaleZ, maxVisualizationZ);
            const b = this.getColorByZ(vertices.getZ(faceB) / scaleZ, maxVisualizationZ);
            const c = this.getColorByZ(vertices.getZ(faceC) / scaleZ, maxVisualizationZ);

            let vIndex = faceA * 3;
            colors[vIndex] = a.r;
            colors[++vIndex] = a.g;
            colors[++vIndex] = a.b;

            vIndex = faceB * 3;
            colors[vIndex] = b.r;
            colors[++vIndex] = b.g;
            colors[++vIndex] = b.b;

            vIndex = faceC * 3;
            colors[vIndex] = c.r;
            colors[++vIndex] = c.g;
            colors[++vIndex] = c.b;
        }
        geometry.setAttribute('color', new BufferAttribute(colors, 3));
    }


    private getNearestZ(points: number[][], x: number, y: number, maxDelta?: number): number {
        // Get the point that is closest to X+Y
        let point: number[], delta: number;
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
    private generateMeshGeometry(probePoints: number[][], xMin: number, xMax: number, yMin: number, yMax: number, scaleZ: number): THREE.BufferGeometry {
        /** Cartesian 3-point and 5-point bed compensation (deprecated) **/

        if (probePoints.length === 3 || probePoints.length === 5) {
            const geometry = new THREE.BufferGeometry();
            
            let points: Float32Array = new Float32Array(probePoints.length * 3);

            // Generate vertices
            for (let i = 0, pointIndex = 0; i < probePoints.length; i++) {
                const x = (probePoints[i][0] - xMin) / (xMax - xMin) - 0.5;
                const y = (probePoints[i][1] - yMin) / (yMax - yMin) - 0.5;
                const z = probePoints[i][2] * scaleZ;

                points[pointIndex++] = x;
                points[pointIndex++] = y;
                points[pointIndex++] = z;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));

            // Generate faces
            if (probePoints.length === 3) {
                geometry.setIndex([
                    0, 1, 2
                ]);
            } else {
                geometry.setIndex([
                    0, 1, 4,
                    1, 2, 4,
                    2, 3, 4,
                    3, 0, 4
                ]);
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

        const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight, xPoints.length - 1, yPoints.length - 1);
        
        let vertices = planeGeometry.getAttribute('position');
        
        for (let i = vertices.count - 1; i >= 0; i--) {
            const x = ((vertices.getX(i) / planeWidth) + 0.5) * width + xMin;
            const y = ((vertices.getY(i) / planeHeight) + 0.5) * height + yMin;
            const z = this.getNearestZ(probePoints, x, y) * scaleZ;

            vertices.setZ(i, z);
        }

        let facesIndexes: number[] = [];

        // Add extra faces to each top row to avoid zig-zag lines (for round grids)
        let yCurrent: number;
        for (let i = 1; i < vertices.count / 2; i++) {

            const vertex = new THREE.Vector3(vertices.getX(i), vertices.getY(i), vertices.getZ(i));
            const prev = new THREE.Vector3(vertices.getX(i - 1), vertices.getY(i - 1), vertices.getZ(i - 1));

            if (!isNaN(prev.z) && isNaN(vertex.z)) {
                var yPoint = vertex.y;
                if (yCurrent === undefined || yCurrent > yPoint) {
                    // We are at the last defined point in this row
                    yCurrent = yPoint;

                    // Find the next two points below and below+right to this one
                    let a: number, b: number;
                    for (let k = i + 1; k < vertices.count - 1; k++) {
                        const nextVertex = new THREE.Vector3(vertices.getX(k), vertices.getY(k), vertices.getZ(k));
                        if (nextVertex.x === prev.x && nextVertex.y === vertices.getY(k + 1)) {
                            a = k;
                            b = k + 1;
                            break;
                        }
                    }

                    // If that succeeds add a new face
                    if (a !== undefined && !isNaN(vertices.getZ(a)) && !isNaN(vertices.getZ(b))) {
                        facesIndexes.push(a);
                        facesIndexes.push(b);
                        facesIndexes.push(i - 1);
                    }
                }
            }
        }

        // Add extra faces to each bottom row to avoid zig-zag lines (for round grids)
        let prevVertex: THREE.Vector3;
        for (let i = Math.floor(vertices.count / 2); i < vertices.count; i++) {
            const vertex = new THREE.Vector3(vertices.getX(i), vertices.getY(i), vertices.getZ(i));

            // Check if this is the first defined point in this row
            if (prevVertex !== undefined && prevVertex.y === vertex.y && isNaN(prevVertex.z) && !isNaN(vertex.z)) {
                // Find the two points above and above+left to this one
                let a: number, b: number;
                for (let k = i - 1; k > 0; k--) {
                    const prevVertex = new THREE.Vector3(vertices.getX(k), vertices.getY(k), vertices.getZ(k));
                    if (prevVertex.x === vertex.x && prevVertex.y === vertices.getY(k - 1)) {
                        a = k - 1;
                        b = k;
                        break;
                    }
                }

                // If that succeeds add a new face
                if (a !== undefined && !isNaN(vertices.getZ(a)) && !isNaN(vertices.getZ(b))) {
                    facesIndexes.push(a);
                    facesIndexes.push(b);
                    facesIndexes.push(i);
                }
            }
            prevVertex = vertex;
        }

        // Remove all the points and faces that have invalid values
        /*for (let i = vertices.count - 1; i >= 0; i--) {
            if (isNaN(vertices.getZ(i))) {
                // Remove and rearrange the associated face(s)
                for (let k = vertices.count - 1; k >= 0; k--) {
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
        }*/

        return planeGeometry;
    }


    private translateGridPoint(meshGeometry: THREE.BufferGeometry, vector: THREE.Vector3, xMin: number, xMax: number, yMin: number, yMax: number, scaleZ: number): THREE.Vector3 {
        let x: number, y: number;
        if (meshGeometry instanceof THREE.PlaneGeometry) {
            x = (vector.x / meshGeometry.parameters.width + 0.5) * (xMax - xMin) + xMin;
            y = (vector.y / meshGeometry.parameters.height + 0.5) * (yMax - yMin) + yMin;
        } else {
            throw new Error(`Unsupported geometry: ${meshGeometry.type}`);
        }
        const z = vector.z / scaleZ;
        return new THREE.Vector3(x, y, z);
    }


    // Generate ball-style indicators
    private generateIndicators(meshGeometry: THREE.BufferGeometry, numPoints: number, xMin: number, xMax: number, yMin: number, yMax: number, scaleZ: number, color: number, opacity: number): THREE.Mesh[] {
        let indicators: THREE.Mesh[] = [], centerPointGenerated = false;

        let vertices = meshGeometry.getAttribute('position');

        for (let i = 0; i < vertices.count; i++) {
            // Convert world coordinate to 'real' probe coordinates
            const x = vertices.getX(i);
            const y = vertices.getY(i);
            const z = vertices.getZ(i);
            const trueProbePoint = this.translateGridPoint(meshGeometry, new THREE.Vector3(x, y, z), xMin, xMax, yMin, yMax, scaleZ);

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
                const sphere = new THREE.Mesh(sphereGeometry, material);

                indicators.push(sphere);
            }
        }
        return indicators;
    }


    //------------------------------------------------------------------------

    // Draw scale+legend next to the 3D control
    private _drawLegend(canvas: HTMLCanvasElement, maxVisualizationZ: number): void {

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
