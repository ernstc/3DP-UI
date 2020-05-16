import { autoinject } from 'aurelia-framework';
import { IPrinter } from '../../printer';


@autoinject
export class ScreenEditAxis {

    isHidden: boolean = true;
    axis: string;

    private xValues: string[] = ['0.1', '1.0', '10.0', '50.0'];
    private yValues: string[] = ['0.1', '1.0', '10.0', '50.0'];
    private zValues: string[] = ['0.01', '0.1', '1.0', '10.0'];

    private values: string[] = ['0.1', '1.0', '10.0', '50.0'];
    private selectedValue: string = '10.0';
    private value: number = 10;

    constructor(
        private printer: IPrinter
    ) 
    { }

    attached() {
        this.values = 
            this.axis == 'x' ? this.xValues :
            this.axis == 'y' ? this.yValues :
            this.axis == 'z' ? this.zValues :
            [];
    }

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
