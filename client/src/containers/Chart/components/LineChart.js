import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Line } from "react-chartjs-2";
import { Header } from "semantic-ui-react";
import uuid from "uuid/v4";

function LineChart(props) {
  const {
    chart, redraw, redrawComplete, height
  } = props;

  useEffect(() => {
    if (redraw) {
      setTimeout(() => {
        redrawComplete();
      }, 1000);
    }
  }, [redraw]);

  return (
    <>
      {chart.mode === "kpi"
        && (
          <div>
            {chart.chartData
              && chart.chartData.data
              && chart.chartData.data.datasets && (
                <div style={styles.kpiContainer(chart.chartSize)}>
                  {chart.chartData.data.datasets.map((dataset, index) => (
                    <Header
                      as="h1"
                      size="massive"
                      style={styles.kpiItem(
                        chart.chartSize,
                        chart.chartData.data.datasets.length,
                        index
                      )}
                      key={uuid()}
                    >
                      {dataset.data && dataset.data[dataset.data.length - 1]}
                      <Header.Subheader style={{ color: "black" }}>
                        <span
                          style={
                            chart.Datasets
                            && styles.datasetLabelColor(chart.Datasets[index].datasetColor)
                          }
                        >
                          {dataset.label}
                        </span>
                      </Header.Subheader>
                    </Header>
                  ))}
                </div>
            )}
          </div>
        )}
      <div className={chart.mode === "kpi" && "chart-kpi"}>
        <Line
          data={chart.chartData.data}
          options={chart.chartData.options}
          height={height}
          redraw={redraw}
        />
      </div>
    </>
  );
}

const styles = {
  kpiContainer: (size) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: size === 1 ? "column" : "row",
  }),
  kpiItem: (size, items, index) => ({
    fontSize: size === 1 ? "2.5em" : "4em",
    textAlign: "center",
    margin: 0,
    marginBottom: size === 1 && index < items - 1 ? (50 - items * 10) : 0,
    marginRight: items > 1 && index < items - 1 && size > 1 ? 50 : 0,
  }),
  datasetLabelColor: (color) => ({
    borderBottom: `solid 3px ${color}`,
  }),
};

LineChart.defaultProps = {
  redraw: false,
  redrawComplete: () => {},
  height: 300,
};

LineChart.propTypes = {
  chart: PropTypes.object.isRequired,
  redraw: PropTypes.bool,
  redrawComplete: PropTypes.func,
  height: PropTypes.number,
};

export default LineChart;
