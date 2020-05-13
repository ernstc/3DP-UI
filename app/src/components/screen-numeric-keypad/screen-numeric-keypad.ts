import { autoinject } from 'aurelia-framework';



@autoinject
export class ScreenNumericKeypad {

    isHidden: boolean = true;

    title: string = '';
    onAccept: (value: number) => void


    private _value: number = 0;

    get value() {
        return this._value;
    }

    set value(v: number) {
        this._value = v;
        this.display = v != undefined ? v.toString() : '0';
    }

    private display: string;
    private accumulator: number = 0;
    private operator: string = null;
    private startNewNumber: boolean = true;


    constructor() {
    }

    private reset() {
        this.title = '';
        this.value = 0;
        this.startNewNumber = true;
    }

    clickedCancel() {
        this.isHidden = true;
        this.reset();
    }

    clickedAccept() {
        if (this.onAccept != undefined) {
            var v = parseFloat(this.display);
            this.onAccept(v);
            this.onAccept = undefined;
            this.isHidden = true;
            this.reset();
        }
    }

    _ce_clicked() {
        this.value = 0;
        this.operator = null;
    }

    _c_clicked() {
        this.display = '0';
    }

    _back_clicked() {
        if (this.startNewNumber) {
            this.display = '0';
        }
        else {
            var s = this.display;
            s = s.substr(0, s.length - 1);
            if (s.length == 0 || s == '-') s = '0';
            this.display = s;
        }
    }

    _digit_clicked(digit: string) {
        if (this.startNewNumber) {
            this.display = digit;
            this.startNewNumber = false;
        }
        else {
            if (this.display == '0')
                this.display = digit;
            else
                this.display += digit;
        }
    }

    _sign_clicked() {
        if (this.display != '0') {
            if (this.display.startsWith('-'))
                this.display = this.display.substr(1);
            else
                this.display = '-' + this.display;
        }
    }

    _decimal_clicked() {
        if (this.startNewNumber) {
            this.display = '0.';
            this.startNewNumber = false;
        }
        else {
            if (this.display.indexOf('.') < 0) this.display += '.';
        }
    }

    _operator_clicked(operator: string) {
        var num = parseFloat(this.display);
        if (this.operator == null) {
            this.accumulator = num;
        }
        else {
            switch (this.operator) {
                case '/': this.accumulator = this.accumulator / num; break;
                case '*': this.accumulator = this.accumulator * num; break;
                case '+': this.accumulator = this.accumulator + num; break;
                case '-': this.accumulator = this.accumulator - num; break;
            }
            this.display = this.accumulator.toString();
        }
        this.startNewNumber = true;
        this.operator = operator;
    }

    _equal_clicked() {
        if (this.operator != null) {
            var num = parseFloat(this.display);
            switch (this.operator) {
                case '/': this.accumulator = this.accumulator / num; break;
                case '*': this.accumulator = this.accumulator * num; break;
                case '+': this.accumulator = this.accumulator + num; break;
                case '-': this.accumulator = this.accumulator - num; break;
            }
            this.operator = null;
            this.display = this.accumulator.toString();
            this.startNewNumber = true;
        }
    }

}
