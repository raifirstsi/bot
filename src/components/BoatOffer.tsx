import { track } from "@/lib/analytics";

export type BoatOfferAction = "get_boat" | "claim" | "not_now" | "close";
type BoatOfferPlace = "card" | "settings";

export function reportBoatOffer(action: BoatOfferAction | "shown", place: BoatOfferPlace) {
  track("boat_offer", { action, place });
}

export function BoatOfferCard({ onDone: _ }: { onDone: (action: BoatOfferAction) => void }) {
  return null;
}

export function BoatOfferPanel() {
  return null;
}
