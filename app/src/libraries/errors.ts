

export class HeightmapError extends Error {}


export class InvalidHeightmapError extends HeightmapError {
	constructor() {
		super('Invalid Height Map');
	}
}
