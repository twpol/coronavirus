import {
  getAreaFromQueryString,
  getAreaQueryString,
} from "../modules/area.mjs";
import {
  getIndexForDate,
  getRowByIndexExtrapolate,
  loadAreaData,
} from "../modules/data.mjs";
import { $, getElements, getPage, setText } from "../modules/elements.mjs";
import { params, setQueryParam } from "../modules/location.mjs";
import { getMicroCovidLink } from "../modules/microcovid.mjs";

const e = getElements();

const date = params.get("date");
e.date.input.value = date;
e.date.submit.addEventListener("click", () =>
  setQueryParam("date", e.date.input.value)
);

const area = getAreaFromQueryString();
const data = await loadAreaData(area);

setText(
  "h1",
  document.title + " for " + area.primary[0] + (date ? " on " + date : "")
);
document.title = [date, area.primary[0], document.title]
  .filter((i) => !!i)
  .join(" - ");
e.area.primary.innerText = area.primary[0];
e.area.healthcare.innerText = area.healthcare[0];
e.data.date.innerText = data.date[0];
e.nav.summary.href = `${getPage("summary")}?${getAreaQueryString(area)}`;

setText("#population", data.population.toLocaleString());

if (date) {
  let index = getIndexForDate(data, date);
  while (addDataRow(index)) {
    index += 7;
  }
  e.history.table.style.display = "";

  e.microCovid.link.href = getMicroCovidLink(data, getIndexForDate(data, date));
}

function addDataRow(index) {
  const row0 = getRowByIndexExtrapolate(data, index);
  const row1 = getRowByIndexExtrapolate(data, index + 7);
  e.history.tbody.append(
    $(
      "tr",
      { class: row0.extrapolated ? "fst-italic" : "" },
      $("td", row0.date),
      $("td", ...format("cases", row0, row1)),
      $("td", ...format("positivity", row0, row1)),
      $("td", ...format("vaccinated", row0, row1)),
      $("td", ...format("admissions", row0, row1)),
      $("td", ...format("patients", row0, row1)),
      $("td", ...format("deaths", row0, row1))
    )
  );
  return row0.extrapolated;
}

function format(field, row0, row1) {
  return [
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
      .substr(0, 7),
    ")",
  ];
}
