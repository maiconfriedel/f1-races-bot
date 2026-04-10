import { AlertWindow, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export type AlertDispatchWindow = "MONDAY_PRIOR";

function normalizeChatId(chatId: number | string): string {
  return String(chatId);
}

export interface SubscriptionsRepository {
  subscribe(chatId: number | string): Promise<boolean>;
  unsubscribe(chatId: number | string): Promise<boolean>;
  isSubscribed(chatId: number | string): Promise<boolean>;
  listSubscribedChatIds(): Promise<string[]>;
  tryCreateDispatch(
    chatId: number | string,
    raceKey: string,
    window: AlertDispatchWindow,
  ): Promise<boolean>;
}

export const prismaSubscriptionsRepository: SubscriptionsRepository = {
  async subscribe(chatId) {
    const normalizedChatId = normalizeChatId(chatId);
    await prisma.subscription.upsert({
      where: { chatId: normalizedChatId },
      update: {},
      create: { chatId: normalizedChatId },
    });
    return true;
  },

  async unsubscribe(chatId) {
    const normalizedChatId = normalizeChatId(chatId);
    const result = await prisma.subscription.deleteMany({
      where: { chatId: normalizedChatId },
    });
    return result.count > 0;
  },

  async isSubscribed(chatId) {
    const normalizedChatId = normalizeChatId(chatId);
    const item = await prisma.subscription.findUnique({
      where: { chatId: normalizedChatId },
      select: { id: true },
    });
    return item !== null;
  },

  async listSubscribedChatIds() {
    const rows = await prisma.subscription.findMany({
      select: { chatId: true },
    });
    return rows.map((row) => row.chatId);
  },

  async tryCreateDispatch(chatId, raceKey, window) {
    const normalizedChatId = normalizeChatId(chatId);
    try {
      await prisma.notificationDispatch.create({
        data: {
          chatId: normalizedChatId,
          raceKey,
          window: AlertWindow[window],
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return false;
      }
      throw error;
    }
  },
};
