import { autoinject } from 'aurelia-framework';
import { IPrinter } from '../../printer';


@autoinject
export class ScreenEditAxis {

    isHidden: boolean = true;
    axis: string;

    private values: string[] = ['0.1', '1.0', '10.0', '50.0'];
    private selectedValue: string = '10.0';
    private value: number = 10;

    constructor(
        private printer: IPrinter
    ) 
    { }

    clickedValue(v: string) {
        this.selectedValue = v;
        this.value = parseFloat(this.selectedValue);
    }

    clickedMoveBackward() {
        if (this.axis == 'x')
            this.printer.moveAxisRelative(-this.value);
        else if (this.axis == 'y')
            this.printer.moveAxisRelative(null, -this.value);
        else if (this.axis == 'z')
            this.printer.moveAxisRelative(null, null, -this.value);
    }

    clickedMoveForward() {
        if (this.axis == 'x')
            this.printer.moveAxisRelative(this.value);
        else if (this.axis == 'y')
            this.printer.moveAxisRelative(null, this.value);
        else if (this.axis == 'z')
            this.printer.moveAxisRelative(null, null, this.value);
    }

}
