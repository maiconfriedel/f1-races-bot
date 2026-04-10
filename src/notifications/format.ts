import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";
import type { Race } from "../types/eargast.js";

dayjs.extend(utc);

export function formatMondayPriorAlertMessage(race: Race): string {
  const dateText = race.time
    ? dayjs.utc(`${race.date}T${race.time}`).format("DD/MM/YYYY [às] HH:mm [UTC]")
    : dayjs.utc(race.date).format("DD/MM/YYYY");

  return [
    "📣 *Aviso da semana da corrida*",
    "",
    `🏆 *Grande Prêmio:* ${race.raceName}`,
    `🏁 *Circuito:* ${race.Circuit.circuitName}`,
    `📍 *Local:* ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
    `📅 *Data:* ${dateText}`,
  ].join("\n");
}

export function buildRaceKey(race: Race): string {
  return `${race.date}::${race.raceName}`;
}

export function getPreviousMondayUtc(race: Race): Dayjs {
  const raceDay = dayjs.utc(race.date).startOf("day");
  const daysSinceMonday = (raceDay.day() + 6) % 7;
  const mondayOfRaceWeek = raceDay.subtract(daysSinceMonday, "day");
  if (raceDay.day() === 1) {
    return mondayOfRaceWeek.subtract(7, "day");
  }
  return mondayOfRaceWeek;
}

export function isMondayBeforeRaceUtc(race: Race, now = new Date()): boolean {
  const todayUtc = dayjs.utc(now).startOf("day");
  const alertDayUtc = getPreviousMondayUtc(race);
  return todayUtc.isSame(alertDayUtc);
}
