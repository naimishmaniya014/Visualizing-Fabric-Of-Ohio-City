import { create } from "d3";
import { createContext } from "react";

export const ParticipantsContext = createContext({
    selectedParticipants: [],
    setSelectedParticipants: () => {}
});

export const BuildingContext = createContext({
    selectedBuildings: [],
    setSelectedBuildings: () => {}
})

export const DateTimeContext = createContext({
    dateTime: "2022-03-01 17",
    setDateTime: () => {}
});

export const EarningsAndVisitorsContext = createContext({
    visitorsAndEarnings: [],
    setVisitorsAndEarnings: () => {}
})


