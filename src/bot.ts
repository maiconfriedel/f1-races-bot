import TelegramBot from "node-telegram-bot-api";
import { registerNextRaceCommand } from "./commands/get-next-race.js";
import { env } from "./env.js";

const bot = new TelegramBot(env.TELEGRAM_API_TOKEN, {
  polling: true,
});

registerNextRaceCommand(bot);

if (bot.isPolling()) console.log("🚀 Bot is running!!");
