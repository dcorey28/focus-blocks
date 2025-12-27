import streamDeck, { action, KeyAction, KeyDownEvent, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { setTimeout } from "timers/promises";

const longPressThreshold: number = 1000 // ms

enum State {
    Ready,
    Running,
    Paused,
    Done,
}

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

    override async onKeyDown(event: KeyDownEvent<TimerSettings>): Promise<void> {
        event.payload.settings.keyDownAt = new Date().getTime()
        await event.action.setSettings(event.payload.settings)
    }

    override async onKeyUp(event: KeyUpEvent<TimerSettings>): Promise<void> {
        const now = new Date().getTime()
        const pressDuration = now - event.payload.settings.keyDownAt

        if (pressDuration >= longPressThreshold) {
            await this.handleLongPress(event.action)
        } else {
            await this.handleShortPress(event.action, event.payload.settings)
        }
    }

    async handleShortPress(action: KeyAction<TimerSettings>, settings: TimerSettings) {
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
        }
    }

    async handleLongPress(action: KeyAction<TimerSettings>) {
        await this.reset(action)
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
    keyDownAt: number;
};
