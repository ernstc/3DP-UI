export class GCodeModel {

    private gcode: string;
    public positions: number[];
    public indices: number[];

    public extruderDiameter: number = 0.4;
    public layerHeight: number = 0.2;


    public dispose() {
        this.gcode = null;
        this.positions = undefined;
        this.indices = undefined;
    }


    public load(gcode: string) {
        this.gcode = gcode;
        this._processGCode();
    }


    public async loadFile(file: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", file);
            xhr.onload = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status == 0) {
                        this.gcode = xhr.responseText;
                        this._processGCode();
                        resolve();
                        return;
                    }
                }
                reject(xhr.statusText);
            };
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });
    }


    private _processGCode() {
        const code = this.gcode;
        if (code == undefined) return;

        const commandParser = /^\s*[Gg]1(\s+[Xx](?<x>-?\d+(\.\d+)?))?(\s+[Yy](?<y>-?\d+(\.\d+)?))?(\s+[Zz](?<z>-?\d+(\.\d+)?))?(\s+[Ee](?<e>-?\d+(\.\d+)?))?/;

        const lines = code.split("\n");
        let prevCommand = null;
        let x = 0, y = 0, z = 0, e = 0;

        const positions = [];
        const indices = [];
        let vertexIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line[0] == ';') {
                if (line.indexOf('extruderDiameter') > 0) {
                    this.extruderDiameter = parseFloat(line.substr(line.indexOf(',') + 1));
                }
                else if (line.indexOf('layerHeight') > 0) {
                    this.layerHeight = parseFloat(line.substr(line.indexOf(',') + 1));
                }
                continue;
            }
            /*if (/^\s*;/.test(line)) {
                // the line starts with comment
                continue;
            }*/

            let command = commandParser.exec(line);
            if (command == undefined) {
                continue;
            }

            let isCommandXYZ =
                command.groups.x != undefined
                || command.groups.y != undefined
                || command.groups.z != undefined;

            if (command.groups.x != undefined) x = parseFloat(command.groups.x);
            if (command.groups.y != undefined) y = parseFloat(command.groups.y);
            if (command.groups.z != undefined) z = parseFloat(command.groups.z);
            if (command.groups.e != undefined) e = parseFloat(command.groups.e);

            if (isCommandXYZ && command.groups.e != undefined) {
                positions.push(x, y, z);

                if (vertexIndex > 0) {
                    indices.push(vertexIndex - 1);
                    indices.push(vertexIndex);
                }
                vertexIndex++;
            }
        }
        this.positions = positions;
        this.indices = indices;
    }

}
