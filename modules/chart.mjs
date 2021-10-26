import { setChangeBackground, setData, setText } from "./elements.mjs";

const ROLLING_DAYS = 7;
const RECENT_DAYS = 180;

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

export function plot(id, data, { flip } = {}) {
  const graph = chart(data, "date", id);
  const numbers = graph.y
    .slice(0, ROLLING_DAYS * 3)
    .filter((num) => !isNaN(num));

  if (numbers.length && numbers[0]) {
    setText(
      "#summary-" + id + "-sum > span",
      ((numbers[0] * data.population) / 100000).toLocaleString(undefined, {
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

// Graph colours: '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'

function chart(data, x, y, extra) {
  return Object.assign(
    {
      type: "scatter",
      marker: {
        color: "rgba(68, 114, 196, 1)",
      },
      x: data[x].slice(0, RECENT_DAYS),
      y: data[y].slice(0, RECENT_DAYS),
    },
    extra
  );
}

function plusMinus(number) {
  const text = String(number);
  return number >= 0 ? "+" + text : text;
}
