import streamDeck from "@elgato/streamdeck";
import { AirQualityAction } from "./actions/air-quality";

streamDeck.actions.registerAction(new AirQualityAction());
streamDeck.connect();
