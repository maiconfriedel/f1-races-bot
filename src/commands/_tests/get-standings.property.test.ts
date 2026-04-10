// Feature: standings-command, Property 1: Formatter de pilotos contém todos os nomes
// Feature: standings-command, Property 2: Formatter de construtores contém todos os nomes
// Feature: standings-command, Property 3: Formatter preserva ordem crescente de posições

import * as fc from "fast-check";
import { describe, it } from "vitest";
import type {
	ConstructorStandingEntry,
	DriverStandingEntry,
} from "../get-standings.js";
import {
	formatConstructorStandings,
	formatDriverStandings,
} from "../get-standings.js";

const driverEntryArb: fc.Arbitrary<DriverStandingEntry> = fc.record({
	position: fc.integer({ min: 1 }),
	driverName: fc.string({ minLength: 1 }),
	constructorName: fc.string({ minLength: 1 }),
	points: fc.string(),
	wins: fc.string(),
});

const constructorEntryArb: fc.Arbitrary<ConstructorStandingEntry> = fc.record({
	position: fc.integer({ min: 1 }),
	constructorName: fc.string({ minLength: 1 }),
	points: fc.string(),
	wins: fc.string(),
});

describe("formatDriverStandings — Property 1", () => {
	it("formatted message contains all driver names for any non-empty list", () => {
		// Validates: Requirements 3.1, 4.1
		fc.assert(
			fc.property(fc.array(driverEntryArb, { minLength: 1 }), (entries) => {
				const msg = formatDriverStandings(entries);
				return entries.every((e) => msg.includes(e.driverName));
			}),
			{ numRuns: 100 },
		);
	});
});

describe("formatConstructorStandings — Property 2", () => {
	it("formatted message contains all constructor names for any non-empty list", () => {
		// Validates: Requirements 3.2, 4.2
		fc.assert(
			fc.property(
				fc.array(constructorEntryArb, { minLength: 1 }),
				(entries) => {
					const msg = formatConstructorStandings(entries);
					return entries.every((e) => msg.includes(e.constructorName));
				},
			),
			{ numRuns: 100 },
		);
	});
});

describe("formatDriverStandings — Property 3", () => {
	it("position 1 appears before position N in the formatted message", () => {
		// Validates: Requirements 3.3, 4.3
		fc.assert(
			fc.property(
				fc
					.array(driverEntryArb, { minLength: 2 })
					.map((entries) => entries.map((e, i) => ({ ...e, position: i + 1 }))),
				(entries) => {
					const msg = formatDriverStandings(entries);
					const pos1Index = msg.indexOf("1.");
					const posNIndex = msg.lastIndexOf(`${entries.length}.`);
					return pos1Index < posNIndex;
				},
			),
			{ numRuns: 100 },
		);
	});
});
