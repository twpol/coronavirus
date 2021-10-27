const MICRO_COVID_URL =
  "https://www.microcovid.org/?useManualEntry=1&population=<population>&casesPastWeek=<cases-per-week>&casesIncreasingPercentage=<cases-increase-percent>&positiveCasePercentage=<test-positivity>";

export function getMicroCovidLink(data, index) {
  const current = !data.cases[index];
  if (current) index += 7;

  const population = data.population;
  const casesPerWeek = (data.cases[index] * population) / 100000;
  const casesIncreasePercent = current
    ? (100 * (data.cases[index] - data.cases[index + 7])) /
      data.cases[index + 7]
    : 0;
  const positivity = data.positivity[index];

  return MICRO_COVID_URL.replace("<population>", population)
    .replace("<cases-per-week>", casesPerWeek.toFixed(0))
    .replace("<cases-increase-percent>", casesIncreasePercent.toFixed(2))
    .replace("<test-positivity>", positivity.toFixed(2));
}
