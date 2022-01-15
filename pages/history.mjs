import {
  getAreaFromQueryString,
  getAreaQueryString,
} from "../modules/area.mjs";
import {
  getIndexForDate,
  getRowByIndex,
  loadAreaData,
  ROLLING_DAYS,
} from "../modules/data.mjs";
import { getElements, getPage, setText } from "../modules/elements.mjs";
import { params, setQueryParam } from "../modules/location.mjs";
import { getMicroCovidLink } from "../modules/microcovid.mjs";
import { tableRow } from "../modules/table.mjs";

const e = getElements();

const date = params.get("date");
e.date.input.value = date;
e.date.submit.addEventListener("click", () =>
  setQueryParam("date", e.date.input.value)
);
e.microCovid.input.value = params.get("microCovid");
e.microCovid.input.addEventListener("change", updateMicroCovidLink);

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
e.data.date.innerText = data.latestDate;
e.nav.summary.href = `${getPage("summary")}?${getAreaQueryString(area)}`;

setText("#population", data.population.toLocaleString());

if (data.fields.tests === "uniquePeopleTestedBySpecimenDateRollingSum") {
  e.history.tests.after("¹");
} else {
  e.history.tests.after("²");
}

if (date) {
  let index = getIndexForDate(data, date);
  while (addDataRow(index)) {
    index += ROLLING_DAYS;
  }
  e.history.table.style.display = "";

  updateMicroCovidLink();

  if (params.get("openMicroCovid")) {
    autoOpenMicroCovid();
  }
}

function updateMicroCovidLink() {
  e.microCovid.link.href = getMicroCovidLink(
    data,
    getIndexForDate(data, date),
    e.microCovid.input.value
  );
}

function autoOpenMicroCovid() {
  let seconds = 10;
  e.microCovid.auto.countdown.innerText = seconds;
  e.microCovid.auto.style.display = "";

  const timer = setInterval(() => {
    seconds--;
    e.microCovid.auto.countdown.innerText = seconds;
    if (seconds <= 0) {
      e.microCovid.link.click();
    }
  }, 1000);

  e.microCovid.auto.cancel.addEventListener("click", () => {
    clearInterval(timer);
    e.microCovid.auto.style.display = "none";
    params.delete("openMicroCovid");
    location.replace(`?${params}`);
  });
}

function addDataRow(index) {
  const row0 = getRowByIndex(data, index);
  const row1 = getRowByIndex(data, index + ROLLING_DAYS);
  e.history.tbody.append(tableRow(row0, row1));
  return Object.keys(row0.extrapolated).length;
}
