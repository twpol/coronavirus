import {
  getAreaQueryString,
  getAreas,
  getSmallestArea,
} from "../modules/area.mjs";
import { getPage } from "../modules/elements.mjs";
import { getElements } from "../modules/elements.mjs";

const e = getElements();

async function load() {
  const primaryAreas = [
    { areaType: "overview", areaCode: "K02000001", areaName: "United Kingdom" },
    ...(await getAreas("nation")),
    ...(await getAreas("region")),
    ...(await getAreas("utla")),
    ...(await getAreas("ltla")),
  ];

  for (const area of primaryAreas) {
    const option = document.createElement("option");
    option.setAttribute(
      "value",
      `${area.areaName} / ${area.areaType} / ${area.areaCode}`
    );
    e.summary.primary.list.append(option);
  }

  const healthcareAreas = [
    { areaName: "United Kingdom", areaType: "overview", areaCode: "K02000001" },
    ...(await getAreas("nation")),
    ...(await getAreas("nhsRegion")),
    ...(await getAreas("nhsTrust")),
  ];

  for (const area of healthcareAreas) {
    const option = document.createElement("option");
    option.setAttribute(
      "value",
      `${area.areaName} / ${area.areaType} / ${area.areaCode}`
    );
    e.summary.healthcare.list.append(option);
  }

  e.summary.postcode.submit.addEventListener("click", searchPostcode);
  e.summary.submit.addEventListener("click", areaOpen);
}

async function searchPostcode() {
  const area = await getSmallestArea(
    "postcode",
    e.summary.postcode.input.value.replace(/\s+/g, "")
  );
  e.summary.primary.input.value = area.primary.join(" / ");
  e.summary.healthcare.input.value = area.healthcare.join(" / ");
}

async function areaOpen() {
  if (!e.summary.primary.input.value) return;
  const area = {
    primary: e.summary.primary.input.value.split(" / "),
    healthcare: e.summary.healthcare.input.value.split(" / "),
  };
  e.summary.primary.input.value = "";
  e.summary.healthcare.input.value = "";

  if (area.healthcare[0]) {
    location.href = `${getPage("summary")}?${getAreaQueryString(area)}`;
  } else {
    const area2 = await getSmallestArea(area.primary[1], area.primary[2]);
    location.href = `${getPage("summary")}?${getAreaQueryString(area2)}`;
  }
}

setTimeout(load);
