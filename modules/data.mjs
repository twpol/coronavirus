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
    ignore: 4,
    type: fieldTypeDelta,
  },
  {
    name: "positivity",
    field: "uniqueCasePositivityBySpecimenDateRollingSum",
    type: fieldTypeRollingRate,
  },
  {
    name: "vaccinated",
    field: "cumPeopleVaccinatedCompleteByVaccinationDate",
    ignore: 2,
    type: fieldTypeAbsolute,
  },
  {
    name: "admissions",
    field: "newAdmissions",
    type: fieldTypeDelta,
  },
  {
    name: "patients",
    field: "hospitalCases",
    type: fieldTypeAbsolute,
  },
  {
    name: "deaths",
    field: "newDeaths28DaysByDeathDate",
    ignore: 4,
    type: fieldTypeDelta,
  },
  {
    name: "tests",
    field: "uniquePeopleTestedBySpecimenDateRollingSum",
    type: fieldTypeRollingSum,
  },
  {
    name: "tests",
    field: "newVirusTestsByPublishDate",
    type: fieldTypeDelta,
  },
  {
    name: "estPositivity",
    field: "newCasesBySpecimenDate",
    type: fieldTypeEstimatedPositivity,
  },
];

export const ROLLING_DAYS = 7;

export const RECENT_DAY = 4 * ROLLING_DAYS;

export const RECENT_DAYS = 26 * ROLLING_DAYS;

export async function loadAreaData(area) {
  const data = mergeData(
    await loadData(area.primary, INPUT_FIELDS.primary),
    await loadData(area.healthcare, INPUT_FIELDS.healthcare)
  );

  const output = Object.create(null);
  output.date = [...data.date];
  output.fields = Object.create(null);

  const exampleSum = data.newCasesBySpecimenDateRollingSum[RECENT_DAY];
  const exampleRate = data.newCasesBySpecimenDateRollingRate[RECENT_DAY];
  output.population = Math.round((100000 * exampleSum) / exampleRate);

  let latestIndex = RECENT_DAYS;
  for (const field of OUTPUT_FIELDS) {
    if (output[field.name] && output[field.name].length) {
      continue;
    }
    const values = [...data[field.field]];
    if (field.ignore > 0) {
      const skip = field.ignore + values.findIndex((item) => !isNaN(item));
      values.splice(0, skip, ...NaNs(skip));
    }
    if (values[RECENT_DAY]) {
      output[field.name] = field.type(values, output);
      output.fields[field.name] = field.field;
      latestIndex = Math.min(
        latestIndex,
        output[field.name].findIndex((value) => !isNaN(value))
      );
    } else {
      output[field.name] = [];
    }
  }
  output.latestDate = output.date[latestIndex];

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
  const output = Object.create(null);
  for (const source of sources) {
    const offset = -getIndexForDate(source, getISODate(new Date()));
    for (const prop of Object.keys(source)) {
      if (!(prop in output)) {
        output[prop] = [...NaNs(offset), ...source[prop]];
        if (prop === "date" && offset > 0) {
          for (let i = 0; i < offset; i++) {
            output[prop][i] = getDateForIndex(source, i - offset);
          }
        }
      }
    }
  }
  return output;
}

function fieldTypeEstimatedPositivity(_data, output) {
  return output.cases.map(
    (cases, index) => (100 * cases) / output.tests[index]
  );
}

function fieldTypeAbsolute(data, output) {
  return shift(rate(data, output.population));
}

function fieldTypeDelta(data, output) {
  return shift(rate(rollingSum(data), output.population));
}

function fieldTypeRollingSum(data, output) {
  return shift(rate(data, output.population));
}

function fieldTypeRollingRate(data) {
  return shift(data);
}

function rollingSum(data) {
  return data.slice(ROLLING_DAYS).map((_, index) => {
    return data
      .slice(index, index + ROLLING_DAYS)
      .reduce(function (sum, value) {
        return sum + value;
      }, 0);
  });
}

function shift(data) {
  const half = (ROLLING_DAYS - 1) / 2;
  return [...NaNs(half), ...data];
}

function rate(data, population) {
  return scale(data, 100000 / population);
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
  return getISODate(date);
}

function getISODate(date) {
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
          ((data[field][extIndex] - data[field][extIndex + ROLLING_DAYS]) *
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
