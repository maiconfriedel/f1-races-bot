import TelegramBot from "node-telegram-bot-api";
import { describe, expect, it, vi } from "vitest";
import {
  registerSubscriptionCommands,
  subscriptionMessages,
} from "../subscription.js";

function extractHandler(onText: ReturnType<typeof vi.fn>, source: string) {
  const call = onText.mock.calls.find(
    (item) => item[0] instanceof RegExp && item[0].source === source,
  );
  return call?.[1] as ((msg: { chat: { id: number } }) => Promise<void>) | undefined;
}

describe("registerSubscriptionCommands", () => {
  it("subscribes a chat and confirms success", async () => {
    const repository = {
      subscribe: vi.fn().mockResolvedValue(true),
      unsubscribe: vi.fn(),
      isSubscribed: vi.fn(),
      listSubscribedChatIds: vi.fn(),
      tryCreateDispatch: vi.fn(),
    };
    const sendMessage = vi.fn().mockResolvedValue({});
    const onText = vi.fn();
    const bot = { sendMessage, onText } as unknown as TelegramBot;

    registerSubscriptionCommands(bot, repository);

    const handler = extractHandler(onText, "\\/subscribe");
    expect(handler).toBeDefined();

    await handler!({ chat: { id: 101 } });

    expect(repository.subscribe).toHaveBeenCalledWith(101);
    expect(sendMessage).toHaveBeenCalledWith(
      101,
      subscriptionMessages.SUBSCRIBE_SUCCESS,
      { parse_mode: "Markdown" },
    );
  });

  it("unsubscribes a chat and confirms state", async () => {
    const repository = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn().mockResolvedValue(true),
      isSubscribed: vi.fn(),
      listSubscribedChatIds: vi.fn(),
      tryCreateDispatch: vi.fn(),
    };
    const sendMessage = vi.fn().mockResolvedValue({});
    const onText = vi.fn();
    const bot = { sendMessage, onText } as unknown as TelegramBot;

    registerSubscriptionCommands(bot, repository);

    const handler = extractHandler(onText, "\\/unsubscribe");
    expect(handler).toBeDefined();

    await handler!({ chat: { id: 202 } });

    expect(repository.unsubscribe).toHaveBeenCalledWith(202);
    expect(sendMessage).toHaveBeenCalledWith(
      202,
      subscriptionMessages.UNSUBSCRIBE_SUCCESS,
      { parse_mode: "Markdown" },
    );
  });

  it("returns status for active and inactive subscriptions", async () => {
    const repository = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      isSubscribed: vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
      listSubscribedChatIds: vi.fn(),
      tryCreateDispatch: vi.fn(),
    };
    const sendMessage = vi.fn().mockResolvedValue({});
    const onText = vi.fn();
    const bot = { sendMessage, onText } as unknown as TelegramBot;

    registerSubscriptionCommands(bot, repository);

    const handler = extractHandler(onText, "\\/subscriptions");
    expect(handler).toBeDefined();

    await handler!({ chat: { id: 303 } });
    await handler!({ chat: { id: 303 } });

    expect(sendMessage).toHaveBeenNthCalledWith(
      1,
      303,
      subscriptionMessages.STATUS_ACTIVE,
      { parse_mode: "Markdown" },
    );
    expect(sendMessage).toHaveBeenNthCalledWith(
      2,
      303,
      subscriptionMessages.STATUS_INACTIVE,
      { parse_mode: "Markdown" },
    );
  });
});
