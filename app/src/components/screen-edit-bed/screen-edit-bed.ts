import { autoinject } from 'aurelia-framework';
import { App } from '../../app';
import { IPrinter } from '../../printer';


@autoinject
export class ScreenEditBed {

    isHidden: boolean = true;

    private state: number;
    private tempActive: number;
    private tempStandby: number;
    private autoBedLevelingEnabled: boolean;

    constructor(
        private app: App,
        private printer: IPrinter
    ) 
    { }

    public updateStatus() {
        this.state = this.printer.view.bedState;
        this.tempActive = this.printer.view.bedActiveTemp;
        this.tempStandby = this.printer.view.bedStandbyTemp;
        this.autoBedLevelingEnabled = this.printer.view.bedCompensation.toLowerCase() != 'none';
    }

    clickedActive() {
        this.printer.activateBed();
        //this.isHidden = true;
    }

    clickedStandby() {
        this.printer.standbyBed();
        //this.isHidden = true;
    }

    clickedOff() {
        this.printer.switchOffBed();
        //this.isHidden = true;
    }

    editTempActive() {
        this.app.editValue('Bed Temperature °C', this.tempActive, (value: number) => this.updateTempActive(value));
    }

    editTempStandby() {
    }

    updateTempActive(value: number) {
        this.printer.activateBed(value);
        //this.isHidden = true;
    }

    clickedBedMesh() {
        this.app.screenEditBedMesh.loadHeightMap();
        this.app.screenEditBedMesh.isHidden = false;        
    }

}
