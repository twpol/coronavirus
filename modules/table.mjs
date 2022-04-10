import { $, getChangeBackground } from "./elements.mjs";

export function tableRow(row0, row1, options = {}) {
  return $(
    "tr",
    { class: options.class },
    ...(options.labels || [$("td", row0.date)]),
    $("td", ...format("cases", row0, row1, options)),
    $("td", ...format("positivity", row0, row1, options)),
    $("td", ...format("tests", row0, row1, options)),
    $("td", ...format("admissions", row0, row1, options)),
    $("td", ...format("patients", row0, row1, options)),
    $("td", ...format("deaths", row0, row1, options)),
    $("td", ...format("vaccinated", row0, row1, options))
  );
}

function format(field, row0, row1, options) {
  const estField = "est" + field[0].toUpperCase() + field.substr(1);
  if (!row0[field] && row0[estField]) {
    field = estField;
  }
  const estimated = row0.extrapolated[field] || field === estField;
  const fieldDate0 = row0.dates ? row0.dates[field] : row0.date;
  const fieldDate1 = row1.dates ? row1.dates[field] : row1.date;

  const flip = field === "vaccinated" || field === "tests" ? -1 : 1;
  const change = flip * getChange(row0[field], row1[field]);

  return options.extrapolated === !row0.extrapolated[field]
    ? []
    : !row0[field]
    ? [{ class: "fst-italic" }, "n/a"]
    : [
        {
          class: estimated ? "fst-italic text-info" : "",
          style: getChangeBackground(change),
          title: `${
            estimated ? "Estimated total" : "Total"
          } ${field} for 7 days centred on ${fieldDate0} with change from ${fieldDate1}`,
        },
        row0[field].toLocaleString(undefined, {
          minimumSignificantDigits: 3,
          maximumSignificantDigits: 3,
        }),
        " (",
        (row0[field] - row1[field])
          .toLocaleString(undefined, {
            minimumSignificantDigits: 2,
            maximumSignificantDigits: 2,
            signDisplay: "always",
          })
          .substring(0, 7),
        ")",
      ];
}

function getChange(row0, row1) {
  return (200 * (row0 - row1)) / Math.min(row0, row1);
}
