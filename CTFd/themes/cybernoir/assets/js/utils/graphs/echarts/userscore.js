import { colorHash } from "@ctfdio/ctfd-js/ui";
import { cumulativeSum } from "../../math";
import { mergeObjects } from "../../objects";
import dayjs from "dayjs";

export function getOption(id, name, solves, awards, optionMerge) {
  // Cybernoir theme colors
  const textColor = "#e0e0ff";
  const mutedColor = "#8888aa";
  const cyanColor = "#00fff5";

  let option = {
    title: {
      left: "center",
      text: "Score over Time",
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
      bottom: 0,
      data: [name],
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

  const times = [];
  const scores = [];
  const total = solves.concat(awards);

  total.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  for (let i = 0; i < total.length; i++) {
    const date = dayjs(total[i].date);
    times.push(date.toDate());
    try {
      scores.push(total[i].challenge.value);
    } catch (e) {
      scores.push(total[i].value);
    }
  }

  // Create [time, score] pairs for time axis
  const totalScores = cumulativeSum(scores);
  const data = times.map((time, i) => [time, totalScores[i]]);

  option.series.push({
    name: name,
    type: "line",
    label: {
      normal: {
        position: "top",
      },
    },
    areaStyle: {
      normal: {
        color: colorHash(name + id),
        opacity: 0.3,
      },
    },
    itemStyle: {
      normal: {
        color: colorHash(name + id),
      },
    },
    lineStyle: {
      width: 2,
    },
    data: data,
  });

  if (optionMerge) {
    option = mergeObjects(option, optionMerge);
  }
  return option;
}
