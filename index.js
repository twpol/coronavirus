const API_PROXY = "https://james-ross.co.uk/temp/proxy?cache=86400&url=";
const API_BASE = "https://coronavirus.data.gov.uk/api/generic/";

const AREA_TYPES_PRIMARY = ["ltla", "utla", "region", "nation", "overview"];
const AREA_TYPES_HEALTHCARE = ["nhsTrust", "nhsRegion", "nation", "overview"];

const e = {
  area: {
    primary: {
      list: document.getElementById("area-primary-datalist"),
      input: document.getElementById("area-primary-input"),
    },
    healthcare: {
      list: document.getElementById("area-healthcare-datalist"),
      input: document.getElementById("area-healthcare-input"),
    },
    postcode: {
      input: document.getElementById("area-postcode-input"),
      submit: document.getElementById("area-postcode-submit"),
    },
    submit: document.getElementById("area-submit"),
  },
};

function fetchApi(path, options) {
  return fetch(API_PROXY + encodeURIComponent(API_BASE + path), options);
}

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

async function getSmallestArea(type, code) {
  const data = await (await fetchApi(`code/${type}/${code}`)).json();
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

function getAreaQueryString(area) {
  return [
    [area.primary[1], area.primary[0]].join("="),
    area.primary[0] !== area.healthcare[0]
      ? [area.healthcare[1], area.healthcare[0]].join("=")
      : undefined,
  ].join("&");
}

async function getAreas(areaType) {
  return (await (await fetchApi(`area/${areaType}`)).json()).map((area) => ({
    areaType,
    ...area,
  }));
}

setTimeout(load);
