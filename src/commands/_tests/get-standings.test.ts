import type TelegramBot from "node-telegram-bot-api";
import { describe, expect, it, vi } from "vitest";
import {
	formatConstructorStandings,
	formatDriverStandings,
	registerStandingsCommand,
} from "../get-standings.js";

describe("formatDriverStandings", () => {
	it("returns unavailability message for empty list", () => {
		expect(formatDriverStandings([])).toBe(
			"Classificação não disponível para a temporada atual.",
		);
	});
});

describe("formatConstructorStandings", () => {
	it("returns unavailability message for empty list", () => {
		expect(formatConstructorStandings([])).toBe(
			"Classificação não disponível para a temporada atual.",
		);
	});
});

describe("registerStandingsCommand", () => {
	it("sends error message when fetch fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("Network error")),
		);

		const sendMessage = vi.fn().mockResolvedValue({});
		const onText = vi.fn();
		const bot = { sendMessage, onText } as unknown as TelegramBot;

		registerStandingsCommand(bot);

		const call = onText.mock.calls[0];
		if (!call) {
			throw new Error("Expected onText callback to be registered");
		}
		const [, callback] = call;
		const msg = { chat: { id: 42 } };
		await callback(msg);

		expect(sendMessage).toHaveBeenCalledWith(
			42,
			"Não foi possível obter a classificação. Tente novamente mais tarde.",
			{ parse_mode: "Markdown" },
		);

		vi.unstubAllGlobals();
	});

	it("sends message with parse_mode Markdown on success", async () => {
		const driverResponse = {
			MRData: {
				StandingsTable: {
					StandingsLists: [
						{
							DriverStandings: [
								{
									position: "1",
									points: "195",
									wins: "6",
									Driver: { givenName: "Max", familyName: "Verstappen" },
									Constructors: [{ name: "Red Bull" }],
								},
							],
						},
					],
				},
			},
		};

		const constructorResponse = {
			MRData: {
				StandingsTable: {
					StandingsLists: [
						{
							ConstructorStandings: [
								{
									position: "1",
									points: "329",
									wins: "5",
									Constructor: { name: "McLaren" },
								},
							],
						},
					],
				},
			},
		};

		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce({ json: async () => driverResponse })
				.mockResolvedValueOnce({ json: async () => constructorResponse }),
		);

		const sendMessage = vi.fn().mockResolvedValue({});
		const onText = vi.fn();
		const bot = { sendMessage, onText } as unknown as TelegramBot;

		registerStandingsCommand(bot);

		const call = onText.mock.calls[0];
		if (!call) {
			throw new Error("Expected onText callback to be registered");
		}
		const [, callback] = call;
		const msg = { chat: { id: 99 } };
		await callback(msg);

		expect(sendMessage).toHaveBeenCalledWith(99, expect.any(String), {
			parse_mode: "Markdown",
		});

		vi.unstubAllGlobals();
	});
});
