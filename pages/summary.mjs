import {
  getAreaFromQueryString,
  getAreaQueryString,
} from "../modules/area.mjs";
import { plot } from "../modules/chart.mjs";
import { getRowByIndex, loadAreaData, ROLLING_DAYS } from "../modules/data.mjs";
import { getElements, getPage, setText } from "../modules/elements.mjs";
import { tableRow } from "../modules/table.mjs";

const e = getElements();
const area = getAreaFromQueryString();
const data = await loadAreaData(area);

setText("h1", document.title + " for " + area.primary[0]);
document.title = [area.primary[0], document.title].join(" - ");
e.area.primary.innerText = area.primary[0];
e.area.healthcare.innerText = area.healthcare[0];
e.data.date.innerText = data.date[0];
e.nav.history.href = `${getPage("history")}?${getAreaQueryString(area)}`;

setText("#population", data.population.toLocaleString());

if (data.fields.tests === "uniquePeopleTestedBySpecimenDateRollingSum") {
  e.summary.tests.after("¹");
} else {
  e.summary.tests.after("²");
}

const latestIndex = data.cases.findIndex((cases) => cases);
const latestRow0 = Object.create(null);
const latestRow1 = Object.create(null);
latestRow0.date = "Most recent";
latestRow0.extrapolated = Object.create(null);
for (let index = 0; index <= latestIndex + ROLLING_DAYS; index++) {
  const row0 = getRowByIndex(data, index);
  const row1 = getRowByIndex(data, index + ROLLING_DAYS);
  e.summary.tbody.append(
    tableRow(row0, row1, { class: "individual", extrapolated: false })
  );
  for (const field of Object.keys(row0.fields)) {
    if (!(field in latestRow0) && !(field in row0.extrapolated)) {
      latestRow0[field] = row0[field];
      latestRow1[field] = row1[field];
    }
  }
}
e.summary.tbody.append(tableRow(latestRow0, latestRow1, { class: "grouped" }));

plot("cases", data);
plot("positivity", data);
plot("vaccinated", data);
plot("admissions", data);
plot("patients", data);
plot("deaths", data);
plot("tests", data);
