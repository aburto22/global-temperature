const w = 850;
const h = 500;
const paddingX = 175;
const paddingTop = 50;
const paddingBottom = 175;

d3.select("#root")
  .append("div")
  .attr("id", "container")
  .append("h1")
  .attr("id", "title")
  .text("Earth global temperature");

d3.select("#container").append("h2").attr("id", "description");

const svg = d3
  .select("#container")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

fetch(
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
)
  .then((res) => res.json())
  .then((json) => {
    d3.select("#description").html(
      `Earth base temperature: ${json.baseTemperature}&deg; C`
    );

    const parseYear = d3.timeParse("%Y");
    const formatYear = d3.timeFormat("%Y");
    const parseMonth = d3.timeParse("%m");
    //const formatMonth = d3.timeFormat("%m");

    const data = json.monthlyVariance.map((obj) => ({
      ...obj,
      year: parseYear(obj.year),
      month: parseMonth(obj.month),
      temperature:
        Math.round((json.baseTemperature + obj.variance) * 100) / 100,
    }));

    //const [minT, maxT] = d3.extent(data.map((obj) => obj.temperature));
    const colorData = Array(8)
      .fill(0)
      .map((val, i, arr) => {
        const newVal = 1 + (i * (15 - 1)) / (arr.length - 1);
        return Math.round(newVal * 100) / 100;
      });

    const colorScale = d3
      .scaleLinear()
      .domain([1, 15])
      .range(["yellow", "red"]);

    function getColor(temp) {
      let approxTemp;

      colorData.forEach((val) => {
        if (temp >= val) approxTemp = val;
      });

      return colorScale(approxTemp);
    }

    const [minYear, maxYear] = d3.extent(data.map((obj) => obj.year));

    const xScale = d3
      .scaleTime()
      .domain([minYear, maxYear])
      .range([paddingX, w - paddingX]);

    const tileWidth = xScale(data[12].year) - xScale(data[0].year);

    const yScale = d3
      .scaleTime()
      .domain([parseMonth(1), parseMonth(12)])
      .range([paddingTop, h - paddingBottom]);

    const tileHeight = yScale(data[1].month) - yScale(data[0].month);

    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("width", tileWidth)
      .attr("height", tileHeight)
      .attr("x", (d) => xScale(d.year))
      .attr("y", (d) => yScale(d.month))
      .attr("class", "cell")
      .attr("data-year", (d, i) => {
        return d.year.getFullYear();
      })
      .attr("data-month", (d, i) => {
        return d.month.getMonth();
      })
      .attr("data-temp", (d) => d.temperature)
      .attr("fill", (d) => getColor(d.temperature))
      .on("mouseover", (e, d) => {
        const self = d3.select(e.target);
        self.attr("stroke", "black");

        const localData = [
          `Year: ${formatYear(d.year)}`,
          `Month: ${d3.timeFormat("%B")(d.month)}`,
          `Temp: ${d.temperature}&deg; C`,
        ];

        tooltip
          .style("opacity", 1)
          .attr("data-year", self.attr("data-year"))
          .selectAll("text")
          .data(localData)
          .html((d) => d);
      })
      .on("mouseout", (e, d) => {
        const self = d3.select(e.target);
        self.attr("stroke", "none");

        tooltip.style("opacity", 0).attr("data-year", "");
      });

    const xAxis = d3.axisBottom(xScale);

    svg
      .append("g")
      .attr("transform", `translate(0,${h - paddingBottom + tileHeight})`)
      .call(xAxis)
      .attr("id", "x-axis");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${w / 2}, ${h - paddingBottom + tileHeight + 40})`
      )
      .attr("font-weight", "bold")
      .text("Year");

    const yAxis = d3.axisLeft(yScale).tickFormat(d3.timeFormat("%B"));

    svg
      .append("g")
      .attr("transform", `translate(${paddingX}, ${tileHeight / 2})`)
      .call(yAxis)
      .attr("id", "y-axis");

    svg
      .select("#y-axis")
      .append("line")
      .attr("x1", 0)
      .attr("y1", yScale(parseMonth(12)))
      .attr("x2", 0)
      .attr("y2", yScale(parseMonth(12)) + tileHeight / 2)
      .attr("stroke", "black");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${paddingX - 70}, ${
          (h - paddingTop - paddingBottom) / 2 + paddingTop
        }), rotate(-90)`
      )
      .attr("font-weight", "bold")
      .text("Month");

    svg
      .select("#y-axis")
      .append("line")
      .attr("x1", 0)
      .attr("y1", yScale(parseMonth(1)) - tileHeight / 2)
      .attr("x2", 0)
      .attr("y2", yScale(parseMonth(1)))
      .attr("stroke", "black");

    const legendTotalWidth = 400;
    const legendScale = d3
      .scaleLinear()
      .domain([1, 15])
      .range([0, legendTotalWidth]);
    const legendWidth = legendScale(colorData[1]) - legendScale(colorData[0]);

    const legend = svg
      .append("g")
      .attr("object-anchor", "middle")
      .attr(
        "transform",
        `translate(${(w - legendTotalWidth) / 2}, ${h - paddingBottom + 75})`
      );

    legend
      .selectAll("rect")
      .data(colorData.slice(0, colorData.length - 1))
      .join("rect")
      .attr("x", (d, i) => legendScale(d))
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", 20)
      .attr("fill", (d) => colorScale(d));

    legend
      .selectAll("text")
      .data(colorData)
      .join("text")
      .html((d, i) => `${d}&deg; C`)
      .attr(
        "transform",
        (d, i) => `translate(${i * legendWidth}, 35), rotate(35)`
      )
      .attr("fill", "black");

    const tooltip = svg.append("g").attr("id", "tooltip").style("opacity", 0);

    tooltip
      .append("rect")
      .attr("width", 140)
      .attr("height", 66)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", "rgba(150, 150, 150, 0.85)");

    tooltip.append("text").attr("x", 10).attr("y", 20).attr("fill", "white");

    tooltip.append("text").attr("x", 10).attr("y", 37).attr("fill", "white");

    tooltip.append("text").attr("x", 10).attr("y", 54).attr("fill", "white");

    svg.on("mousemove", (e) => {
      const mouse = d3.pointer(e);
      tooltip.attr(
        "transform",
        `translate(${mouse[0] + 10}, ${mouse[1] - 30})`
      );
    });
  });