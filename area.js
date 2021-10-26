const RECENT_DAYS = 180;
const UNSTABLE_DAYS_CASES = 4;
const UNSTABLE_DAYS_DEATHS = 4;
const ROLLING_DAYS = 7;

const params = location.search.substring(1).split("&");
const area = (
  params.find(
    (p) =>
      p.startsWith("nation=") ||
      p.startsWith("region=") ||
      p.startsWith("utla") ||
      p.startsWith("ltla")
  ) || "overview="
).split("=");
const areaNHS = (
  params.find(
    (p) =>
      p.startsWith("nation=") ||
      p.startsWith("nhsRegion=") ||
      p.startsWith("nhsTrust=")
  ) || area.join("=").replace("region=", "nhsRegion=")
).split("=");

const layout = {
  margin: {
    l: 40,
    r: 40,
    t: 20,
    b: 40,
  },
  showlegend: false,
  yaxis: {
    rangemode: "tozero",
  },
};

function getRecent(rows, days) {
  const minDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .substring(0, 10);
  return rows.filter(function (row) {
    return row.date >= minDate;
  });
}

function unpack(rows, key) {
  return rows.map(function (row) {
    return String(row[key]).replace(/ [0-9:.]{8,} [+-][0-9]{4}$/, "");
  });
}

// Graph colours: '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'

function chart(rows, x, y, extra) {
  return Object.assign(
    {
      type: "scatter",
      marker: {
        color: "rgba(68, 114, 196, 1)",
      },
      x: unpack(rows, x),
      y: unpack(rows, y),
    },
    extra
  );
}

function scale(trace, factor) {
  for (let i = 0; i < trace.y.length; i++) {
    trace.y[i] = trace.y[i] * factor;
  }
  return trace;
}

function smooth(trace, count) {
  if (count < 1) {
    return trace;
  }
  const removeLeft = Math.floor(count / 2);
  const removeRight = count - removeLeft;
  trace.x.splice(0, removeLeft);
  trace.x.splice(trace.x.length - removeRight, removeRight);
  trace.y = trace.y.slice(count).map(function (value, index) {
    return (
      trace.y.slice(index, index + count).reduce(function (sum, value) {
        return sum + Number(value);
      }, 0) / count
    );
  });
  return trace;
}

function plusMinus(number) {
  const text = String(number);
  return number >= 0 ? "+" + text : text;
}

function setText(selector, text) {
  setProp(selector, "innerText", text);
}

function setChangeBackground(selector, change) {
  if (change > 0) {
    setStyleProp(
      selector,
      "background-color",
      "rgba(100%, 0%, 0%, " + Math.min(100, change) + "%)"
    );
  } else {
    setStyleProp(
      selector,
      "background-color",
      "rgba(0%, 100%, 0%, " + Math.min(100, -change) + "%)"
    );
  }
  setStyleProp(selector, "color", "black");
}

function setData(selector, name, value) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.warn("setData: No elements matched " + selector);
  }
  for (const element of elements) {
    element.dataset[name] = value;
  }
}

function setProp(selector, name, value) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.warn("setProp: No elements matched " + selector);
  }
  for (const element of elements) {
    element[name] = value;
  }
}

function setStyleProp(selector, name, value) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.warn("setStyleProp: No elements matched " + selector);
  }
  for (const element of elements) {
    element.style[name] = value;
  }
}

function load(filters, fields, callback) {
  Plotly.d3.json(
    "https://api.coronavirus.data.gov.uk/v1/data?filters=" +
      filters +
      "&structure=[" +
      fields.map((name) => "%22" + name + "%22").join(",") +
      "]",
    function (error, res) {
      const recent = getRecent(res.data, RECENT_DAYS);
      callback(recent);
    }
  );
}

const TYPES = ["count", "instant", "rollingSum", "rollingRate"];

function plot({ id, data, field, type, population, flip }) {
  if (!id) throw new Error("Must specify id");
  if (!data) throw new Error("Must specify data");
  if (!field) throw new Error("Must specify field");
  type = type || "count";
  if (!TYPES.includes(type))
    throw new Error("Must specify valid type: " + TYPES.join(", "));

  const rate = population ? 100000 / population : 1;
  const factor =
    type === "count" ? ROLLING_DAYS * rate : type !== "rollingRate" ? rate : 1;
  const smoothing = type.includes("rolling") ? 1 : ROLLING_DAYS;

  const graph = smooth(scale(chart(data, "date", field), factor), smoothing);
  const numbers = graph.y
    .slice(0, ROLLING_DAYS * 2)
    .filter((num) => !isNaN(num));

  if (numbers.length) {
    setText(
      "#summary-" + id + "-sum > span",
      (numbers[0] / rate).toLocaleString(undefined, {
        minimumSignificantDigits: 3,
        maximumSignificantDigits: 3,
      })
    );
    setText(
      "#summary-" + id + "-rate > span",
      numbers[0].toLocaleString(undefined, {
        minimumSignificantDigits: 3,
        maximumSignificantDigits: 3,
      })
    );
    setText(
      "#summary-" + id + "-change > span",
      plusMinus(
        (numbers[0] - numbers[ROLLING_DAYS]).toLocaleString(undefined, {
          minimumSignificantDigits: 2,
          maximumSignificantDigits: 2,
        })
      )
    );
    setData(
      "#summary-" + id + "-change > span",
      "percentChange",
      plusMinus(
        ((100 * numbers[0]) / numbers[ROLLING_DAYS] - 100).toLocaleString(
          undefined,
          {
            minimumSignificantDigits: 2,
            maximumSignificantDigits: 2,
          }
        )
      )
    );
    setChangeBackground(
      "#summary-" + id + "-change",
      (flip ? -200 : 200) * (numbers[0] / numbers[ROLLING_DAYS] - 1)
    );
  }

  if (document.getElementById("graph-" + id)) {
    Plotly.newPlot("graph-" + id, [graph], layout);
  }
}

load(
  "areaType=" + area[0] + (area[1] ? ";areaName=" + area[1] : ""),
  [
    "newCasesBySpecimenDate",
    "newCasesBySpecimenDateRollingSum",
    "newCasesBySpecimenDateRollingRate",
    "uniqueCasePositivityBySpecimenDateRollingSum",
    "cumPeopleVaccinatedCompleteByVaccinationDate",
    "uniquePeopleTestedBySpecimenDateRollingSum",
    "newVirusTests",
    "newDeaths28DaysByDeathDate",
  ],
  function (data) {
    setText("#name-area", data[0].areaName);
    setText("#date-area", data[0].date);
    setText("h1", document.title + " for " + data[0].areaName);
    document.title = [data[0].areaName, document.title].join(" - ");

    const veryRecent = data.slice(0, ROLLING_DAYS * 4);

    const exampleSum = unpack(veryRecent, "newCasesBySpecimenDateRollingSum")[
      ROLLING_DAYS
    ];
    const exampleRate = unpack(veryRecent, "newCasesBySpecimenDateRollingRate")[
      ROLLING_DAYS
    ];
    const population = Math.round((100000 * exampleSum) / exampleRate);

    setText("#summary-population", population.toLocaleString());

    plot({
      id: "cases",
      data: data.slice(UNSTABLE_DAYS_CASES),
      field: "newCasesBySpecimenDate",
      population,
    });
    plot({
      id: "positivity",
      data,
      field: "uniqueCasePositivityBySpecimenDateRollingSum",
      type: "instant",
    });
    if (data[ROLLING_DAYS].newVirusTests) {
      plot({
        id: "tests",
        data,
        field: "newVirusTests",
        population,
        flip: true,
      });
      document.getElementById("summary-tests").after("¹");
    } else {
      plot({
        id: "tests",
        data,
        field: "uniquePeopleTestedBySpecimenDateRollingSum",
        type: "rollingSum",
        population,
        flip: true,
      });
      document.getElementById("summary-tests").after("²");
    }
    plot({
      id: "vaccinated",
      data,
      field: "cumPeopleVaccinatedCompleteByVaccinationDate",
      type: "rollingSum",
      population,
    });
    plot({
      id: "deaths",
      data: data.slice(UNSTABLE_DAYS_DEATHS),
      field: "newDeaths28DaysByDeathDate",
      population,
    });

    load(
      "areaType=" + areaNHS[0] + (areaNHS[1] ? ";areaName=" + areaNHS[1] : ""),
      ["newAdmissions", "hospitalCases"],
      function (data) {
        setText("#name-nhs-area", data[0].areaName);
        setText("#date-nhs-area", data[0].date);
        plot({
          id: "admissions",
          data,
          field: "newAdmissions",
          population,
        });
        plot({
          id: "patients",
          data,
          field: "hospitalCases",
          type: "instant",
          population,
        });
      }
    );
  }
);
