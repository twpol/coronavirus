import {
  getAreaQueryString,
  getAreas,
  getSmallestArea,
} from "../modules/area.mjs";
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
    e.area.primary.list.append(option);
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
    e.area.healthcare.list.append(option);
  }

  e.area.postcode.submit.addEventListener("click", searchPostcode);
  e.area.submit.addEventListener("click", areaOpen);
}

async function searchPostcode() {
  const area = await getSmallestArea(
    "postcode",
    e.area.postcode.input.value.replace(/\s+/g, "")
  );
  e.area.primary.input.value = area.primary.join(" / ");
  e.area.healthcare.input.value = area.healthcare.join(" / ");
}

async function areaOpen() {
  if (!e.area.primary.input.value) return;
  const area = {
    primary: e.area.primary.input.value.split(" / "),
    healthcare: e.area.healthcare.input.value.split(" / "),
  };
  e.area.primary.input.value = "";
  e.area.healthcare.input.value = "";

  const linkBase = `area${location.hostname === "localhost" ? ".html" : ""}?`;
  if (area.healthcare[0]) {
    location.href = linkBase + getAreaQueryString(area);
  } else {
    const area2 = await getSmallestArea(area.primary[1], area.primary[2]);
    location.href = linkBase + getAreaQueryString(area2);
  }
}

setTimeout(load);
