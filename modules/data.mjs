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
    "newVirusTestsByPublishDate",
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
    name: "tests",
    field: "newVirusTestsByPublishDate",
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
  output.fields = Object.create(null);

  const exampleSum = data.newCasesBySpecimenDateRollingSum[ROLLING_DAYS];
  const exampleRate = data.newCasesBySpecimenDateRollingRate[ROLLING_DAYS];
  output.population = Math.round((100000 * exampleSum) / exampleRate);

  for (const field of OUTPUT_FIELDS) {
    if (output[field.name] && output[field.name].length) {
      continue;
    }
    const values = [...data[field.field]];
    if (field.ignore > 0) {
      values.splice(0, field.ignore, ...NaNs(field.ignore));
    }
    if (values[2 * ROLLING_DAYS]) {
      output[field.name] = (field.type || noop)(values, output.population);
      output.fields[field.name] = field.field;
    } else {
      output[field.name] = [];
    }
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

const DAY_MS = 24 * 60 * 60 * 1000;
const MIDNIGHT_UTC = "T00:00:00Z";

export function getIndexForDate(data, date) {
  const date0 = new Date(data.date[0] + MIDNIGHT_UTC);
  const date1 = new Date(date + MIDNIGHT_UTC);
  return (date0 - date1) / DAY_MS;
}

export function getDateForIndex(data, index) {
  const date = new Date(
    Date.parse(data.date[0] + MIDNIGHT_UTC) - DAY_MS * index
  );
  return date.toISOString().substring(0, 10);
}

export function getRowByIndex(data, index) {
  const row = getRowObject(data, index);
  row.extrapolated = Object.create(null);
  for (const field of OUTPUT_FIELDS.map((field) => field.name)) {
    if (field in data.fields && !row[field]) {
      const extIndex = data[field].findIndex((value) => !!value);
      row[field] = Math.max(
        0,
        data[field][extIndex] +
          ((data[field][extIndex] - data[field][extIndex + 7]) *
            (extIndex - index)) /
            ROLLING_DAYS
      );
      row.extrapolated[field] = true;
    }
  }
  if (!row.date) {
    row.date = getDateForIndex(data, index);
  }
  return row;
}

function getRowObject(data, index) {
  const row = Object.create(null);
  for (const prop of Object.keys(data)) {
    row[prop] = Array.isArray(data[prop]) ? data[prop][index] : data[prop];
  }
  return row;
}
