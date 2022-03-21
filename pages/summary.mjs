import {
  getAreaFromQueryString,
  getAreaQueryString,
} from "../modules/area.mjs";
import { plot } from "../modules/chart.mjs";
import {
  getLatestRow,
  getRowByIndex,
  loadAreaData,
  ROLLING_DAYS,
} from "../modules/data.mjs";
import { getElements, getPage, setText } from "../modules/elements.mjs";
import { tableRow } from "../modules/table.mjs";

const e = getElements();
const area = getAreaFromQueryString();
const data = await loadAreaData(area);

setText("h1", document.title + " for " + area.primary[0]);
document.title = [area.primary[0], document.title].join(" - ");
e.area.primary.innerText = area.primary[0];
e.area.healthcare.innerText = area.healthcare[0];
e.data.date.innerText = data.latestDate;
e.nav.history.href = `${getPage("history")}?${getAreaQueryString(area)}`;
e.nav.comparison.href = `${getPage("comparison")}?${getAreaQueryString(area)}`;

setText("#population", data.population.toLocaleString());

const latestIndex = data.cases.findIndex((cases) => cases);
for (let index = 0; index <= latestIndex + ROLLING_DAYS; index++) {
  const row0 = getRowByIndex(data, index);
  const row1 = getRowByIndex(data, index + ROLLING_DAYS);
  e.summary.tbody.append(
    tableRow(row0, row1, { class: "expanded", extrapolated: false })
  );
}
const latestRow0 = getLatestRow(data, 0);
const latestRow1 = getLatestRow(data, ROLLING_DAYS);
latestRow0.date = "Most recent";
e.summary.tbody.append(
  tableRow(latestRow0, latestRow1, { class: "collapsed" })
);

plot("cases", data);
plot("positivity", data);
plot("tests", data);
plot("admissions", data);
plot("patients", data);
plot("deaths", data);
plot("vaccinated", data);
