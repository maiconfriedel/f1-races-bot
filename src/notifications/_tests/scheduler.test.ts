import type TelegramBot from "node-telegram-bot-api";
import { describe, expect, it, vi } from "vitest";
import { runMondayPriorAlerts } from "../scheduler.js";

const race = {
  raceName: "Test GP",
  Circuit: {
    circuitName: "Test Circuit",
    Location: {
      locality: "City",
      country: "Country",
    },
  },
  date: "2026-04-12",
  time: "14:00:00Z",
};

describe("runMondayPriorAlerts", () => {
  it("sends alert on the previous Monday for a Sunday race", async () => {
    const repository = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      isSubscribed: vi.fn(),
      listSubscribedChatIds: vi.fn().mockResolvedValue(["11", "22"]),
      tryCreateDispatch: vi.fn().mockResolvedValue(true),
    };

    const sendMessage = vi.fn().mockResolvedValue({});
    const bot = { sendMessage } as unknown as TelegramBot;

    await runMondayPriorAlerts(bot, repository, {
      fetchRacesFn: vi.fn().mockResolvedValue([race]),
      findNextRaceFn: vi.fn().mockReturnValue(race),
      nowFn: () => new Date("2026-04-06T09:00:00.000Z"),
    });

    expect(repository.tryCreateDispatch).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenNthCalledWith(
      1,
      "11",
      expect.stringContaining("semana da corrida"),
      { parse_mode: "Markdown" },
    );
  });

  it("does not send alerts outside of the Monday alert day", async () => {
    const repository = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      isSubscribed: vi.fn(),
      listSubscribedChatIds: vi.fn().mockResolvedValue(["33"]),
      tryCreateDispatch: vi.fn().mockResolvedValue(true),
    };

    const sendMessage = vi.fn().mockResolvedValue({});
    const bot = { sendMessage } as unknown as TelegramBot;

    await runMondayPriorAlerts(bot, repository, {
      fetchRacesFn: vi.fn().mockResolvedValue([race]),
      findNextRaceFn: vi.fn().mockReturnValue(race),
      nowFn: () => new Date("2026-04-07T09:00:00.000Z"),
    });

    expect(repository.listSubscribedChatIds).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("uses Monday from the previous week when race happens on Monday", async () => {
    const repository = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      isSubscribed: vi.fn(),
      listSubscribedChatIds: vi.fn().mockResolvedValue(["88"]),
      tryCreateDispatch: vi.fn().mockResolvedValue(true),
    };

    const sendMessage = vi.fn().mockResolvedValue({});
    const bot = { sendMessage } as unknown as TelegramBot;

    await runMondayPriorAlerts(bot, repository, {
      fetchRacesFn: vi.fn().mockResolvedValue([race]),
      findNextRaceFn: vi
        .fn()
        .mockReturnValue({ ...race, date: "2026-04-13", raceName: "Monday GP" }),
      nowFn: () => new Date("2026-04-06T09:00:00.000Z"),
    });

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it("continues sending even if one chat fails", async () => {
    const repository = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      isSubscribed: vi.fn(),
      listSubscribedChatIds: vi.fn().mockResolvedValue(["44", "55"]),
      tryCreateDispatch: vi.fn().mockResolvedValue(true),
    };

    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error("blocked"))
      .mockResolvedValueOnce({});
    const bot = { sendMessage } as unknown as TelegramBot;

    await runMondayPriorAlerts(bot, repository, {
      fetchRacesFn: vi.fn().mockResolvedValue([race]),
      findNextRaceFn: vi.fn().mockReturnValue(race),
      nowFn: () => new Date("2026-04-06T09:00:00.000Z"),
    });

    expect(sendMessage).toHaveBeenCalledTimes(2);
  });
});
