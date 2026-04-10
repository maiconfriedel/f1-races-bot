import type TelegramBot from "node-telegram-bot-api";
import {
  prismaSubscriptionsRepository,
  type SubscriptionsRepository,
} from "../subscriptions/repository.js";

const SUBSCRIBE_SUCCESS =
  "✅ Alertas ativados para este chat. Você receberá um aviso na segunda-feira anterior a cada corrida.";
const UNSUBSCRIBE_SUCCESS = "🔕 Alertas desativados para este chat.";
const UNSUBSCRIBE_NOT_FOUND = "Este chat não estava inscrito em alertas.";
const STATUS_ACTIVE =
  "✅ Este chat está inscrito e receberá alerta na segunda-feira anterior a cada corrida.";
const STATUS_INACTIVE =
  "ℹ️ Este chat não está inscrito. Use /subscribe para ativar os alertas.";
const SUBSCRIPTION_ERROR =
  "Não foi possível atualizar as inscrições agora. Tente novamente mais tarde.";

export function registerSubscriptionCommands(
  bot: TelegramBot,
  repository: SubscriptionsRepository = prismaSubscriptionsRepository,
): void {
  bot.onText(/\/subscribe/, async (msg) => {
    try {
      await repository.subscribe(msg.chat.id);
      await bot.sendMessage(msg.chat.id, SUBSCRIBE_SUCCESS, {
        parse_mode: "Markdown",
      });
    } catch {
      await bot.sendMessage(msg.chat.id, SUBSCRIPTION_ERROR, {
        parse_mode: "Markdown",
      });
    }
  });

  bot.onText(/\/unsubscribe/, async (msg) => {
    try {
      const removed = await repository.unsubscribe(msg.chat.id);
      await bot.sendMessage(
        msg.chat.id,
        removed ? UNSUBSCRIBE_SUCCESS : UNSUBSCRIBE_NOT_FOUND,
        { parse_mode: "Markdown" },
      );
    } catch {
      await bot.sendMessage(msg.chat.id, SUBSCRIPTION_ERROR, {
        parse_mode: "Markdown",
      });
    }
  });

  bot.onText(/\/subscriptions/, async (msg) => {
    try {
      const subscribed = await repository.isSubscribed(msg.chat.id);
      await bot.sendMessage(msg.chat.id, subscribed ? STATUS_ACTIVE : STATUS_INACTIVE, {
        parse_mode: "Markdown",
      });
    } catch {
      await bot.sendMessage(msg.chat.id, SUBSCRIPTION_ERROR, {
        parse_mode: "Markdown",
      });
    }
  });
}

export const subscriptionMessages = {
  SUBSCRIBE_SUCCESS,
  UNSUBSCRIBE_SUCCESS,
  UNSUBSCRIBE_NOT_FOUND,
  STATUS_ACTIVE,
  STATUS_INACTIVE,
  SUBSCRIPTION_ERROR,
};
