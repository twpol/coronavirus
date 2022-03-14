import { getDateObjectForIndex, RECENT_DAY, RECENT_DAYS } from "./data.mjs";

// Graph colours: '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'
const chart = {
  type: "scatter",
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
  if (!Array.isArray(data)) {
    data = [data];
  }

  const estId = "est" + id[0].toUpperCase() + id.substr(1);

  const graphs = data.map((data) => {
    const estimated =
      isNaN(data[id][RECENT_DAY]) &&
      estId in data &&
      !isNaN(data[estId][RECENT_DAY]);
    const field = estimated ? estId : id;

    const graph = {
      ...chart,
      name: data.name,
      x: data.date,
      y: data[field],
    };
    graph.line = {
      dash: field === estId ? "dash" : "solid",
    };
    return graph;
  });

  if (document.getElementById("graph-" + id)) {
    Plotly.newPlot(
      "graph-" + id,
      graphs,
      {
        ...layout,
        xaxis: {
          range: [
            getDateObjectForIndex(data[0], RECENT_DAYS),
            getDateObjectForIndex(data[0], 0),
          ],
          autorange: false,
        },
        yaxis: {
          range: [
            0,
            max(
              graphs.map((graph) =>
                graph.y
                  .slice(0, RECENT_DAYS)
                  .filter((v) => !isNaN(v))
                  .reduce((a, b) => Math.max(a, b), 0)
              )
            ),
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

function max(list) {
  return list.reduce((a, b) => Math.max(a, b), Number.MIN_VALUE);
}
