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

export function plot(id, data) {
  const graph = chart(data, "date", id);
  const numbers = graph.y
    .slice(0, ROLLING_DAYS * 3)
    .filter((num) => !isNaN(num));

  if (!numbers.length || !numbers[0]) {
    const estId = "est" + id[0].toUpperCase() + id.substr(1);
    if (estId in data) {
      const estGraph = chart(data, "date", estId);
      graph.line.dash = "dash";
      graph.y = estGraph.y;
    }
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
      line: {
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
