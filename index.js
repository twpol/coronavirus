const API_PROXY = "https://james-ross.co.uk/temp/proxy?cache=900&url=";
const API_BASE = "https://coronavirus.data.gov.uk/api/generic/";

const AREA_TYPES_PRIMARY = ["ltla", "utla", "region", "nation", "overview"];
const AREA_TYPES_HEALTHCARE = ["nhsTrust", "nhsRegion", "nation", "overview"];

function fetchApi(path, options) {
  return fetch(API_PROXY + encodeURIComponent(API_BASE + path), options);
}

async function load() {
  const areas = [
    { areaType: "overview", areaCode: "K02000001", areaName: "United Kingdom" },
    ...(await getAreas("region")),
    ...(await getAreas("nation")),
    ...(await getAreas("utla")),
    ...(await getAreas("ltla")),
  ];

  const input = document.getElementById("area-input");
  input.addEventListener("change", areaChange);

  const datalist = document.getElementById("area-datalist");
  for (const area of areas) {
    const option = document.createElement("option");
    option.setAttribute(
      "value",
      `${area.areaName} / ${area.areaType} / ${area.areaCode}`
    );
    datalist.append(option);
  }
}

async function areaChange(event) {
  if (!event.target.value) return;
  const area = event.target.value.split(" / ");
  const code = await (await fetchApi(`code/${area[1]}/${area[2]}`)).json();
  const primaryAreaType = AREA_TYPES_PRIMARY.find((a) => code[a]);
  const healthcareAreaType = AREA_TYPES_HEALTHCARE.find((a) => code[a]);
  const link =
    `area${
      location.hostname === "localhost" ? ".html" : ""
    }?${primaryAreaType}=${code[primaryAreaType + "Name"]}` +
    (healthcareAreaType &&
    code[primaryAreaType + "Name"] !== code[healthcareAreaType + "Name"]
      ? `&${healthcareAreaType}=${code[healthcareAreaType + "Name"]}`
      : "");
  location.href = link;
}

async function getAreas(areaType) {
  return (await (await fetchApi(`area/${areaType}`)).json()).map((area) => ({
    areaType,
    ...area,
  }));
}

setTimeout(load);
