import type { Team } from '#lib/server/teams.js';

declare global {
	namespace App {
		interface Locals {
			/** The student's team, resolved from the cookie. Undefined on the presenter and before joining. */
			team: Team | undefined;
		}
	}
}

export {};
