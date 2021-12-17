import { $, getChangeBackground } from "./elements.mjs";

export function tableRow(row0, row1, options = {}) {
  return $(
    "tr",
    { class: options.class },
    $("td", row0.date),
    $("td", ...format("cases", row0, row1, options)),
    $("td", ...format("positivity", row0, row1, options)),
    $("td", ...format("vaccinated", row0, row1, options)),
    $("td", ...format("admissions", row0, row1, options)),
    $("td", ...format("patients", row0, row1, options)),
    $("td", ...format("deaths", row0, row1, options)),
    $("td", ...format("tests", row0, row1, options))
  );
}

function format(field, row0, row1, options) {
  const flip = field === "vaccinated" || field === "tests";
  const change = (flip ? -200 : 200) * (row0[field] / row1[field] - 1);
  return options.extrapolated === !row0.extrapolated[field]
    ? []
    : [
        {
          class: row0.extrapolated[field] ? "fst-italic text-info" : "",
          style: getChangeBackground(change),
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
