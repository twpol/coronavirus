import {
  getAreaQueryString,
  getAreaQueryStringFromQuery,
  getAreasFromQueryString,
} from "../modules/area.mjs";
import { plot } from "../modules/chart.mjs";
import {
  getLatestRow,
  loadAreaData,
  ROLLING_DAYS,
} from "../modules/data.mjs";
import { $, getElements, getPage, setText } from "../modules/elements.mjs";
import { tableRow } from "../modules/table.mjs";

const e = getElements();
const areas = getAreasFromQueryString();
const data = await Promise.all(areas.map((area) => loadAreaData(area)));

const combinedAreas = areas.map((area) => area.primary[0]).join(", ");
setText("h1", document.title + " of " + combinedAreas);
document.title = [combinedAreas, document.title].join(" - ");

e.area.submit.addEventListener("click", () => {
  try {
    const url = new URL(e.area.input.value);
    const params = new URLSearchParams(url.search);
    location.search += `;${getAreaQueryStringFromQuery(params)}`;
  } catch (error) {
    alert(`Input does not look like a link from this site\n\n${error}`);
  }
});

for (let i = 0; i < areas.length; i++) {
  const latestRow0 = getLatestRow(data[i], 0);
  const latestRow1 = getLatestRow(data[i], ROLLING_DAYS);
  e.summary.tbody.append(
    tableRow(latestRow0, latestRow1, {
      class: "collapsed",
      labels: [
        $(
          "td",
          $(
            "a",
            { href: `${getPage("summary")}?${getAreaQueryString(areas[i])}` },
            areas[i].primary[0]
          )
        ),
        $(
          "td",
          { title: `Latest cases data is ${data[i].latestIndexes.cases} days old (after processing)` },
          data[i].latestIndexes.cases
        ),
      ],
    })
  );
}

plot("cases", data);
plot("positivity", data);
plot("tests", data);
plot("admissions", data);
plot("patients", data);
plot("deaths", data);
plot("vaccinated", data);
