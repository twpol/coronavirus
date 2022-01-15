import { getDateObjectForIndex, RECENT_DAY, RECENT_DAYS } from "./data.mjs";

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
  const graph = chart(data, "date", id);
  const hasData = !isNaN(graph.y[RECENT_DAY]);

  if (!hasData) {
    const estId = "est" + id[0].toUpperCase() + id.substr(1);
    if (estId in data) {
      const estGraph = chart(data, "date", estId);
      graph.line.dash = "dash";
      graph.y = estGraph.y;
    }
  }

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
            data[id]
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

// Graph colours: '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'

function chart(data, x, y, extra) {
  return Object.assign(
    {
      type: "scatter",
      line: {
        color: "rgba(68, 114, 196, 1)",
      },
      x: data[x],
      y: data[y],
    },
    extra
  );
}
