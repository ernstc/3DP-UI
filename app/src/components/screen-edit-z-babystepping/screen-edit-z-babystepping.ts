import { autoinject } from 'aurelia-framework';
import { IPrinter } from '../../printer';


@autoinject
export class ScreenEditZBabystepping {

    isHidden: boolean = true;

    private levels: number[] = [0.01, 0.05, 0.10];
    level: number;


    constructor(
        private printer: IPrinter
    ) 
    { }

    attached() {
        this.level = 1;
    }

    clickedAdd() {
        this.printer.addZBabyStepping(this.levels[this.level]);
    }

    clickedRemove() {
        this.printer.addZBabyStepping(-this.levels[this.level]);
    }

}
