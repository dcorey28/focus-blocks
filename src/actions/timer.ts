import streamDeck, { action, KeyAction, KeyDownEvent, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { setTimeout } from "timers/promises";

const longPressThreshold: number = 1000 // ms
const tickInterval: number = 100 // ms

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

        settings.timeRemaining = settings.timeLimit || 3_000_000 // ms
        this.startCountdown(action, settings)
    }

    async startCountdown(action: KeyAction<TimerSettings>, settings: TimerSettings) {
        settings.state = State.Running
        await action.setTitle(formatTime(settings.timeRemaining))
        await action.setImage('imgs/actions/timer/running')
        const interval = setInterval(async () => {
            const settings = await action.getSettings()
            settings.timeRemaining -= tickInterval

            if (settings.timeRemaining <= 0) {
                clearInterval(settings.timerHandle)
                this.finish(action, settings)
                return
            }

            await action.setTitle(formatTime(settings.timeRemaining))
            await action.setSettings(settings)
        }, tickInterval)
        settings.timerHandle = interval[Symbol.toPrimitive]()
        await action.setSettings(settings)
    }

    stopCountdown(settings: TimerSettings) {
        if (settings.timerHandle) {
            clearInterval(settings.timerHandle)
            settings.timerHandle = 0
        }
    }

    async pause(action: KeyAction<TimerSettings>, settings: TimerSettings) {
        if (settings.state == State.Paused) {
            return
        }

        settings.state = State.Paused
        clearInterval(settings.timerHandle)
        await action.setSettings(settings)
        await action.setImage('imgs/actions/timer/paused')
    }

    async continue(action: KeyAction<TimerSettings>, settings: TimerSettings) {
        if (settings.state == State.Running) {
            return
        }

        this.startCountdown(action, settings)
    }

    async finish(action: KeyAction<TimerSettings>, settings: TimerSettings) {
        if (settings.state == State.Done) {
            return
        }

        settings.state = State.Done
        await action.setSettings(settings)
        await action.setTitle('')
        await action.setImage('imgs/actions/timer/done')
    }

    async reset(action: KeyAction<TimerSettings>) {
        const settings = await action.getSettings()

        if (settings.state == State.Ready) {
            return
        }
        settings.state = State.Ready
        this.stopCountdown(settings)
        await action.setSettings(settings)
        await action.setTitle('')
        await action.setImage('imgs/actions/timer/ready')
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

function formatTime(milliseconds: number) {
    const minutes = Math.floor((milliseconds + 1000) / 60_000);
    const seconds = Math.ceil(milliseconds / 1000) % 60;

    let secondsStr: string

    if (seconds < 10) {
        secondsStr = `0${seconds}`;
    } else {
        secondsStr = `${seconds}`
    }

    return `${minutes}:${secondsStr}`;
}

type TimerSettings = {
    state: State
    timeLimit: number
    timeRemaining: number
    keyDownAt: number
    timerHandle: number
};
