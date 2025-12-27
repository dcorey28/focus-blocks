import streamDeck, { action, Coordinates, KeyAction, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { setTimeout } from "timers/promises";

enum State {
    Ready,
    Running,
    Paused,
    Done,
}

/**
 * A play piece for the lights-out game
 */
@action({ UUID: "dev.davidcorey.block-timer.timer" })
export class Timer extends SingletonAction<TimerSettings> {
    constructor() {
        super();
    }

    override async onWillAppear(ev: WillAppearEvent<TimerSettings>) {
        if (ev.action.isDial()) {
            return
        }

        await this.reset(ev.action)
    }

    /**
     * A generator which narrows down all visible actions to only ones that are present on a specific Stream Deck device
     */
    *deviceItems(deviceId: string): IterableIterator<KeyAction<TimerSettings>> {
        for (const action of this.actions) {
            if (action.device.id === deviceId && action.isKey() && action.coordinates !== undefined) {
                yield action;
            }
        }
    }

    /**
     * Performs a light switch toggle, which toggles the state of the 4 actions that border the pressed action in
     * each cardinal direction, as well as the action itself
     */
    override async onKeyDown(event: KeyDownEvent<TimerSettings>): Promise<void> {
        // We can't access action coordinates if the action is a part of a multi-action
        if (event.payload.isInMultiAction) {
            return;
        }

        await this.transition(event.action, event.payload.settings)
    }

    async transition(action: KeyAction<TimerSettings>, settings: TimerSettings) {
        switch (settings.state) {
            case State.Ready:
                await this.start(action, settings)
                break;
            case State.Running:
                await this.pause(action, settings)
                break;
            case State.Paused:
                await this.continue(action, settings)
                break;
            case State.Done:
                // TODO: Reset only on long hold
                await this.reset(action)
                break;
        }
    }

    async start(action: KeyAction<TimerSettings>, settings: TimerSettings) {
        if (settings.state == State.Running) {
            return
        }

        settings.state = State.Running
        await action.setSettings(settings)
        await action.setImage('imgs/actions/timer/running')
    }

    async pause(action: KeyAction<TimerSettings>, settings: TimerSettings) {
        if (settings.state == State.Paused) {
            return
        }

        settings.state = State.Paused
        await action.setSettings(settings)
        await action.setImage('imgs/actions/timer/paused')
    }

    async continue(action: KeyAction<TimerSettings>, settings: TimerSettings) {
        if (settings.state == State.Running) {
            return
        }

        settings.state = State.Running
        await action.setSettings(settings)
        await action.setImage('imgs/actions/timer/running')
    }

    async reset(action: KeyAction<TimerSettings>) {
        const settings = await action.getSettings()

        if (settings.state == State.Ready) {
            streamDeck.logger.debug(`skipping action ${action.id} because is ready`)
            return
        }

        settings.state = State.Ready
        await action.setSettings(settings)
        await action.setImage('imgs/actions/timer/ready')
        streamDeck.logger.debug(`reset of ${action.id} successful`)
    }

    async resetAll(deviceId: string) {
        const promises = [];
        for (const action of this.deviceItems(deviceId)) {
            if (action.isInMultiAction()) {
                streamDeck.logger.debug(`skipping action ${action.id} because is multi-action`)
                continue;
            }

            streamDeck.logger.debug(`resetting action ${action.id}`)
            promises.push(this.reset(action))
        }

        await Promise.all(promises)
    }
}

type TimerSettings = {
    state: State;
};
