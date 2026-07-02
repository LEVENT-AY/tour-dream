export const AIRPORT_IATA: Record<string, string> = {
  "Tunis (TUN)": "TUN",
  "Sfax (SFA)": "SFA",
  "Monastir (MIR)": "MIR",
  "Djerba (DJE)": "DJE",
  "Tozeur (TOE)": "TOE",
  "Istanbul (IST)": "IST",
  "Paris (CDG)": "CDG",
  "Dubai (DXB)": "DXB",
  "London (LHR)": "LHR",
  "Frankfurt (FRA)": "FRA",
  "Rome (FCO)": "FCO",
  "Madrid (MAD)": "MAD",
  "Casablanca (CMN)": "CMN",
  "Cairo (CAI)": "CAI",
  "Doha (DOH)": "DOH",
};

export const FLIGHT_LOCATIONS = Object.entries(AIRPORT_IATA).map(([label, code]) => {
  const name = label.replace(/ \(...\)$/, '');
  return { value: label, subValue: `${code} \u2014 ${name}` };
});
