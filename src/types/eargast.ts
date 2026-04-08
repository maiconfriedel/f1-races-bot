export interface Race {
  raceName: string; // Ex: "Brazilian Grand Prix"
  Circuit: {
    circuitName: string; // Ex: "Autódromo José Carlos Pace"
    Location: {
      locality: string; // Ex: "São Paulo"
      country: string; // Ex: "Brazil"
    };
  };
  date: string; // Ex: "2025-11-09" (ISO date)
  time?: string; // Ex: "18:00:00Z" (opcional)
}

export interface ErgastResponse {
  MRData: {
    RaceTable: {
      Races: Race[];
    };
  };
}
