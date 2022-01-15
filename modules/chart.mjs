import { getDateObjectForIndex, RECENT_DAY, RECENT_DAYS } from "./data.mjs";

// Graph colours: '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'
const chart = {
  type: "scatter",
  line: {
    color: "rgba(68, 114, 196, 1)",
  },
};
const layout = {
  margin: {
    l: 40,
    r: 40,
    t: 20,
    b: 40,
  },
  showlegend: false,
};

export function plot(id, data) {
  const estId = "est" + id[0].toUpperCase() + id.substr(1);
  const estimated =
    isNaN(data[id][RECENT_DAY]) &&
    estId in data &&
    !isNaN(data[estId][RECENT_DAY]);
  const field = estimated ? estId : id;

  const graph = {
    ...chart,
    x: data.date,
    y: data[field],
  };
  graph.line.dash = field === estId ? "dash" : "solid";

  if (document.getElementById("graph-" + id)) {
    Plotly.newPlot(
      "graph-" + id,
      [graph],
      {
        ...layout,
        xaxis: {
          range: [
            getDateObjectForIndex(data, RECENT_DAYS),
            getDateObjectForIndex(data, 0),
          ],
          autorange: false,
        },
        yaxis: {
          range: [
            0,
            graph.y
              .slice(0, RECENT_DAYS)
              .filter((v) => !isNaN(v))
              .reduce((a, b) => Math.max(a, b), 0),
          ],
          autorange: false,
        },
      },
      {
        responsive: true,
      }
    );
  }
}
