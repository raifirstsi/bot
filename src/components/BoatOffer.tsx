import { track } from "@/lib/analytics";
import type { FC } from "react";

export type BoatOfferAction = "get_boat" | "claim" | "not_now" | "close";
type BoatOfferPlace = "card" | "settings";

export function reportBoatOffer(action: BoatOfferAction | "shown", place: BoatOfferPlace) {
  track("boat_offer", { action, place });
}

export const BoatOfferCard: FC<{ onDone: (action: BoatOfferAction) => void }> = () => null;

export function BoatOfferPanel() {
  return null;
}
