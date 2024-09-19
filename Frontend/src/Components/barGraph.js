import { useEffect, useState, useContext } from "react";
import { EarningsAndVisitorsContext } from "../context";
import HelpModal from "./helpModal";
import ProgressBlock from "./progressBlock";

function BarGraph({ showHelpModal = false }) {
  var margin = { top: 20, right: 30, bottom: 80, left: 30 };
  const d3 = window.d3;
  let x, y, svg, g;
  const [svgDimention, setSvgDimention] = useState({
    width: null,
    height: null,
  });
  const [hideProgressBlock, setHideProgressBlock] = useState(false);

  const earningsAndVisitorContext = useContext(EarningsAndVisitorsContext);
  const originalData = earningsAndVisitorContext.visitorsAndEarnings;

  useEffect(() => {
    calculateSVGDimentions();
  }, []);

  useEffect(() => {
    setHideProgressBlock(false);
    if (
      typeof svgDimention.width !== "number" ||
      typeof svgDimention.height !== "number" ||
      originalData.length === 0
    )
      return;
    const data = Object.entries(originalData).map(
      ([hour, { participants }]) => {
        let displayHour;
        if (hour == 0) {
          displayHour = "12 AM";
        } else if (hour > 12) {
          displayHour = (hour % 12) + " PM";
        } else if (hour < 12) {
          displayHour = hour + " AM";
        } else {
          displayHour = hour + " PM";
        }

        return {
          hour: displayHour,
          totalParticipants: participants.length,
        };
      }
    );
    svg = d3
      .select("#bargraph_svg")
      .attr("width", svgDimention.width)
      .attr("height", svgDimention.height);
    svg.selectAll("*").remove();
    drawLineGraph(data);
    drawBarGraph(data);
    setHideProgressBlock(true);
  }, [originalData, svgDimention]);

  function drawBarGraph(data) {
    let tooltip = d3.select("#tooltip");

    if (tooltip.empty())
      tooltip = d3.select("body").append("div").attr("id", "tooltip");

    x = d3
      .scaleBand()
      .domain(data.map(({ hour }) => hour))
      .range([margin.left, svgDimention.width - margin.right])
      .padding(0.1);

    y = d3
      .scaleLinear()
      .domain([
        0,
        Math.max(...data.map(({ totalParticipants }) => totalParticipants)),
      ])
      .range([svgDimention.height - margin.bottom, margin.top]);

    g = svg.select("g");

    g.append("text")
      .attr(
        "transform",
        `translate(${svgDimention.width / 2}, ${
          svgDimention.height - margin.bottom + 50
        })`
      )
      .attr("text-anchor", "middle")
      .text("Time (hour)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - svgDimention.height / 2.5)
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text("Total Customers");

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", ({ hour }) => {
        return x(hour);
      })
      .attr("y", ({ totalParticipants }) => y(totalParticipants))
      .attr("width", x.bandwidth())
      .attr(
        "height",
        ({ totalParticipants }) =>
          svgDimention.height - y(totalParticipants) - margin.bottom
      )
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 1)
      .attr("fill", "#69b3a220")
      .on("mouseover", function (e, d) {
        tooltip
          .style("opacity", 0)
          .style("background-color", "#00b0ff05")
          .style("border", "solid")
          .style("border-color", "#00b0ff")
          .style("border-width", "1px")
          .style("border-radius", "5px")
          .style("font-size", "14px")
          .style("padding", "8px")
          .style("position", "absolute");
        d3.select(this).attr("fill", "#69b3a2");
        tooltip
          .html(
            `Time: <I><B> ${d.hour}</B></I><br> Total Customers: <I><B> ${d.totalParticipants}</B></I>`
          )
          .style("opacity", 1)
          .style("position", "absolute")
          .style("left", `${e.clientX + 80}px`)
          .style("top", `${e.clientY + 80}px`);
      })
      .on("mousemove", function (e, d) {
        d3.select(this).attr("fill", "#69b3a220");
        tooltip
          .style("left", e.clientX + 20 + "px")
          .style("top", e.clientY + 20 + "px");
      })
      .on("mouseleave", function (e, d) {
        tooltip.style("position", "absolute");
        tooltip.style("left", "-1000px").style("top", "-1000px");
        tooltip.style("opacity", 0);
      });

    g.selectAll(".bar_circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "bar_circle")
      .attr("r", "5px")
      .attr("fill", "#4dabf5")
      .attr("cx", ({ hour }) => x(hour) + x.bandwidth() / 2)
      .attr("cy", ({ totalParticipants }) => y(totalParticipants))
      .attr("opacity", 0.5);
  }

  function drawLineGraph(data) {
    x = d3
      .scaleBand()
      .domain(data.map(({ hour }) => hour))
      .range([margin.left, svgDimention.width - margin.right]);

    y = d3
      .scaleLinear()
      .domain([
        0,
        Math.max(...data.map(({ totalParticipants }) => totalParticipants)),
      ])
      .range([svgDimention.height - margin.bottom, margin.top]);

    g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    g.append("g")
      .attr("class", "axis axis--x")
      .attr(
        "transform",
        `translate(0, ${svgDimention.height - margin.bottom} )`
      )
      .call(d3.axisBottom(x))
      .call((g) =>
        g
          .selectAll(`.tick text`)
          .attr("text-anchor", "end")
          .attr("transform", "rotate(-90)")
          .attr(`y`, -1.5)
          .attr(`dx`, -7)
      );

    g.append("g")
      .attr("class", "axis axis--y")
      .attr("transform", `translate(${margin.left}, 0 )`)
      .call(d3.axisLeft(y).ticks(10))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Total Participants");

    g.append("path")
      .attr("class", "mypath")
      .datum(data)
      .attr("fill", "none")
      .attr("opacity", ".8")
      .attr("stroke", "#4dabf5")
      .attr("stroke-width", "2px")
      .attr("stroke-linejoin", "round")
      .attr(
        "d",
        d3
          .line()
          .x(({ hour }) => x(hour) + x.bandwidth() / 2)
          .y(({ totalParticipants }) => y(totalParticipants))
      );
  }

  function calculateSVGDimentions() {
    const svg = d3.select("#bargraph_svg");
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

  const helpModalDescription = [
    "This graph shows the total number of customers who visited the store in a particular hour.",
    "The X-axis shows the time in hours and the Y-axis shows the total number of customers.",
    "Hover over the bars to see the exact number of customers.",
  ];

  return (
    <>
      <svg
        id="bargraph_svg"
        width={svgDimention.width}
        height={svgDimention.height}
      ></svg>
      {showHelpModal === true && (
        <HelpModal
          title="About Bar Graph"
          descriptions={helpModalDescription}
        />
      )}
      <ProgressBlock color="secondary" hide={hideProgressBlock} />
    </>
  );
}

export default BarGraph;
