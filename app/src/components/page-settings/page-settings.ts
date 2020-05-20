import { autoinject } from 'aurelia-framework';
import { IPrinter } from '../../printer';
import { IScreen } from 'IScreen';
import { App } from 'app';


@autoinject
export class PageSettings implements IScreen {

    vin: string;
    v12: string;
    mcuTemp: string;
    mcuFan: string = '0';
    zHeight: number;

    infoPrinterName: string;
    infoElectronics: string;
    infoFirmware: string;
    infoFirmwareVersion: string;
    infoWiFiVersion: string;
    infoDsfVersion: string;

    private infoUIVersion: string = '1.0.0';
    private language: string = 'English';
    private year: number = new Date().getFullYear();

    constructor(
        private app: App,
        private printer: IPrinter
    ) 
    { }

    public updateStatus() {
        this.vin = this.printer.view.vIn.toFixed(1);
        this.v12 = this.printer.view.v12.toFixed(1);
        this.mcuTemp = this.printer.view.mcuTemp.toFixed(1);
        this.mcuFan = this.printer.view.mcuFanPercent.toFixed(0);
        this.zHeight = this.printer.view.probeHeight;
        this.infoElectronics = this.printer.view.firmwareElectronics;
        this.infoFirmware = this.printer.view.firmwareName;
        this.infoFirmwareVersion = this.printer.view.firmwareVersion + 
            ' (' + this.printer.view.firmwareDate + ')';
        this.infoPrinterName = this.printer.view.printerName;
        this.infoWiFiVersion = this.printer.view.dwsVersion;
        this.infoDsfVersion = this.printer.view.dsfVersion;
    }

    clickedEmergencyStop() {
        this.printer.emergencyStop();
    }

    clickedZHeight() {
        this.app.editValue('Z probe height', this.printer.view.probeHeight, (value: number) => this.updateZHeight(value));
    }

    async updateZHeight(zHeight: number) {
        if (zHeight < 0) zHeight = 0;
        else if (zHeight > 5) zHeight = 5;
        await this.printer.setZHeight(zHeight, true);
    }

}
