import { autoinject } from 'aurelia-framework';
import { IPrinter } from '../../printer';


@autoinject
export class ScreenMoveTool {

    isHidden: boolean = true;

    private lengthValues: number[] = [1, 5, 10, 50, 100];
    private speedValues: number[] = [1, 5, 15, 30, 60];
    private length: number = 1;
    private speed: number = 1;

    private title: string = 'E0';
    private temperature: string;

    canRetract: boolean = false;
    canExtrude: boolean = false;


    constructor(
        private printer: IPrinter
    ) 
    { }

    public updateStatus() {
        var toolTemp = this.printer.view.toolCurrentTemp;
        this.temperature = toolTemp.toFixed(1) + ' °C';
        this.canRetract = toolTemp > this.printer.view.coldRetractTemp;
        this.canExtrude = toolTemp > this.printer.view.coldExtrudeTemp;
    }

    clickedCancel() {
        this.isHidden = true;
    }

    clickedRetract() {
        this.printer.retract(this.length, this.speed);
    }

    clickedExtrude() {
        this.printer.extrude(this.length, this.speed);
    }

}
