import { getRowByIndexExtrapolate } from "./data.mjs";

const DEFAULT_URL = "https://www.microcovid.org/?useManualEntry=1";

export function getMicroCovidLink(data, index, url) {
  const row = getRowByIndexExtrapolate(data, index);

  const population = data.population;
  const casesPerWeek = (row.cases * population) / 100000;
  const positivity = row.positivity;

  const [urlBase, query] = (url || DEFAULT_URL).split("?", 2);
  const params = new URLSearchParams(query);

  params.set("population", population);
  params.set("casesPastWeek", casesPerWeek.toFixed(0));
  if (row.extrapolated) {
    params.set("casesIncreasingPercentage", 0.01);
  } else {
    params.delete("casesIncreasingPercentage");
  }
  params.set("positiveCasePercentage", positivity.toFixed(2));

  return [urlBase, params].join("?");
}
