import { autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { App } from '../../app';
import { IPrinter, MESSAGE_PRINTER_LOADED_MACROS, PrinterSettings } from '../../printer';
import * as IScroll from 'iscroll';


@autoinject
export class PageMacro {

    private currentDir: string;
    private files: string[];
    private folders: string[];
    private isRootFolder: boolean;

    macroWrapper: HTMLElement;
  

    constructor(
        private printer: IPrinter,
        private eventAggregator: EventAggregator
    ) 
    { }

    attached() {
        this.eventAggregator.subscribe(MESSAGE_PRINTER_LOADED_MACROS, () => this.printerLoadedMacros());
    }

    setupScrolling() {
        new IScroll(this.macroWrapper, {
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

    private printerLoadedMacros() {
        this.getMacrosData();
        setTimeout(() => {
            this.setupScrolling();            
        }, 500);
    }

    private getMacrosData() {
        var macros = this.printer.macros;
        if (macros != undefined) {
            var dir = macros.dir;
            if (dir.startsWith(this.printer.view.rootDirMacros)) {
                dir = dir.substr(this.printer.view.rootDirMacros.length);
                if (dir.startsWith('/')) dir = dir.substr(1);
            }
            this.currentDir = dir;
            this.isRootFolder = this.currentDir == '';
            this.files = macros.files.filter(f => !f.startsWith('*'));
            this.folders = macros.files.filter(f => f.startsWith('*')).map(f => f.substr(1));
        }
    }

    clickedParent() {
        var dir = this.printer.view.rootDirMacros + '/' + this.currentDir;
        dir = dir.substring(0, dir.lastIndexOf('/'));
        this.printer.loadMacros(dir);
    }

    executeMacro(name: string) {
        this.printer.runMacro(name);
    }

    openFolder(name: string) {        
        this.printer.loadMacros(this.printer.view.rootDirMacros + '/' + name);
    }
    
}
