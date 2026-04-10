import TelegramBot from "node-telegram-bot-api";
import { registerNextRaceCommand } from "./commands/get-next-race.js";
import { registerStandingsCommand } from "./commands/get-standings.js";
import { registerSubscriptionCommands } from "./commands/subscription.js";
import { env } from "./env.js";
import { startAlertsScheduler } from "./notifications/scheduler.js";

const bot = new TelegramBot(env.TELEGRAM_API_TOKEN, {
  polling: true,
});

registerNextRaceCommand(bot);
registerStandingsCommand(bot);
registerSubscriptionCommands(bot);
startAlertsScheduler(bot);

if (bot.isPolling()) console.log("🚀 Bot is running!!");
