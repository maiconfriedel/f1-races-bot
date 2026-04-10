// Feature: next-race-command, Property 1: A próxima corrida é sempre a mínima data >= hoje

import * as fc from "fast-check";
import { describe, it } from "vitest";
import type { Race } from "../../types/eargast.js";
import { findNextRace, formatRaceMessage } from "../get-next-race.js";

// Generates a date string "YYYY-MM-DD" between 2020-01-01 and 2030-12-31
const isoDateArb = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ms) => new Date(ms).toISOString().slice(0, 10));

const raceArb: fc.Arbitrary<Race> = fc
  .record(
    {
      raceName: fc.string(),
      Circuit: fc.record({
        circuitName: fc.string(),
        Location: fc.record({
          locality: fc.string(),
          country: fc.string(),
        }),
      }),
      date: isoDateArb,
      time: fc.string(),
    },
    { requiredKeys: ["raceName", "Circuit", "date"] },
  )
  .map((r) => r as Race);

// Generates "HH:MM:00Z" with HH in 00-23 and MM in 00-59
const timeArb = fc
  .record({
    hh: fc.integer({ min: 0, max: 23 }),
    mm: fc.integer({ min: 0, max: 59 }),
  })
  .map(
    ({ hh, mm }) =>
      `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00Z`,
  );

// Race with all fields filled, including time
const raceWithTimeArb: fc.Arbitrary<Race> = fc.record({
  raceName: fc.string({ minLength: 1 }),
  Circuit: fc.record({
    circuitName: fc.string({ minLength: 1 }),
    Location: fc.record({
      locality: fc.string({ minLength: 1 }),
      country: fc.string({ minLength: 1 }),
    }),
  }),
  date: isoDateArb,
  time: timeArb,
});

describe("findNextRace — Property 1", () => {
  it("returns the race with the minimum date >= today, or null if none exists", () => {
    // Validates: Requirements 1.2
    fc.assert(
      fc.property(fc.array(raceArb), isoDateArb, (races, todayStr) => {
        const today = new Date(todayStr);
        const result = findNextRace(races, today);

        const futureRaces = races.filter((r) => r.date >= todayStr);

        if (futureRaces.length === 0) {
          // If no race has date >= today, result must be null
          return result === null;
        }

        // Result must not be null
        if (result === null) return false;

        // result.date must be >= todayStr
        if (result.date < todayStr) return false;

        // No other race in the list should have a date >= todayStr AND < result.date
        const hasEarlierFutureRace = races.some(
          (r) => r.date >= todayStr && r.date < result.date,
        );
        return !hasEarlierFutureRace;
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: next-race-command, Property 2: A mensagem formatada contém todos os campos obrigatórios
describe("formatRaceMessage — Property 2", () => {
  it("formatted message contains all required fields when time is present", () => {
    // Validates: Requirements 2.1, 2.2
    fc.assert(
      fc.property(raceWithTimeArb, (race) => {
        const message = formatRaceMessage(race);

        // Must contain the race name
        if (!message.includes(race.raceName)) return false;

        // Must contain the circuit name
        if (!message.includes(race.Circuit.circuitName)) return false;

        // Must contain the locality
        if (!message.includes(race.Circuit.Location.locality)) return false;

        // Must contain the country
        if (!message.includes(race.Circuit.Location.country)) return false;

        // Must contain the date in DD/MM/YYYY format
        const [year, month, day] = race.date.split("-");
        const formattedDate = `${day}/${month}/${year}`;
        if (!message.includes(formattedDate)) return false;

        // Must contain "às"
        if (!message.includes("às")) return false;

        return true;
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: next-race-command, Property 3: Data sem horário omite a parte de hora
describe("formatRaceMessage — Property 3", () => {
  it("formatted message omits time part when time field is absent", () => {
    // Validates: Requirements 2.4
    const raceWithoutTimeArb: fc.Arbitrary<Race> = fc.record({
      raceName: fc.string({ minLength: 1 }),
      Circuit: fc.record({
        circuitName: fc.string({ minLength: 1 }),
        Location: fc.record({
          locality: fc.string({ minLength: 1 }),
          country: fc.string({ minLength: 1 }),
        }),
      }),
      date: isoDateArb,
    });

    fc.assert(
      fc.property(raceWithoutTimeArb, (race) => {
        const message = formatRaceMessage(race);

        // Must contain the date in DD/MM/YYYY format
        const [year, month, day] = race.date.split("-");
        const formattedDate = `${day}/${month}/${year}`;
        if (!message.includes(formattedDate)) return false;

        // Must NOT contain "às"
        if (message.includes("às")) return false;

        return true;
      }),
      { numRuns: 100 },
    );
  });
});
