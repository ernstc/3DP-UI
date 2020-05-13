import { autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { App } from '../../app';
import { IPrinter, MESSAGE_PRINTER_LOADED_GCODES, PrinterSettings } from '../../printer';
import * as IScroll from 'iscroll';


@autoinject
export class PageFiles {

    private currentDir: string;
    private files: string[];
    private folders: string[];
    private isRootFolder: boolean;

    filesWrapper: HTMLElement;
  

    constructor(
        private app: App,
        private printer: IPrinter,
        private eventAggregator: EventAggregator
    ) 
    { }

    attached() {
        this.eventAggregator.subscribe(MESSAGE_PRINTER_LOADED_GCODES, () => this.printerLoadedGcodes());
    }

    setupScrolling() {
        new IScroll(this.filesWrapper, {
            startX: 0,
            scrollX: false,
            scrollY: true,
            momentum: false,
            snap: false,
            snapSpeed: 400,
            keyBindings: false,
            mouseWheel: true,
            scrollbars: true
        });
    }

    private printerLoadedGcodes() {
        this.getFilesData();
        setTimeout(() => {
            this.setupScrolling();            
        }, 500);
    }

    private getFilesData() {
        var gcodes = this.printer.files;
        if (gcodes != undefined) {
            var dir = gcodes.dir;
            if (dir.startsWith(this.printer.view.rootDirGCodeFiles)) {
                dir = dir.substr(this.printer.view.rootDirGCodeFiles.length);
                if (dir.startsWith('/')) dir = dir.substr(1);
            }
            this.currentDir = dir;
            this.isRootFolder = this.currentDir == '';
            this.files = gcodes.files.filter(f => !f.startsWith('*'));
            this.folders = gcodes.files.filter(f => f.startsWith('*')).map(f => f.substr(1));
        }
    }

    clickedParent() {
        var dir = this.printer.files.dir;
        dir = dir.substring(0, dir.lastIndexOf('/'));
        this.printer.loadGCodeFiles(dir);
    }

    openFile(name: string) {
        this.app.screenGcodeFile.name = name;
        this.app.screenGcodeFile.isHidden = false;
        //this.printer.runMacro(name);
    }

    openFolder(name: string) {        
        this.printer.loadGCodeFiles(this.printer.files.dir + '/' + name);
    }
}
