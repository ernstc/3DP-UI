import { autoinject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { IPrinter, MESSAGE_PRINTER_OFFLINE, MESSAGE_PRINTER_ONLINE, MESSAGE_PRINTER_ERROR, PrinterStatusEnum, MESSAGE_STATUS_UPDATED } from './printer';
import * as IScroll from 'iscroll';
import * as UI from 'ui-messages';
import { PageHome } from 'components/page-home/page-home';
import { ScreenEditTool } from 'components/screen-edit-tool/screen-edit-tool';
import { ScreenMoveTool } from "components/screen-move-tool/screen-move-tool";
import { ScreenEditBed } from "components/screen-edit-bed/screen-edit-bed";
import { ScreenEditBedMesh } from "components/screen-edit-bed-mesh/screen-edit-bed-mesh";
import { ScreenEditAxis } from "components/screen-edit-axis/screen-edit-axis";
import { ScreenEditZBabystepping } from "components/screen-edit-z-babystepping/screen-edit-z-babystepping";
import { ScreenNumericKeypad } from "components/screen-numeric-keypad/screen-numeric-keypad";
import { ScreenGcodeFile } from "components/screen-gcode-file/screen-gcode-file";
import { ScreenModel } from "components/screen-model/screen-model";
import { PageJob } from 'components/page-job/page-job';
import { PageSettings } from 'components/page-settings/page-settings';
import { PageMacro } from 'components/page-macro/page-macro';
import { PageFiles } from 'components/page-files/page-files';


@autoinject
export class App {

    isPrinterOffline: boolean = false;
    printerErrors: string[] = null;
    pageIndex: number = 1;

    pageSettings: PageSettings;
    pageHome: PageHome;
    pageJob: PageJob;
    pageMacro: PageMacro;
    pageFiles: PageFiles;

    screenEditTool: ScreenEditTool;
    screenMoveTool: ScreenMoveTool;
    screenEditBed: ScreenEditBed;
    screenEditBedMesh: ScreenEditBedMesh;
    screenEditAxis: ScreenEditAxis;
    screenEditZBabystepping: ScreenEditZBabystepping;
    screenNumericKeypad: ScreenNumericKeypad;
    screenGcodeFile: ScreenGcodeFile;
    screenModel: ScreenModel;

    display: HTMLElement;

    private _isFirstUpdate: boolean = true;


    constructor(
        private printer: IPrinter,
        private eventAggregator: EventAggregator
    ) 
    { }

    attached() {
        this.resizeDisplay();
        window.addEventListener('resize', () => this.resizeDisplay());

        document.addEventListener('touchmove', function (e) { e.preventDefault(); }, this.isPassive() ? {
            capture: false,
            passive: false
        } : false);

        this.setPageScrolling(true);
        this.eventAggregator.subscribe(MESSAGE_STATUS_UPDATED, () => this.updateStatus());
        this.eventAggregator.subscribe(MESSAGE_PRINTER_OFFLINE, () => this.printerOffline());
        this.eventAggregator.subscribe(MESSAGE_PRINTER_ONLINE, () => this.printerOnline());
        this.eventAggregator.subscribe(MESSAGE_PRINTER_ERROR, (errors: string[]) => this.printerError(errors));
        this.eventAggregator.subscribe(UI.MESSAGE_UI_UPDATE, () => this.updateUI());
    }

    resizeDisplay() {
        // Set the zoom factor for current screen
        var win: any = window;
        var heightFactor = win.innerHeight / 720;
        var widthFactor = win.innerWidth / 720;
        var aspectRation = heightFactor / widthFactor;
        this.display.style.transform = `scale(${aspectRation > 1 ? widthFactor : heightFactor})`;
    }

    printerOffline() {
        this.isPrinterOffline = true;
    }

    printerOnline() {
        this.isPrinterOffline = false;
    }

    printerError(errors: string[]) {
        this.printerErrors = errors;
        setTimeout(() => {
            this.printerErrors = null;
        }, 3000);
    }

    private updateStatus() {
        if (this._isFirstUpdate) {
            this._isFirstUpdate = false;
            this.pageHome.updateStatus();
            this.pageSettings.updateStatus();
            this.pageJob.updateStatus();
            this.screenEditAxis.updateStatus();
            this.screenEditTool.updateStatus();            
            this.screenMoveTool.updateStatus();
            this.screenEditBed.updateStatus();
            this.screenEditBedMesh.updateStatus();
            if (this.printer.view.printerStatus == PrinterStatusEnum.processing) this.showJobPage();
        }
        else {
            if (this.screenModel.isHidden || this.pageIndex == 2) {
                switch (this.pageIndex) {
                    case 0: this.pageSettings.updateStatus(); break;
                    case 1: this.pageHome.updateStatus(); break;
                    case 2: this.pageJob.updateStatus(); break;
                }
                if (!this.screenEditTool.isHidden) this.screenEditTool.updateStatus();
                if (!this.screenEditAxis.isHidden) this.screenEditAxis.updateStatus();
                if (!this.screenMoveTool.isHidden) this.screenMoveTool.updateStatus();
                if (!this.screenEditBed.isHidden) this.screenEditBed.updateStatus();
                if (!this.screenEditBedMesh.isHidden) this.screenEditBedMesh.updateStatus();
            }
        }
    }

    updateUI() {
        if (this.printer.view.printerStatus == PrinterStatusEnum.halted) {
            // The printer is in emergency stop status
            this.isPrinterOffline = true;
        }

        var showScreenEditAxis =
            (this.pageHome.xSelected || this.pageHome.ySelected || this.pageHome.zSelected)
            && !this.pageHome.bedSelected
            && !this.pageHome.toolSelected;

        var showScreenEditBed =
            this.pageHome.bedSelected
            && !this.pageHome.toolSelected
            && !showScreenEditAxis;

        var showScreenEditTool =
            this.pageHome.toolSelected
            && !this.pageHome.bedSelected
            && !showScreenEditAxis;

        this.screenEditAxis.isHidden = !showScreenEditAxis;
        this.screenEditBed.isHidden = !showScreenEditBed;
        this.screenEditTool.isHidden = !showScreenEditTool;
    }

    setPage(pageIndex: number) {
        this.pageIndex = pageIndex;

        // If not Home page
        if (pageIndex != 1) {

            this.screenEditAxis.isHidden = true;
            this.screenEditBed.isHidden = true;
            this.screenEditTool.isHidden = true;

            this.pageHome.xSelected = false;
            this.pageHome.ySelected = false;
            this.pageHome.zSelected = false;
            this.pageHome.bedSelected = false;
            this.pageHome.toolSelected = false;
        }
        // If not Job page
        if (pageIndex != 2) {
            this.pageJob.editingZBabystepping = false;
            this.screenEditZBabystepping.isHidden = true;
        }
    }

    // ref https://github.com/WICG/EventListenerOptions/pull/30
    isPassive() {
        var supportsPassiveOption = false;
        try {
            addEventListener("test", null, Object.defineProperty({}, 'passive', {
                get: function () {
                    supportsPassiveOption = true;
                }
            }));
        } catch (e) { }
        return supportsPassiveOption;
    }


    private pageScroller = null;
    private pageScrollerLastX = -720;

    setPageScrolling(isScrollingEnabled: boolean) {
        if (isScrollingEnabled) {
            if (this.pageScroller == undefined) {

                this.pageScroller = new IScroll('#pagesWrapper', {
                    startX: this.pageScrollerLastX,
                    scrollX: true,
                    scrollY: false,
                    momentum: true,
                    snap: true,
                    snapSpeed: 800,
                    keyBindings: false
                });

                var _self = this;

                this.pageScroller.on('scrollEnd', function () {
                    _self.pageScrollerLastX = this.x;
                    _self.setPage(_self.pageScrollerLastX / -720);
                });
            }
        }
        else {
            this.pageScroller.destroy();
            this.pageScroller = null;
        }
    }

    public showJobPage() {
        if (this.pageScroller != null) {
            this.pageScroller.scrollTo(-1440, 0);
            this.setPage(2);
        }
    }

    public editValue(title: string, initialValue: number, acceptCallback: (value: number) => void) {
        this.screenNumericKeypad.title = title;
        this.screenNumericKeypad.value = initialValue;
        this.screenNumericKeypad.onAccept = acceptCallback;
        this.screenNumericKeypad.isHidden = false;
    }

}
