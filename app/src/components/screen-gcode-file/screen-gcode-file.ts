import { autoinject } from 'aurelia-framework';
import { App } from '../../app';
import { IPrinter } from '../../printer';


@autoinject
export class ScreenGcodeFile {

    isHidden: boolean = true;

    public name: string;

    constructor(
        private app: App,
        private printer: IPrinter
    ) 
    { }

    clickedCancel() {
        this.isHidden = true;
    }

    start() {
        this.printer.startPrinting(this.name);
        this.isHidden = true;
        this.app.showJobPage();
    }

    clickedSimulate() {
        this.printer.simulatePrinting(this.name);
        this.isHidden = true;
        this.app.showJobPage();
    }

    clickedPreview3D() {
        this.app.screenModel.isHidden = false;
        this.app.screenModel.progressPercentage = 1.0;
        this.app.screenModel.title = '3D Preview';
        this.app.screenModel.loadModel(this.printer.files.dir + '/' + this.name);
    }
}
