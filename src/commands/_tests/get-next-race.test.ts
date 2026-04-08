import TelegramBot from "node-telegram-bot-api";
import { describe, expect, it, vi } from "vitest";
import type { Race } from "../../types/eargast.js";
import {
  findNextRace,
  formatRaceMessage,
  registerNextRaceCommand,
} from "../get-next-race.js";

const makeRace = (date: string, name = "Test GP"): Race => ({
  raceName: name,
  Circuit: {
    circuitName: "Test Circuit",
    Location: { locality: "City", country: "Country" },
  },
  date,
});

describe("findNextRace", () => {
  it("returns null for an empty list", () => {
    expect(findNextRace([], new Date("2025-06-01"))).toBeNull();
  });

  it("returns null when all races are in the past", () => {
    const races = [makeRace("2025-01-01"), makeRace("2025-03-15")];
    expect(findNextRace(races, new Date("2025-06-01"))).toBeNull();
  });

  it("returns the nearest future race when multiple future races exist", () => {
    const races = [
      makeRace("2025-09-01", "Italian GP"),
      makeRace("2025-07-06", "British GP"),
      makeRace("2025-11-09", "Brazilian GP"),
    ];
    const result = findNextRace(races, new Date("2025-06-01"));
    expect(result?.raceName).toBe("British GP");
  });
});

describe("registerNextRaceCommand", () => {
  it("sends generic error message when the API fails (Req 1.4)", async () => {
    // Mock global fetch to reject
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const sendMessage = vi.fn().mockResolvedValue({});
    const onText = vi.fn();
    const bot = { sendMessage, onText } as unknown as TelegramBot;

    registerNextRaceCommand(bot);

    // Extract the callback registered via onText
    const call = onText.mock.calls[0];
    expect(call).toBeDefined();
    const [, callback] = call!;

    const msg = { chat: { id: 123 } };
    await callback(msg);

    expect(sendMessage).toHaveBeenCalledWith(
      123,
      "Não foi possível obter os dados da próxima corrida. Tente novamente mais tarde.",
      { parse_mode: "Markdown" },
    );

    vi.unstubAllGlobals();
  });
});

describe("formatRaceMessage", () => {
  it("displays only the date without time when time is not provided", () => {
    const race: Race = {
      raceName: "Brazilian Grand Prix",
      Circuit: {
        circuitName: "Autódromo José Carlos Pace",
        Location: { locality: "São Paulo", country: "Brazil" },
      },
      date: "2025-11-09",
    };

    const message = formatRaceMessage(race);

    expect(message).toContain("09/11/2025");
    expect(message).not.toContain("às");
  });
});
