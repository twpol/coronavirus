import { getAreaQueryString } from "../modules/area.mjs";
import { getAreaFromQueryString } from "../modules/area.mjs";
import { plot } from "../modules/chart.mjs";
import { loadAreaData } from "../modules/data.mjs";
import { getPage } from "../modules/elements.mjs";
import { getElements, setText } from "../modules/elements.mjs";

const e = getElements();
const area = getAreaFromQueryString();
const data = await loadAreaData(area);

setText("h1", document.title + " for " + area.primary[0]);
document.title = [area.primary[0], document.title].join(" - ");
e.area.primary.innerText = area.primary[0];
e.area.healthcare.innerText = area.healthcare[0];
e.data.date.innerText = data.date[0];
e.summary.history.href = `${getPage("history")}?${getAreaQueryString(area)}`;

setText("#summary-population", data.population.toLocaleString());

if (isNaN(data.tests[14])) {
  data.tests = data.tests2;
  e.summary.tests.after("¹");
} else {
  e.summary.tests.after("²");
}

plot("cases", data);
plot("positivity", data);
plot("vaccinated", data);
plot("admissions", data);
plot("patients", data);
plot("deaths", data);
plot("tests", data, { flip: true });
