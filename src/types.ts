export type JsonValue = boolean | number | string | null | undefined | JsonValue[] | { [key: string]: JsonValue };

export interface SmogtokSettings {
	[key: string]: JsonValue;
	probeId: string;
}

export type DisplayMode = "aqi" | "details";

export interface ProbeReg {
	REGNAME: string;
	VALUE: number | null;
	IJP: number;
}

export interface Probe {
	ID: number;
	NAME: string;
	IJP: number;
	REGS: ProbeReg[];
	DT: string;
}

export interface SmogtokData {
	temp: number | null;
	hum: number | null;
	pres: number | null;
	ijp: number;
	name: string;
}
