import { getAreaFromQueryString } from "../modules/area.mjs";
import { loadAreaData } from "../modules/data.mjs";
import { $, getElements, setText } from "../modules/elements.mjs";
import { getMicroCovidLink } from "../modules/microcovid.mjs";

const e = getElements();
const area = getAreaFromQueryString();
const data = await loadAreaData(area);

setText("h1", document.title + " for " + area.primary[0]);
document.title = [area.primary[0], document.title].join(" - ");
e.area.primary.innerText = area.primary[0];
e.area.healthcare.innerText = area.healthcare[0];
e.data.date.innerText = data.date[0];

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

const now = Date.now();
const dateBase = now - (now % WEEK_MS);
for (let i = 0; i < 26; i++) {
  const date = dateISO(new Date(dateBase - i * WEEK_MS - 3 * DAY_MS));
  const index = data.date.indexOf(dateISO(new Date(dateBase - i * WEEK_MS)));
  e.history.tbody.append(
    $(
      "tr",
      $("td", date),
      $(
        "td",
        data.cases[index]
          ? $(
              "a",
              { target: "_blank", href: getMicroCovidLink(data, index) },
              "microCOVID"
            )
          : {}
      ),
      $("td", ...format(data, "cases", index)),
      $("td", ...format(data, "positivity", index)),
      $("td", ...format(data, "vaccinated", index)),
      $("td", ...format(data, "admissions", index)),
      $("td", ...format(data, "patients", index)),
      $("td", ...format(data, "deaths", index))
    )
  );
}

function dateISO(date) {
  return date.toISOString().substring(0, 10);
}

function format(data, field, index) {
  return [
    data[field][index].toLocaleString(undefined, {
      minimumSignificantDigits: 3,
      maximumSignificantDigits: 3,
    }),
    " (",
    (data[field][index] - data[field][index + 7])
      .toLocaleString(undefined, {
        minimumSignificantDigits: 2,
        maximumSignificantDigits: 2,
        signDisplay: "always",
      })
      .substr(0, 7),
    ")",
  ];
}
