# Focus Blocks
A timer plugin for tracking blocks of focus time. Each StreamDeck key becomes a focus block. Get them all green to complete your focus goal for the day.
![A screenshot of a virtual StreamDeck with timer keys in various states.](/docs/media/block-timers.png)

## How it works
### Setup
- Assign a Timer to a key for each focus block you want in your day
- Assign a Reset to one of the keys on the timers page that will reset all timers on the page

### Controls
- Quick press a Timer key to start/stop
- Long hold a Timer key to reset it
- Press the Reset key to reset all timers

## TODO
- [x] Timer runs during `running` state
- [x] Timer transitions to `done` state
- [x] Long hold resets timer
- [x] Timer animation
- [x] Finished sound
- [ ] Settings are configurable (Timer duration, end sound)
- [ ] Ensure timers will run and complete in background,even if not currently displayed
