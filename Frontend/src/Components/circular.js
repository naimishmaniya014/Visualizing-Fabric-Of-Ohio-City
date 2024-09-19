import axios from "axios";
import { useContext, useEffect, useState } from "react";
import {
  BuildingContext,
  DateTimeContext,
  EarningsAndVisitorsContext,
} from "../context";
import HelpModal from "./helpModal";
import ProgressBlock from "./progressBlock";

function Circular({ setPageTo = () => {}, showHelpModal = false }) {
  const d3 = window.d3;

  const [svgDimention, setSvgDimention] = useState({
    width: null,
    height: null,
  });
  const [hideProgressBlock, setHideProgressBlock] = useState(false);

  let svg;

  const buildingContext = useContext(BuildingContext);
  const data = buildingContext.selectedBuildings;

  const dateTimeContext = useContext(DateTimeContext);
  const dateTime = dateTimeContext.dateTime;
  const date = dateTime.split(" ")[0];

  const earningsAndVisitorContext = useContext(EarningsAndVisitorsContext);

  const color = d3
    .scaleOrdinal()
    .domain([1, 2, 3])
    .range(["#3f50b5", "#ba000d", "#4caf50"]);

  const size = d3.scaleLinear().domain([0, 200]).range([30, 60]);

  const x = d3.scaleOrdinal().domain([1, 2, 3]).range([50, 200, 340]);

  useEffect(() => {
    calculateSVGDimentions();
  }, []);

  useEffect(() => {
    setHideProgressBlock(false);
    if (
      typeof svgDimention.width !== "number" ||
      typeof svgDimention.height !== "number"
    )
      return;
    svg = d3
      .select("svg#circular_svg")
      .attr("width", svgDimention.width)
      .attr("height", svgDimention.height);

    drawcircularmap();
    setHideProgressBlock(true);
  }, [data, svgDimention]);

  function drawcircularmap() {
    svg.selectAll("*").remove();
    let tooltip = d3.select("#tooltip");
    if (tooltip.empty())
      tooltip = d3.select("body").append("div").attr("id", "tooltip");

    if (data.length === 0) {
      svg
        .append("text")
        .attr("x", svgDimention.width / 2)
        .attr("y", svgDimention.height / 2)
        .attr("text-anchor", "middle")
        .text("No buildings for selected region")
        .attr("font-size", "1.5em")
        .attr("font-weight", "bold")
        .attr("fill", "gray");

      return;
    }

    const node = svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("id", "circles")
      .attr("class", "cursor-pointer")
      .attr("r", function (d) {
        return size(parseInt(d.maxOccupancy));
      })
      .attr("cx", svgDimention.width / 2)
      .attr("cy", svgDimention.height / 2)
      .style("fill", function (d) {
        return color(d.businessType);
      })
      .style("fill-opacity", 0.6)
      .attr("stroke", "black")
      .style("stroke-width", 4)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("mouseover", function (e, d) {
        d3.select(this).style("fill-opacity", 1);
        d3.select(this).style("stroke-width", 6);
        d3.select(this).style("stroke", "#9c27b0");
      })
      .on("mousemove", function (e, d) {
        tooltip
          .html(
            `Building ID: <I><B> ${d.buildingId}</B></I><br> Business Type: <I><B> ${d.businessType}</B></I><br>Max. Occupancy: <I><B> ${d.maxOccupancy}</B></I>`
          )
          .style("opacity", 1)
          .style("background-color", "white")
          .style("border", "solid")
          .style("border-color", "#00b0ff")
          .style("border-width", "1px")
          .style("border-radius", "5px")
          .style("font-size", "14px")
          .style("padding", "8px")
          .style("position", "absolute")
          .style("left", `${e.clientX + 20}px`)
          .style("top", `${e.clientY + 20}px`);
      })
      .on("mouseout", function (e, d) {
        tooltip.style("left", "-1000px").style("top", "-1000px");
        tooltip.style("opacity", 0);
        d3.select(this).style("fill-opacity", 0.6);
        d3.select(this).style("stroke-width", 4);
        d3.select(this).style("stroke", "black");
      })
      .on("click", function (e, d) {
        tooltip.style("left", "-1000px").style("top", "-1000px");
        tooltip.style("opacity", 0);
        fetchBusinessData(d.businessId);
      });

    async function fetchBusinessData(businessId) {
      setPageTo(3);
      earningsAndVisitorContext.setVisitorsAndEarnings([]);
      const result = await axios
        .get("http://127.0.0.1:8002/barchart/" + date + "&" + businessId)
        .then((d) => {
          return d.data;
        });
      earningsAndVisitorContext.setVisitorsAndEarnings(result);
    }

    var simulation = d3
      .forceSimulation()
      .force(
        "x",
        d3
          .forceX()
          .strength(0.1)
          .x(function (d) {
            return x(svgDimention.width / 2);
          })
      )
      .force(
        "y",
        d3
          .forceY()
          .strength(0.1)
          .y(svgDimention.width / 2)
      )
      .force(
        "center",
        d3
          .forceCenter()
          .x(svgDimention.width / 2)
          .y(svgDimention.height / 2)
      )
      .force("charge", d3.forceManyBody().strength(0.1))
      .force(
        "collide",
        d3
          .forceCollide()
          .strength(0.1)
          .radius(function (d) {
            return size(d["maxOccupancy"] * 1.5);
          })
          .iterations(1)
      );

    simulation.nodes(data).on("tick", function (d) {
      node
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        });
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.03).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0.03);
      d.fx = null;
      d.fy = null;
    }
  }

  function calculateSVGDimentions() {
    if (!svg || svg.node() === null) svg = d3.select("#circular_svg");
    const margin = 0;
    const dimentions = svg.node().parentNode.getBoundingClientRect();
    const parentHeight = dimentions.height - margin;
    const parentWidth = dimentions.width - margin;

    setSvgDimention({
      width: parentWidth,
      height: parentHeight,
    });
  }

  const helpModalDescription = [
    "This chart shows the buildings information in the selected region.",
    "The size of the circle represents the maximum occupancy of the building.",
    "The color of the circle represents the business type of the building.",
    "You can drag the circles to rearrange them.",
    "Click on a circle to see the visitors and earnings of the building.",
  ];

  return (
    <>
      <svg
        id="circular_svg"
        width={svgDimention.width}
        height={svgDimention.height}
      ></svg>
      {showHelpModal === true && (
        <HelpModal
          title="About Circular Packing Chart"
          descriptions={helpModalDescription}
        />
      )}
      <ProgressBlock color="primary" hide={hideProgressBlock} />
    </>
  );
}

export default Circular;
