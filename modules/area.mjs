import { fetchGenericApi } from "./api.mjs";

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
    [area.primary[1], area.primary[0]].join("="),
    area.primary[0] !== area.healthcare[0]
      ? [area.healthcare[1], area.healthcare[0]].join("=")
      : undefined,
  ]
    .filter((component) => !!component)
    .join("&");
}

export function getAreaFromQueryString() {
  const params = location.search.substring(1).split("&");
  const primary = (
    params.find(
      (p) =>
        p.startsWith("overview=") ||
        p.startsWith("nation=") ||
        p.startsWith("region=") ||
        p.startsWith("utla=") ||
        p.startsWith("ltla=")
    ) || "="
  ).split("=");
  const healthcare = (
    params.find(
      (p) =>
        p.startsWith("nation=") ||
        p.startsWith("nhsRegion=") ||
        p.startsWith("nhsTrust=")
    ) || primary.join("=").replace("region=", "nhsRegion=")
  ).split("=");
  return {
    primary: [decodeURIComponent(primary[1]), primary[0]],
    healthcare: [decodeURIComponent(healthcare[1]), healthcare[0]],
  };
}
