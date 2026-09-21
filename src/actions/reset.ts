import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

import { Timer } from "./timer";

/**
 * Resets the current state of all timers on the same page as the reset button.
 */
@action({ UUID: "dev.davidcorey.focus-blocks.reset" })
export class Reset extends SingletonAction {
    timer: Timer;

    constructor(timer: Timer) {
        super();
        this.timer = timer;
    }

    /**
     * Resets all timers.
     */
    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        streamDeck.logger.debug(`resetAll for ${ev.action.device.id}`)
        await this.timer.resetAll(ev.action.device.id)
    }
}
