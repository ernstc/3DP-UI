import { autoinject } from 'aurelia-framework';
import { HttpClient, RequestInit, json } from 'aurelia-fetch-client';



export interface IBusy {
    on(): void;
    off(): void;
}


class BusyDummy implements IBusy {
    on(): void { }
    off(): void { }
}


class Busy {

    static component: IBusy;

    static on(): void {
        if (Busy.component != undefined) Busy.component.on();
    }
    static off(): void {
        if (Busy.component != undefined) Busy.component.off();
    }
}


abstract class WebClientBase {

    private webApiBaseUrl: string;
    private http: HttpClient;


    constructor(
        private useBusy: boolean
    ) { }


    public setBaseAddress(address: string) {
        this.webApiBaseUrl = address;
    }


    protected abstract initRequestWithToken(defaults: RequestInit): void;




    applyMixins(derivedCtor: any, baseCtors: any[]) {
        baseCtors.forEach(baseCtor => {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            })
        });
    }



    private initHttpClient(defaultHeaders?: object) {
        let headers = {
            //'Accept': 'application/json, text/javascript, */*; q=0.01'
       };
        if (defaultHeaders != undefined) {
            for (const key in defaultHeaders) {
                if (defaultHeaders.hasOwnProperty(key)) {
                    headers[key] = defaultHeaders[key];                    
                }
            }
        }

        let defaults: RequestInit = {
            credentials: 'same-origin',
            //mode: 'no-cors',
            headers: headers
        };

        this.initRequestWithToken(defaults);

        this.http = new HttpClient();

        this.http.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(this.webApiBaseUrl)
                .withDefaults(defaults);
        });
    }


    private call(
        url: string,
        method: string,
        body?: any,
        contentType?: string,
        headers?: object
    ): Promise<any> {

        this.initHttpClient({
            'Accept': '*/*',
            ...headers,
        });

        let requestInit: RequestInit = {
            method: method
        };

        if (contentType == undefined) contentType = 'application/json';

        if (method == "POST" || method == "PUT") {
            if (body != undefined) {
                if (contentType == 'application/json')
                    requestInit.body = json(body);
                else
                    requestInit.body = body;
            }
        }

        if (this.useBusy) Busy.on();

        return this.http.fetch(url, requestInit)
            .then(response => {
                if (this.useBusy) Busy.off();
                var contentLength = response.headers.get('Content-Length');
                if (contentLength != undefined && contentLength != '0') {
                    var contentType = response.headers.get('Content-Type');
                    if (contentType == 'application/json') {
                        let json = response.json();
                        return json;
                    }
                    else {
                        return response.text();
                    }
                }
                else {
                    return Promise.resolve(null);
                }
            })
            .catch((err) => {
                if (this.useBusy) Busy.off();
                throw err;
            });
    }

    public delete(url: string, headers?: object): Promise<any> {
        return this.call(url, "DELETE", null, null, headers);
    }

    public get(url: string, headers?: object): Promise<any> {
        return this.call(url, "GET", null, null, headers);
    }

    public post(
        url: string,
        body: any,
        contentType: string = 'application/json',
        headers?: object
    ): Promise<any> {
        return this.call(url, "POST", body, contentType, headers);
    }

    public put(
        url: string,
        body: any,
        contentType: string = 'application/json',
        headers?: object
    ): Promise<any> {
        return this.call(url, "PUT", body, contentType, headers);
    }
}



class AuthorizedWebClientBase extends WebClientBase {
    protected initRequestWithToken(defaults: RequestInit) {
        let token = sessionStorage.getItem("access_token");
        if (token) {
            defaults.headers = {
                'Authorization': 'Bearer ' + token
            }
        }
    }
}


class WebClientBackground extends AuthorizedWebClientBase {
    constructor() {
        super(
            false
        );
    }
}


@autoinject
export class WebClient extends AuthorizedWebClientBase {

    public background: WebClientBackground;
    public static UNAUTHORIZED = 401;

    constructor() {
        super(
            true
        );

        this.background = new WebClientBackground();
    }

}


export const WebClientBusy = Busy;

