import { autoinject } from 'aurelia-framework';
import { IPrinter, PrinterStatusEnum } from '../../printer';


class Axis {
    public values: string[];
    public selectedValue: string;
}

type AxisName = 'x' | 'y' | 'z';


@autoinject
export class ScreenEditAxis {

    isHidden: boolean = true;
    axesEnabled: boolean = true;

    private xValues: string[] = ['0.1', '1.0', '10.0', '50.0'];
    private yValues: string[] = ['0.1', '1.0', '10.0', '50.0'];
    private zValues: string[] = ['0.01', '0.1', '1.0', '10.0'];

    private axes: {[name: string]: Axis} = {
        x: {
            values: ['0.1', '1.0', '10.0', '50.0'],
            selectedValue: '10.0'
        },
        y: {
            values: ['0.1', '1.0', '10.0', '50.0'],
            selectedValue: '10.0'
        },
        z: {
            values: ['0.01', '0.1', '1.0', '10.0'],
            selectedValue: '1.0'
        }
    };

    private values: string[] = this.xValues;
    private selectedValue: string = '10.0';
    private value: number = 10;

    private _axis: AxisName;

    public set axis(value: AxisName) {
        if (value != undefined && value != this._axis) {            
            this._axis = value;
            this.values = this.axes[value].values;
            this.selectedValue = this.axes[value].selectedValue;
            this.value = parseFloat(this.selectedValue);
        }
    }


    constructor(
        private printer: IPrinter
    ) 
    { }

    updateStatus() {
        this.axesEnabled = this.printer.view.printerStatus != PrinterStatusEnum.processing;
    }
    
    clickedValue(v: string) {
        this.axes[this._axis].selectedValue = v;
        this.selectedValue = v;
        this.value = parseFloat(this.selectedValue);
    }

    clickedMoveBackward() {
        if (this.axesEnabled) {
            if (this._axis == 'x')
                this.printer.moveAxisRelative(-this.value);
            else if (this._axis == 'y')
                this.printer.moveAxisRelative(null, -this.value);
            else if (this._axis == 'z')
                this.printer.moveAxisRelative(null, null, -this.value);
        }
    }

    clickedMoveForward() {
        if (this.axesEnabled) {
            if (this._axis == 'x')
                this.printer.moveAxisRelative(this.value);
            else if (this._axis == 'y')
                this.printer.moveAxisRelative(null, this.value);
            else if (this._axis == 'z')
                this.printer.moveAxisRelative(null, null, this.value);
        }
    }

}
