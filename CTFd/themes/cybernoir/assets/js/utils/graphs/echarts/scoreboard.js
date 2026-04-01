import { colorHash } from "@ctfdio/ctfd-js/ui";
import { mergeObjects } from "../../objects";
import { cumulativeSum } from "../../math";
import dayjs from "dayjs";

export function getOption(mode, places, optionMerge) {
  // Cybernoir theme colors
  const textColor = "#e0e0ff";
  const mutedColor = "#8888aa";
  const cyanColor = "#00fff5";

  let option = {
    title: {
      left: "center",
      text: "Top 10 " + (mode === "teams" ? "Teams" : "Users"),
      textStyle: {
        color: cyanColor,
        fontFamily: "Orbitron, Rajdhani, sans-serif",
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      backgroundColor: "rgba(18, 18, 26, 0.95)",
      borderColor: cyanColor,
      textStyle: {
        color: textColor,
      },
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      align: "left",
      bottom: 35,
      data: [],
      textStyle: {
        color: textColor,
        fontFamily: "Rajdhani, sans-serif",
        fontSize: 14,
      },
      pageTextStyle: {
        color: textColor,
      },
      pageIconColor: cyanColor,
      pageIconInactiveColor: mutedColor,
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
        saveAsImage: {},
      },
      iconStyle: {
        borderColor: mutedColor,
      },
    },
    grid: {
      containLabel: true,
    },
    xAxis: [
      {
        type: "time",
        boundaryGap: false,
        data: [],
        axisLabel: {
          color: mutedColor,
        },
        axisLine: {
          lineStyle: {
            color: mutedColor,
          },
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLabel: {
          color: mutedColor,
        },
        axisLine: {
          lineStyle: {
            color: mutedColor,
          },
        },
        splitLine: {
          lineStyle: {
            color: "rgba(42, 42, 58, 0.5)",
          },
        },
      },
    ],
    dataZoom: [
      {
        id: "dataZoomX",
        type: "slider",
        xAxisIndex: [0],
        filterMode: "filter",
        height: 20,
        top: 35,
        fillerColor: "rgba(0, 255, 245, 0.2)",
        borderColor: "rgba(42, 42, 58, 0.8)",
        handleStyle: {
          color: cyanColor,
        },
        textStyle: {
          color: textColor,
        },
        dataBackground: {
          lineStyle: {
            color: mutedColor,
          },
          areaStyle: {
            color: "rgba(0, 255, 245, 0.1)",
          },
        },
      },
    ],
    series: [],
  };

  const teams = Object.keys(places);
  for (let i = 0; i < teams.length; i++) {
    const team_score = [];
    const times = [];
    for (let j = 0; j < places[teams[i]]["solves"].length; j++) {
      team_score.push(places[teams[i]]["solves"][j].value);
      const date = dayjs(places[teams[i]]["solves"][j].date);
      times.push(date.toDate());
    }

    const total_scores = cumulativeSum(team_score);
    let scores = times.map(function (e, i) {
      return [e, total_scores[i]];
    });

    option.legend.data.push(places[teams[i]]["name"]);

    const data = {
      name: places[teams[i]]["name"],
      type: "line",
      label: {
        normal: {
          position: "top",
        },
      },
      itemStyle: {
        normal: {
          color: colorHash(places[teams[i]]["name"] + places[teams[i]]["id"]),
        },
      },
      data: scores,
    };
    option.series.push(data);
  }

  if (optionMerge) {
    option = mergeObjects(option, optionMerge);
  }
  return option;
}
