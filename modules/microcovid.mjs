const MICRO_COVID_URL =
  "https://www.microcovid.org/?useManualEntry=1&population=<population>&casesPastWeek=<cases-per-week>&casesIncreasingPercentage=<cases-increase-percent>&positiveCasePercentage=<test-positivity>";

export function getMicroCovidLink(data, index) {
  return MICRO_COVID_URL.replace("<population>", data.population)
    .replace(
      "<cases-per-week>",
      ((data.cases[index] * data.population) / 100000).toFixed(0)
    )
    .replace(
      "<cases-increase-percent>",
      (
        (100 * (data.cases[index] - data.cases[index + 7])) /
        data.cases[index + 7]
      ).toFixed(2)
    )
    .replace("<test-positivity>", data.positivity[index].toFixed(2));
}
