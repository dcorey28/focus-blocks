import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

import { Timer } from "./timer";

/**
 * Resets the current state of the game to a fresh, randomized board
 */
@action({ UUID: "dev.davidcorey.block-timer.reset" })
export class Reset extends SingletonAction {
    timer: Timer;

    constructor(timer: Timer) {
        super();
        this.timer = timer;
    }

    /**
     * Resets the game
     */
    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        streamDeck.logger.debug(`resetAll for ${ev.action.device.id}`)
        await this.timer.resetAll(ev.action.device.id)
    }
}
