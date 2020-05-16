import { Aurelia } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import * as environment from '../config/environment.json';
import { PLATFORM } from 'aurelia-pal';
import 'libraries/promise-timeout.js';
import 'libraries/Chart.plugins.horizonalLinePlugin';
import { WebClient } from './webClient';
import { IPrinter } from './printer';
import { PrinterRRF3 } from './printer/rrf3/PrinterRRF3';


export function configure(aurelia: Aurelia) {
    aurelia.use
        .standardConfiguration()
        .feature(PLATFORM.moduleName('resources/index'));

    aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

    aurelia.container.registerSingleton<IPrinter, PrinterRRF3, [WebClient, EventAggregator]>(IPrinter, PrinterRRF3);

    if (environment.testing) {
        aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
    }

    aurelia.start().then(() => aurelia.setRoot(PLATFORM.moduleName('app')));
}
