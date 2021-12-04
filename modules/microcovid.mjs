import { getRowByIndexExtrapolate } from "./data.mjs";

const MICRO_COVID_URL =
  "https://www.microcovid.org/?useManualEntry=1&population=<population>&casesPastWeek=<cases-per-week>&casesIncreasingPercentage=<cases-increase-percent>&positiveCasePercentage=<test-positivity>";

export function getMicroCovidLink(data, index) {
  const row = getRowByIndexExtrapolate(data, index);

  const population = data.population;
  const casesPerWeek = (row.cases * population) / 100000;
  const positivity = row.positivity;

  return MICRO_COVID_URL.replace("<population>", population)
    .replace("<cases-per-week>", casesPerWeek.toFixed(0))
    .replace("<cases-increase-percent>", 0)
    .replace("<test-positivity>", positivity.toFixed(2));
}
