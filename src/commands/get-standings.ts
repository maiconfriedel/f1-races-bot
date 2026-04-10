import type TelegramBot from "node-telegram-bot-api";
import type {
	ErgastConstructorStandingsResponse,
	ErgastDriverStandingsResponse,
} from "../types/eargast.js";

export interface DriverStandingEntry {
	position: number;
	driverName: string; // givenName + familyName
	constructorName: string;
	points: string;
	wins: string;
}

export interface ConstructorStandingEntry {
	position: number;
	constructorName: string;
	points: string;
	wins: string;
}

async function fetchDriverStandings(): Promise<DriverStandingEntry[]> {
	const response = await fetch(
		"https://api.jolpi.ca/ergast/f1/current/driverstandings.json",
	);
	const data = (await response.json()) as ErgastDriverStandingsResponse;
	const lists = data.MRData.StandingsTable.StandingsLists;
	if (!lists || lists.length === 0) return [];
	const currentStandings = lists[0];
	if (!currentStandings) return [];
	return currentStandings.DriverStandings.map((s) => ({
		position: Number(s.position),
		driverName: `${s.Driver.givenName} ${s.Driver.familyName}`,
		constructorName: s.Constructors[0]?.name ?? "",
		points: s.points,
		wins: s.wins,
	}));
}

async function fetchConstructorStandings(): Promise<
	ConstructorStandingEntry[]
> {
	const response = await fetch(
		"https://api.jolpi.ca/ergast/f1/current/constructorstandings.json",
	);
	const data = (await response.json()) as ErgastConstructorStandingsResponse;
	const lists = data.MRData.StandingsTable.StandingsLists;
	if (!lists || lists.length === 0) return [];
	const currentStandings = lists[0];
	if (!currentStandings) return [];
	return currentStandings.ConstructorStandings.map((s) => ({
		position: Number(s.position),
		constructorName: s.Constructor.name,
		points: s.points,
		wins: s.wins,
	}));
}

export function formatDriverStandings(entries: DriverStandingEntry[]): string {
	if (entries.length === 0) {
		return "Classificação não disponível para a temporada atual.";
	}
	const lines = entries.map(
		(e) =>
			`${e.position}. ${e.driverName} (${e.constructorName}) — ${e.points} pts, ${e.wins} vitórias`,
	);
	return [`🏆 *Classificação de Pilotos*`, ``, ...lines].join("\n");
}

export function formatConstructorStandings(
	entries: ConstructorStandingEntry[],
): string {
	if (entries.length === 0) {
		return "Classificação não disponível para a temporada atual.";
	}
	const lines = entries.map(
		(e) =>
			`${e.position}. ${e.constructorName} — ${e.points} pts, ${e.wins} vitórias`,
	);
	return [`🏗️ *Classificação de Construtores*`, ``, ...lines].join("\n");
}

export function registerStandingsCommand(bot: TelegramBot): void {
	bot.onText(/\/standings/, async (msg) => {
		try {
			const [drivers, constructors] = await Promise.all([
				fetchDriverStandings(),
				fetchConstructorStandings(),
			]);

			const text = [
				formatDriverStandings(drivers),
				``,
				formatConstructorStandings(constructors),
			].join("\n");

			await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
		} catch {
			await bot.sendMessage(
				msg.chat.id,
				"Não foi possível obter a classificação. Tente novamente mais tarde.",
				{ parse_mode: "Markdown" },
			);
		}
	});
}
