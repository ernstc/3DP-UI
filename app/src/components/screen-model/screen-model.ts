import { autoinject } from 'aurelia-framework';
import { IPrinter } from '../../printer';
import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OrbitControls } from 'libraries/OrbitControls';
import { isArray } from 'util';
import { GCodeModel } from 'libraries/GCodeModel';


const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 619;
const POINTS_LIMIT = window.navigator.userAgent.indexOf('Raspbian') > 0 ? 100000 : 5000000;


@autoinject
export class ScreenModel {

    isHidden: boolean = true;

    public title: string;
    private fileName: string;
    private gcodeModel: GCodeModel;

    private _isReady: boolean = false;
    public get isReady(): boolean {
        return this._isReady;
    }

    private _progressPercentage: number = 1.0;
    public set progressPercentage(value: number) {
        if (value < 0) value = 0;
        else if (value > 1) value = 1;
        this._progressPercentage = value;
        if (this._isReady) {
            this.updateModel();
        }
    }


    constructor(
        private printer: IPrinter
    ) {
    }

    clickedCancel() {
        this.isHidden = true;
        this.disposeScene();
        this.gcodeModel.dispose();
    }

    public async loadModel(file: string) {
        this.fileName = file.substr(file.lastIndexOf('/') + 1);

        var gcode: string = await this.printer.getFileContent(file);
        this.gcodeModel = new GCodeModel();
        this.gcodeModel.load(gcode);

        setTimeout(() => {
            this.initScene();
            this.showModel();
            this.animate();
            this._isReady = true;
        }, 300);
    }

    //------------------------------------------------------------------------

    private container: HTMLElement;
    private camera: THREE.Camera;
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;


    private showModel() {
        //this.addModel_points(this.gcodeModel);
        this.addModel_instancedMesh(this.gcodeModel, this.gcodeModel.extruderDiameter * 2, 4);
    }


    private initScene() {
        var camera = this.camera = new THREE.PerspectiveCamera(25, VIEW_WIDTH / VIEW_HEIGHT, 0.1, 1000);
        camera.position.set(1, -1, 1);
        camera.up = new THREE.Vector3(0, 0, 1);

        var scene = this.scene = new THREE.Scene();
        scene.background = new THREE.Color(0x303030);
        scene.fog = new THREE.Fog(0x303030, 0, 50);

        const gridColor = new THREE.Color("rgb(90, 90, 90)");
        const grid = new THREE.GridHelper(1.1 * 100, 75, gridColor, gridColor);
        grid.rotation.x = -Math.PI / 2;
        scene.add(grid);

        scene.add(camera);

        var renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(VIEW_WIDTH, VIEW_HEIGHT);
        renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(renderer.domElement);

        var controls = this.controls = new OrbitControls(camera, renderer.domElement);
        controls.screenSpacePanning = true;
        controls.enableKeys = false;
        controls.minDistance = 10;
        controls.maxDistance = 40;
        controls.maxPolarAngle = Math.PI / 2;
        controls.minPolarAngle = -Math.PI / 2;
        controls.target.set(0, 0, 0);
        controls.rotateUp(-Math.PI / 2);
        controls.update();

        window.addEventListener('resize', this.onWindowResize, false);
    }


    private disposeScene() {
        if (this._isReady) {
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

            for (var i = this.container.children.length - 1; i >= 0; i--) {
                this.container.children[i].remove();
            }

            this.scene = undefined;
            this.camera = undefined;
            this.renderer = undefined;
            this.controls = undefined;

            this._isReady = false;
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
            this.renderer.setSize(VIEW_WIDTH, VIEW_HEIGHT);
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


    private addModel_points(model: GCodeModel) {
        var geometry = new THREE.BufferGeometry();

        var color = new THREE.Color();
        color.setRGB(14 / 255, 126 / 255, 146 / 255);
        var colors = [];
        for (var i = 0; i < model.positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(model.positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        var min = geometry.boundingBox.min;
        var max = geometry.boundingBox.max;
        var sizeX = max.x - min.x;
        var sizeY = max.y - min.y;
        var sizeZ = max.z - min.z;
        var scale = 4 / Math.max(sizeX, sizeY, sizeZ);

        geometry.translate(-geometry.boundingSphere.center.x, -geometry.boundingSphere.center.y, -min.z);
        geometry.scale(scale, scale, scale);
        geometry.rotateZ(Math.PI / 4);

        this.controls.target.set(
            geometry.boundingSphere.center.x,
            geometry.boundingSphere.center.y,
            geometry.boundingSphere.center.z
        );
        this.controls.update();

        var material = new THREE.PointsMaterial({ size: 0.02, vertexColors: true });
        var points = new THREE.Points(geometry, material);
        this.scene.add(points);
    }



    private completedPartMesh: THREE.Mesh;
    private incompletePartMesh: THREE.Mesh;


    private addModel_instancedMesh(model: GCodeModel, pointSize: number, resolution: number) {
        let pointsCount = model.positions.length / 3;        
        let modelPoints: number[];

        if (pointsCount <= POINTS_LIMIT)
            modelPoints = model.positions;
        else {
            let stepSize = Math.ceil(pointsCount / POINTS_LIMIT);
            pointsCount = Math.floor(pointsCount / stepSize);
            modelPoints = [];
            for (var i = 0; i < pointsCount; i++) {
                modelPoints.push(model.positions[i * 3 * stepSize]);
                modelPoints.push(model.positions[i * 3 * stepSize + 1]);
                modelPoints.push(model.positions[i * 3 * stepSize + 2]);
            }
        }

        var pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(modelPoints, 3));
        pointsGeometry.computeBoundingSphere();
        pointsGeometry.computeBoundingBox();

        var center = pointsGeometry.boundingSphere.center;
        var min = pointsGeometry.boundingBox.min;
        var max = pointsGeometry.boundingBox.max;
        var sizeX = max.x - min.x;
        var sizeY = max.y - min.y;
        var sizeZ = max.z - min.z;
        var scale = 4 / Math.max(sizeX, sizeY, sizeZ);

        pointsGeometry.translate(-center.x, -center.y, -min.z);
        pointsGeometry.scale(scale, scale, scale);
        pointsGeometry.rotateZ(Math.PI / 3);

        this.controls.target.set(
            pointsGeometry.boundingSphere.center.x,
            pointsGeometry.boundingSphere.center.y,
            pointsGeometry.boundingSphere.center.z
        );
        this.controls.update();

        
        let points = pointsGeometry.attributes.position.array;
        let progressLimit = Math.floor(pointsCount * this._progressPercentage);
        let matrix = new THREE.Matrix4();

        // Completed part

        let completedCount = Math.min(pointsCount, progressLimit);
        let geometry = new THREE.SphereBufferGeometry(pointSize * scale, resolution, resolution);
        geometry.computeVertexNormals();
        let material = new THREE.MeshNormalMaterial();
        let mesh = new THREE.InstancedMesh(geometry, material, completedCount);
        for (var i = 0; i < completedCount; i++) {
            matrix.makeTranslation(
                points[i * 3],
                points[i * 3 + 1],
                points[i * 3 + 2]
            );
            mesh.setMatrixAt(i, matrix);
        }
        this.scene.add(mesh);
        this.completedPartMesh = mesh;

        // Incomplete part

        let incompletedCount = pointsCount - completedCount;
        if (incompletedCount > 0) {
            let geometry = new THREE.SphereBufferGeometry(pointSize * scale, 2, 2);
            let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
            let mesh = new THREE.InstancedMesh(geometry, material, incompletedCount);            
            for (var i = completedCount; i < pointsCount; i++) {
                matrix.makeTranslation(
                    points[i * 3],
                    points[i * 3 + 1],
                    points[i * 3 + 2]
                );
                mesh.setMatrixAt(i - completedCount, matrix);
            }
            this.scene.add(mesh);
            this.incompletePartMesh = mesh;
        }

        pointsGeometry.dispose();
    }


    private updateModel() {
        if (this.completedPartMesh != undefined) {
            this.disposeMesh(this.completedPartMesh);
            this.completedPartMesh = undefined;

            if (this.incompletePartMesh != undefined) {
                this.disposeMesh(this.incompletePartMesh);
                this.incompletePartMesh = undefined;
            }

            this.showModel();
        }
    }

}
