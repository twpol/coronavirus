import { fetchGenericApi } from "./api.mjs";
import { params } from "./location.mjs";

const AREA_TYPES_PRIMARY = ["ltla", "utla", "region", "nation", "overview"];
const AREA_TYPES_HEALTHCARE = ["nhsTrust", "nhsRegion", "nation", "overview"];

export async function getAreas(areaType) {
  return (await fetchGenericApi(`area/${areaType}`)).map((area) => ({
    areaType,
    ...area,
  }));
}

export async function getSmallestArea(type, code) {
  const data = await fetchGenericApi(`code/${type}/${code}`);
  return getSmallestAreaFromCode(data);
}

function getSmallestAreaFromCode(code) {
  const primaryAreaType = AREA_TYPES_PRIMARY.find((a) => code[a]);
  const healthcareAreaType = AREA_TYPES_HEALTHCARE.find((a) => code[a]);
  return {
    primary: [
      code[primaryAreaType + "Name"],
      primaryAreaType,
      code[primaryAreaType],
    ],
    healthcare: [
      code[healthcareAreaType + "Name"],
      healthcareAreaType,
      code[healthcareAreaType],
    ],
  };
}

export function getAreaQueryString(area) {
  return [
    [area.primary[1], encodeURIComponent(area.primary[0])].join("="),
    area.primary[0] !== area.healthcare[0]
      ? [area.healthcare[1], encodeURIComponent(area.healthcare[0])].join("=")
      : undefined,
  ]
    .filter((component) => !!component)
    .join("&");
}

export function getAreaFromQueryString() {
  const paramList = [...params];
  const primary = paramList.find(
    ([key]) =>
      key === "overview" ||
      key === "nation" ||
      key === "region" ||
      key === "utla" ||
      key === "ltla"
  ) || ["", ""];
  const healthcare = paramList.find(
    ([key]) => key === "nation" || key === "nhsRegion" || key === "nhsTrust"
  ) || [...primary];
  if (healthcare[0] === "region") {
    healthcare[0] = "nhsRegion";
  }
  return {
    primary: [decodeURIComponent(primary[1]), primary[0]],
    healthcare: [decodeURIComponent(healthcare[1]), healthcare[0]],
  };
}
