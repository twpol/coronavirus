import { fetchDataApi } from "./api.mjs";

const INPUT_FIELDS = {
  primary: [
    "newCasesBySpecimenDate",
    "newCasesBySpecimenDateRollingSum",
    "newCasesBySpecimenDateRollingRate",
    "uniqueCasePositivityBySpecimenDateRollingSum",
    "cumPeopleVaccinatedCompleteByVaccinationDate",
    "newDeaths28DaysByDeathDate",
    "uniquePeopleTestedBySpecimenDateRollingSum",
    "newVirusTests",
  ],
  healthcare: ["newAdmissions", "hospitalCases"],
};

const OUTPUT_FIELDS = [
  {
    name: "cases",
    field: "newCasesBySpecimenDate",
    ignore: 5,
    type: rollingRate,
  },
  {
    name: "positivity",
    field: "uniqueCasePositivityBySpecimenDateRollingSum",
    type: rolling,
  },
  {
    name: "vaccinated",
    field: "cumPeopleVaccinatedCompleteByVaccinationDate",
    type: rate,
  },
  {
    name: "admissions",
    field: "newAdmissions",
    type: rollingRate,
  },
  {
    name: "patients",
    field: "hospitalCases",
    type: rate,
  },
  {
    name: "deaths",
    field: "newDeaths28DaysByDeathDate",
    ignore: 5,
    type: rollingRate,
  },
  {
    name: "tests",
    field: "uniquePeopleTestedBySpecimenDateRollingSum",
    type: rate,
  },
  {
    name: "tests2",
    field: "newVirusTests",
    type: rollingRate,
  },
];

const ROLLING_DAYS = 7;

export async function loadAreaData(area) {
  const data = mergeData(
    await loadData(area.primary, INPUT_FIELDS.primary),
    await loadData(area.healthcare, INPUT_FIELDS.healthcare)
  );

  const output = Object.create(null);
  output.date = [...data.date];

  const exampleSum = data.newCasesBySpecimenDateRollingSum[ROLLING_DAYS];
  const exampleRate = data.newCasesBySpecimenDateRollingRate[ROLLING_DAYS];
  output.population = Math.round((100000 * exampleSum) / exampleRate);

  for (const field of OUTPUT_FIELDS) {
    const values = [...data[field.field]];
    if (field.ignore > 0) {
      values.splice(0, field.ignore, ...NaNs(field.ignore));
    }
    output[field.name] = (field.type || noop)(values, output.population);
  }

  return output;
}

async function loadData(code, fields) {
  const data = (
    await fetchDataApi(
      "?filters=areaType=" +
        code[1] +
        (code[0] ? ";areaName=" + code[0] : "") +
        "&structure=[" +
        fields.map((name) => "%22" + name + "%22").join(",") +
        "]"
    )
  ).data;
  const rv = {};
  for (const field of ["date", ...fields]) {
    rv[field] = data.map((item) =>
      typeof item[field] === "number" || typeof item[field] === "string"
        ? item[field]
        : NaN
    );
  }
  return rv;
}

function mergeData(...sources) {
  const date = sources.map((source) => source.date[0]).sort()[0];
  const maxOffset = sources
    .map((source) => source.date.indexOf(date))
    .sort()
    .reverse()[0];
  const output = Object.create(null);
  for (const source of sources) {
    const offset = source.date.indexOf(date);
    for (const prop of Object.keys(source)) {
      if (!(prop in output)) {
        output[prop] = [...NaNs(maxOffset - offset), ...source[prop]];
      }
    }
    output.date.splice(maxOffset - offset, source.date.length, ...source.date);
  }
  return output;
}

function noop(data) {
  return [...data];
}

function rate(data, population) {
  return data.map((datum) => (datum * 100000) / population);
}

function rollingRate(data, population) {
  return rollingSum(rate(data, population));
}

function rollingSum(data) {
  const half = (ROLLING_DAYS - 1) / 2;
  return [
    ...NaNs(half),
    ...data.slice(ROLLING_DAYS).map((_, index) => {
      return data
        .slice(index, index + ROLLING_DAYS)
        .reduce(function (sum, value) {
          return sum + value;
        }, 0);
    }),
    ...NaNs(half),
  ];
}

function rolling(data) {
  return scale(rollingSum(data), 1 / ROLLING_DAYS);
}

function scale(data, scale) {
  return data.map((datum) => datum * scale);
}

function NaNs(count) {
  return Array.from(new Array(count)).map(() => NaN);
}
