import streamDeck from "@elgato/streamdeck";

import { Timer } from "./actions/timer";
import { Reset } from "./actions/reset";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded.
streamDeck.logger.setLevel("trace");

// Register the timer actions.
const timer = new Timer();
streamDeck.actions.registerAction(timer);
streamDeck.actions.registerAction(new Reset(timer));

// Finally, connect to the Stream Deck.
streamDeck.connect();
