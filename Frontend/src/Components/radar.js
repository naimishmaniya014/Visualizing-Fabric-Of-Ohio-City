import { useEffect, useState, useContext } from "react";
import { EarningsAndVisitorsContext } from "../context";
import HelpModal from "./helpModal";
import ProgressBlock from "./progressBlock";

function Radar({ showHelpModal = false }) {
  const [svgDimention, setSvgDimention] = useState({
    width: null,
    height: null,
  });
  const [hideProgressBlock, setHideProgressBlock] = useState(false);

  const earningsAndVisitorContext = useContext(EarningsAndVisitorsContext);
  const originalData = earningsAndVisitorContext.visitorsAndEarnings;

  const d3 = window.d3;

  useEffect(() => {
    setHideProgressBlock(false);
    setTimeout(() => {
      calculateSVGDimentions();
    }, 1000);
  }, []);

  useEffect(() => {
    if (
      typeof svgDimention.width !== "number" ||
      typeof svgDimention.height !== "number" ||
      originalData.length === 0
    )
      return;
    const data = modifyData(originalData);
    drawRadarChart(data);
    setHideProgressBlock(true);
  }, [originalData, svgDimention]);

  function modifyData(rawJsonData) {
    const spendingValues = [];

    rawJsonData.forEach((item) => {
      const spending = item.spending;
      if (typeof spending === "string" && spending.startsWith("0.0")) {
        spendingValues.push(0);
      } else {
        spendingValues.push(parseFloat(spending));
      }
    });

    return spendingValues;
  }

  function calculateSVGDimentions() {
    const svg = d3.select("#radar_svg");
    if (svg.node() === null) return;
    const margin = 30;
    const dimentions = svg.node().parentNode.getBoundingClientRect();
    const parentHeight = dimentions.height - margin;
    const parentWidth = dimentions.width - margin;

    setSvgDimention({
      width: parentWidth,
      height: parentHeight,
    });
  }

  function drawRadarChart(data) {
    const numAxis = data.length;
    const angleSlice = (Math.PI * 2) / numAxis;
    const radius =
      (d3.min([svgDimention.width, svgDimention.height]) / 2) * 0.75;

    const svg = d3
      .select("#radar_svg")
      .attr("width", svgDimention.width)
      .attr("height", svgDimention.height);

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${svgDimention.width / 2},${svgDimention.height / 2})`
      );

    // Draw the axis
    const axis = g
      .selectAll(".axis")
      .data(d3.range(numAxis))
      .enter()
      .append("g")
      .attr("class", "axis");

    let tooltip = d3.select("#tooltip");
    if (tooltip.empty())
      tooltip = d3.select("body").append("div").attr("id", "tooltip");

    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "darkblue")
      .style("opacity", 0.3)
      .on("mouseover", function (e, i) {
        tooltip
          .style("opacity", 0)
          .style("background-color", "#00b0ff20")
          .style("border", "solid")
          .style("border-color", "#00b0ff")
          .style("border-width", "1px")
          .style("border-radius", "5px")
          .style("font-size", "18px")
          .style("padding", "8px")
          .style("position", "absolute");
        d3.select(this)
          .style("stroke", "darkblue")
          .style("stroke-width", "4px")
          .style("opacity", 0.5)
          .attr("stroke", "darkblue");
        const spending = data[i];
        const svgNodeDimentions = svg.node().getBoundingClientRect();
        tooltip
          .html(`Spending: ${d3.format(".2f")(spending)}`)
          .style("opacity", 1)
          .style("position", "absolute")
          .style(
            "left",
            svgNodeDimentions.left +
              svgDimention.width / 2 -
              tooltip.node().getBoundingClientRect().width / 2 +
              "px"
          )
          .style("top", svgNodeDimentions.top + svgDimention.height / 4 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .style("stroke", "darkblue")
          .style("stroke-width", "1px")
          .style("opacity", 0.3);
        tooltip.style("left", "-1000px").style("top", "-1000px");
        tooltip.style("opacity", 0);
      })
      .transition()
      .duration(3000)
      .attr("x1", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y1", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("x2", 0)
      .attr("y2", 0);
    // .attr("x1", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2)) // change the x2 and y2 attributes to animate the transition
    // .attr("y1", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2));

    axis
      .append("text")
      .attr("class", "legend")
      .style("font-size", "14px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", 0)
      .attr("y", 0)
      // .attr("x", (d, i) => radius * 1.105 * Math.cos(angleSlice * i - Math.PI / 2))
      // .attr("y", (d, i) => radius * 1.105 * Math.sin(angleSlice * i - Math.PI / 2))
      .text((d, i) => {
        const hour = (i + 8 + 12) % 24;
        if (hour === 12) {
          return `12:00 PM`;
        } else if (hour === 24) {
          return `12:00 AM`;
        } else if (hour > 12) {
          return `${hour - 12}:00 PM`;
        } else {
          return `${hour}:00 AM`;
        }
      })

      .transition() // add a transition
      .delay((d, i) => i * 80) // delay each transition by a multiple of 100ms
      .attr(
        "x",
        (d, i) => radius * 1.12 * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y",
        (d, i) => radius * 1.12 * Math.sin(angleSlice * i - Math.PI / 2)
      );

    const circle = svg
      .append("circle")
      .attr("cx", svgDimention.width / 2)
      .attr("cy", svgDimention.height / 2)
      .attr("r", radius)
      .style("fill", "none")
      .style("stroke", "black")
      .style("stroke-width", "4px")
      .style("opacity", 0.5);

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    // // console.log(minValue);
    // const radius = 200;

    const center = [svgDimention.width / 2, svgDimention.height / 2];
    const angleSlice2 = (Math.PI * 2) / data.length;

    const coords = data.map((d, i) => {
      const normalized = (d - minValue) / (maxValue - minValue);
      const r = normalized * radius;
      const angle = i * angleSlice2 - Math.PI / 2;
      return [center[0] + r * Math.cos(angle), center[1] + r * Math.sin(angle)];
    });

    const coordsClosed = [...coords, coords[0]];

    const path = svg
      .append("path")
      .datum(coordsClosed)
      .attr("d", d3.line())
      .style("fill", "#9c27b040")
      .style("stroke", "#9c27b0")
      .style("stroke-width", "1px")
      .style("opacity", 0.8)
      .on("mouseover", function () {
        d3.select(this)
          .style("stroke", "#9c27b0")
          .style("stroke-width", "2px")
          .style("opacity", 1.0);

        // const spending = data[i];
        // console.log(spending);
      })
      .on("mouseout", function () {
        d3.select(this)
          .style("stroke", "#9c27b0")
          .style("stroke-width", "1px")
          .style("opacity", 0.8);
      });

    // const tooltip = d3.select("body").append("div")
    // .attr("class", "tooltip")
    // .style("opacity", 0);

    // const points = svg.selectAll(".point")
    // .data(coords)
    // .enter()
    // .append("circle")
    // .attr("class", "point")
    // .attr("cx", d => d[0])
    // .attr("cy", d => d[1])
    // .attr("r", 5)
    // .style("fill", "red")
    // .on("mouseover", (d, i) => {
    //     tooltip.transition()
    //     .duration(200)
    //     .style("opacity", .9);
    //     tooltip.html(`Value: ${coordsClosed[i]}`)
    //     .style("left", (d3.event.pageX + 10) + "px")
    //     .style("top", (d3.event.pageY - 28) + "px");
    // })
    // .on("mouseout", (d) => {
    //     tooltip.transition()
    //     .duration(500)
    //     .style("opacity", 0);
    // });
  }

  const helpModalDescription = [
    "Radar graph is a graphical method of displaying multivariate data in the form of a two-dimensional chart of three or more quantitative variables represented on axes starting from the same point.",
    "Here, the data is represented in the form of a polygon with vertices corresponding to the variables.",
    "Each variable (Hour) is plotted on a separate axis that starts from the center of the graph.",
    "The polygon colored in pink represents the <span class='font-bold'>Spending</span> of that Business in that particular hour.",
    "Hover over the axis to see the total spending by selected business in that hour.",
  ];

  return (
    <>
      <svg
        id="radar_svg"
        width={svgDimention.width}
        height={svgDimention.height}
      ></svg>
      {showHelpModal === true && (
        <HelpModal
          title="About Radar Graph"
          descriptions={helpModalDescription}
        />
      )}
      <ProgressBlock color="primary" hide={hideProgressBlock} />
    </>
  );
}

export default Radar;
