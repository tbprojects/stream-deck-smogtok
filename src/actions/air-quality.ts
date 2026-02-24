import streamDeck, {
	action,
	type DidReceiveSettingsEvent,
	KeyAction,
	type KeyDownEvent,
	type KeyUpEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
	SingletonAction,
} from "@elgato/streamdeck";
import { SvgBuilder } from "../canvas";
import type { DisplayMode, Probe, SmogtokData, SmogtokSettings } from "../types";

const CHECK_INTERVAL_MS = 60_000;
const LONG_PRESS_MS = 500;
const SIZE = 144;
const API_URL = "https://smogtok.com/apprest/pmprobes";

const IJP_COLORS: Record<number, string> = {
	0: "#dadada",
	1: "#1e60ab",
	2: "#7fd03d",
	3: "#ffd202",
	4: "#fe9601",
	5: "#fe0000",
	6: "#8510c0",
};

interface ActionState {
	intervalId: ReturnType<typeof setInterval> | undefined;
	lastData: SmogtokData | undefined;
	displayMode: DisplayMode;
	settings: SmogtokSettings;
	keyDownAt: number | undefined;
}

function defaultState(): ActionState {
	return {
		intervalId: undefined,
		lastData: undefined,
		displayMode: "aqi",
		settings: { probeId: "" },
		keyDownAt: undefined,
	};
}

@action({ UUID: "com.tbprojects.smogtok.air-quality" })
export class AirQualityAction extends SingletonAction<SmogtokSettings> {
	private readonly states = new Map<string, ActionState>();

	override async onWillAppear(ev: WillAppearEvent<SmogtokSettings>): Promise<void> {
		const state = defaultState();
		state.settings = ev.payload.settings;
		this.states.set(ev.action.id, state);
		await this.startPolling(ev.action.id, state);
	}

	override onWillDisappear(ev: WillDisappearEvent<SmogtokSettings>): void {
		const state = this.states.get(ev.action.id);
		if (state) {
			this.stopPolling(state);
			this.states.delete(ev.action.id);
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<SmogtokSettings>): Promise<void> {
		const state = this.states.get(ev.action.id) ?? defaultState();
		state.settings = ev.payload.settings;
		this.states.set(ev.action.id, state);
		await this.fetchAndRender(ev.action.id, state);
	}

	override onKeyDown(ev: KeyDownEvent<SmogtokSettings>): void {
		const state = this.states.get(ev.action.id);
		if (!state) return;
		state.keyDownAt = Date.now();
	}

	override async onKeyUp(ev: KeyUpEvent<SmogtokSettings>): Promise<void> {
		const state = this.states.get(ev.action.id);
		if (!state) return;

		const held = state.keyDownAt !== undefined ? Date.now() - state.keyDownAt : 0;
		state.keyDownAt = undefined;

		const { probeId } = state.settings;
		if (held >= LONG_PRESS_MS) {
			const url = probeId
				? `https://smogtok.com/onedevice?probeId=${probeId}`
				: "https://smogtok.com/";
			await streamDeck.system.openUrl(url);
			return;
		}

		state.displayMode = state.displayMode === "aqi" ? "details" : "aqi";
		await this.render(ev.action, state);
	}

	private async startPolling(actionId: string, state: ActionState): Promise<void> {
		this.stopPolling(state);
		await this.fetchAndRender(actionId, state);
		state.intervalId = setInterval(() => this.fetchAndRender(actionId, state), CHECK_INTERVAL_MS);
	}

	private stopPolling(state: ActionState): void {
		if (state.intervalId !== undefined) {
			clearInterval(state.intervalId);
			state.intervalId = undefined;
		}
	}

	private async fetchAndRender(actionId: string, state: ActionState): Promise<void> {
		const found = streamDeck.actions.getActionById(actionId);
		if (!isKeyAction(found)) return;
		const sdAction = found as KeyAction<SmogtokSettings>;

		const { probeId } = state.settings;
		if (!probeId) {
			await setActionImage(sdAction, errorImage("cfg"));
			return;
		}

		try {
			const response = await fetch(API_URL);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			const probes = (await response.json()) as Probe[];
			const probe = probes.find((p) => p.ID.toString() === probeId);

			if (!probe) {
				await setActionImage(sdAction, errorImage("404"));
				return;
			}

			state.lastData = parseProbe(probe);
			await this.render(sdAction, state);
		} catch (e) {
			streamDeck.logger.error("Smogtok fetch error:", e);
			await setActionImage(sdAction, errorImage("err"));
		}
	}

	private async render(sdAction: KeyAction<SmogtokSettings>, state: ActionState): Promise<void> {
		if (!state.lastData) return;
		const image = state.displayMode === "aqi"
			? renderAqiImage(state.lastData)
			: renderDetailsImage(state.lastData);
		await setActionImage(sdAction, image);
	}
}

function parseProbe(probe: Probe): SmogtokData {
	const reg = (name: string) => probe.REGS.find((r) => r.REGNAME === name)?.VALUE ?? null;
	return {
		temp: reg("Temperatura"),
		hum: reg("Wilgotność"),
		pres: reg("Ciśnienie"),
		ijp: probe.IJP ?? 0,
		name: probe.NAME ?? "",
	};
}

function ijpColor(ijp: number): string {
	return IJP_COLORS[ijp] ?? IJP_COLORS[0];
}

function renderAqiImage(data: SmogtokData): string {
	const color = ijpColor(data.ijp);
	const tempText = data.temp !== null ? `${Math.round(data.temp)}°` : "n/a";

	return new SvgBuilder(SIZE)
		.rect(0, 0, SIZE, SIZE, color)
		.text(tempText, SIZE / 2, SIZE / 2, SIZE * 0.42, "#ffffff", "middle", color, 3)
		.build();
}

function renderDetailsImage(data: SmogtokData): string {
	const lines: Array<{ label: string; value: string }> = [];

	lines.push({
		label: "temp",
		value: data.temp !== null ? `${data.temp.toFixed(1)}°C` : "n/a",
	});
	lines.push({
		label: "hum",
		value: data.hum !== null ? `${data.hum.toFixed(0)}%` : "n/a",
	});
	lines.push({
		label: "pres",
		value: data.pres !== null ? `${Math.round(data.pres)}hPa` : "n/a",
	});

	const color = ijpColor(data.ijp);
	const lineCount = lines.length + 1;
	const lineH = SIZE / lineCount;
	const fontSize = Math.min(SIZE * 0.16, lineH * 0.55);
	const labelX = SIZE * 0.08;
	const valueX = SIZE * 0.95;

	const svg = new SvgBuilder(SIZE)
		.rect(0, 0, SIZE, SIZE, "#1a1a1a")
		.strokeRect(SIZE / 40, SIZE / 40, SIZE - SIZE / 20, SIZE - SIZE / 20, color, SIZE / 20);

	lines.forEach((line, i) => {
		const y = lineH * (i + 1);
		svg
			.text(line.label, labelX, y, fontSize, "#888888", "start")
			.text(line.value, valueX, y, fontSize, "#ffffff", "end");
	});

	return svg.build();
}

function isKeyAction(action: unknown): action is KeyAction<SmogtokSettings> {
	return typeof action === "object" && action !== null && "setImage" in action && "setTitle" in action;
}

async function setActionImage(sdAction: KeyAction<SmogtokSettings>, image: string): Promise<void> {
	await sdAction.setImage(image);
	await sdAction.setTitle("");
}

function errorImage(label: string): string {
	return new SvgBuilder(SIZE)
		.rect(0, 0, SIZE, SIZE, "#000000")
		.text(label, SIZE / 2, SIZE / 2, SIZE * 0.3, "#ffffff")
		.build();
}
