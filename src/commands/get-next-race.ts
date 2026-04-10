import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import type TelegramBot from "node-telegram-bot-api";
import type { ErgastResponse, Race } from "../types/eargast.js";
import { LANG_TO_TZ } from "../types/language.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function resolveTimezone(languageCode?: string): string {
  if (!languageCode) return "UTC";
  const tz = LANG_TO_TZ[languageCode.toLowerCase()];
  return tz ?? "UTC";
}

export async function fetchRaces(): Promise<Race[]> {
  const response = await fetch(
    "https://api.jolpi.ca/ergast/f1/current/races.json",
  );
  const data = (await response.json()) as ErgastResponse;
  return data.MRData.RaceTable.Races;
}

export function findNextRace(races: Race[], today: Date): Race | null {
  const todayStr = today.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const future = races.filter((r) => r.date >= todayStr);
  if (future.length === 0) return null;
  return future.reduce((min, r) => (r.date < min.date ? r : min));
}

export function formatRaceMessage(
  race: Race,
  tz = "UTC",
  today = dayjs(),
): string {
  let dateLine: string;

  if (race.time) {
    const dt = dayjs
      .tz(`${race.date}T${race.time.replace("Z", "")}`, "UTC")
      .tz(tz);
    const formattedDate = dt.format("DD/MM/YYYY");
    const formattedTime = dt.format("HH:mm");
    dateLine = `📅 *Data:* ${formattedDate} às ${formattedTime}`;
  } else {
    const [year, month, day] = race.date.split("-");
    dateLine = `📅 *Data:* ${day}/${month}/${year}`;
  }

  const daysUntil = dayjs(race.date)
    .startOf("day")
    .diff(today.startOf("day"), "day");
  const countdownLine =
    daysUntil === 0
      ? `⏳ *Faltam:* hoje!`
      : `⏳ *Faltam:* ${daysUntil} dia${daysUntil > 1 ? "s" : ""}`;

  return [
    `🏎️ *Próxima Corrida*`,
    ``,
    `🏆 *Grande Prêmio:* ${race.raceName}`,
    `🏁 *Circuito:* ${race.Circuit.circuitName}`,
    `📍 *Local:* ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
    dateLine,
    countdownLine,
  ].join("\n");
}

export function registerNextRaceCommand(bot: TelegramBot): void {
  bot.onText(/\/next_race/, async (msg) => {
    const tz = resolveTimezone(msg.from?.language_code);
    try {
      const races = await fetchRaces();
      const race = findNextRace(races, new Date());

      if (!race) {
        await bot.sendMessage(
          msg.chat.id,
          "Não há corridas futuras agendadas para esta temporada.",
          { parse_mode: "Markdown" },
        );
        return;
      }

      const text = formatRaceMessage(race, tz);
      await bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
    } catch {
      await bot.sendMessage(
        msg.chat.id,
        "Não foi possível obter os dados da próxima corrida. Tente novamente mais tarde.",
        { parse_mode: "Markdown" },
      );
    }
  });
}
