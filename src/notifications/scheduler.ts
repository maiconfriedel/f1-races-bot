import cron from "node-cron";
import type TelegramBot from "node-telegram-bot-api";
import { env } from "../env.js";
import { fetchRaces, findNextRace } from "../commands/get-next-race.js";
import {
  prismaSubscriptionsRepository,
  type SubscriptionsRepository,
} from "../subscriptions/repository.js";
import type { Race } from "../types/eargast.js";
import {
  buildRaceKey,
  formatMondayPriorAlertMessage,
  isMondayBeforeRaceUtc,
} from "./format.js";

const ALERT_WINDOW = "MONDAY_PRIOR" as const;

interface AlertsDeps {
  fetchRacesFn: () => Promise<Race[]>;
  findNextRaceFn: (races: Race[], today: Date) => Race | null;
  nowFn: () => Date;
}

const defaultDeps: AlertsDeps = {
  fetchRacesFn: fetchRaces,
  findNextRaceFn: findNextRace,
  nowFn: () => new Date(),
};

export async function runMondayPriorAlerts(
  bot: TelegramBot,
  repository: SubscriptionsRepository = prismaSubscriptionsRepository,
  deps: AlertsDeps = defaultDeps,
): Promise<void> {
  try {
    const now = deps.nowFn();
    console.info("[alerts] Scheduler tick started", {
      nowUtc: now.toISOString(),
      window: ALERT_WINDOW,
    });

    const races = await deps.fetchRacesFn();
    console.info("[alerts] Races fetched", { count: races.length });

    const nextRace = deps.findNextRaceFn(races, now);

    if (!nextRace) {
      console.info("[alerts] No upcoming race found");
      return;
    }

    if (!isMondayBeforeRaceUtc(nextRace, now)) {
      console.info("[alerts] Not alert day for next race", {
        raceName: nextRace.raceName,
        raceDate: nextRace.date,
      });
      return;
    }

    const raceKey = buildRaceKey(nextRace);
    const text = formatMondayPriorAlertMessage(nextRace);
    const chatIds = await repository.listSubscribedChatIds();
    console.info("[alerts] Alert day matched, processing subscribers", {
      raceKey,
      subscribers: chatIds.length,
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const chatId of chatIds) {
      try {
        const shouldSend = await repository.tryCreateDispatch(
          chatId,
          raceKey,
          ALERT_WINDOW,
        );
        if (!shouldSend) {
          skipped += 1;
          continue;
        }
        await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error("Failed to send Monday-prior alert", { chatId, error });
      }
    }

    console.info("[alerts] Scheduler tick finished", {
      raceKey,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("Failed to run daily alerts scheduler", error);
  }
}

export function startAlertsScheduler(
  bot: TelegramBot,
  repository: SubscriptionsRepository = prismaSubscriptionsRepository,
): cron.ScheduledTask {
  console.info("[alerts] Starting scheduler", {
    cron: env.ALERTS_CRON,
    timezone: "UTC",
  });

  const task = cron.schedule(
    env.ALERTS_CRON,
    async () => {
      await runMondayPriorAlerts(bot, repository);
    },
    {
      timezone: "UTC",
    },
  );

  return task;
}
