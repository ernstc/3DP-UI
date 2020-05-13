import { autoinject } from 'aurelia-framework';
import { App } from '../../app';
import { IPrinter } from '../../printer';
import { IScreen } from 'IScreen';


@autoinject
export class ScreenEditTool implements IScreen {

    isHidden: boolean = true;

    private state: number;
    private tempActive: number;
    private tempStandby: number;

    constructor(
        private app: App,
        private printer: IPrinter
    ) 
    { }

    public updateStatus() {
        this.state = this.printer.view.toolState;
        this.tempActive = this.printer.view.toolActiveTemp;
        this.tempStandby = this.printer.view.toolStandbyTemp;
    }

    clickedActive() {
        this.printer.activateTool(0);
        //this.isHidden = true;
    }

    clickedStandby() {
        if (this.state != 0) {
            this.printer.standbyTool();
            //this.isHidden = true;
        }
    }

    clickedOff() {
        this.printer.switchOffTool(0);
        //this.isHidden = true;
    }

    editTempActive() {
        this.app.editValue('E0 Active °C', this.tempActive, (value: number) => this.updateTempActive(value));
    }

    editTempStandby() {
        this.app.editValue('E0 Standby °C', this.tempStandby, (value: number) => this.updateTempStandby(value));
    }

    updateTempActive(value: number) {
        this.printer.setToolTemperature(0, value, null);
        //this.isHidden = true;
    }
    
    updateTempStandby(value: number) {
        this.printer.setToolTemperature(0, null, value);
        //this.isHidden = true;
    }

    clickedMoveTool() {
        this.app.screenMoveTool.isHidden = false;
    }
    
}
