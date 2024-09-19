import { useContext, useEffect, useState } from "react";

import imgLocation from "../img/BaseMap.png";
import rawBaseMapVectorPoints from "../data/merged_points_10000.json";
// import rawParticipantsLocation from '../data/participants.json';
import rawBuildingLocation from "../data/buildings.json";
import axios from "axios";
import {
  ParticipantsContext,
  BuildingContext,
  DateTimeContext,
} from "../context";
import Lasso from "../helpers/lasso";
import ProgressBlock from "./progressBlock";
import HelpModal from "./helpModal";

function DensityMap({ showHelpModal = false }) {
  const geoJSONdata = rawBaseMapVectorPoints;

  const [participantsLocation, setParticipantsLocation] = useState([]);
  const [hideProgressBlock, setHideProgressBlock] = useState(false);

  const participantContext = useContext(ParticipantsContext);
  const buildingContext = useContext(BuildingContext);
  const dateTimeContext = useContext(DateTimeContext);
  const dateTime = dateTimeContext.dateTime;

  const [availablebalance, setAvailablebalance] = useState({
    min: Number.MAX_VALUE,
    max: Number.MIN_VALUE,
  });
  const [svgDimention, setSvgDimention] = useState({
    width: 800,
    height: 650,
  });

  const participantsMinMax = {
    x: {
      min: -4626,
      max: 2636,
    },
    y: {
      min: 37,
      max: 7852,
    },
  };

  const imageWidth = 1076;
  const imageHeight = 1144;
  const pointsRadius = 5;

  const d3 = window.d3;
  let svg = d3
    .select("#densitymap_svg")
    .attr("width", svgDimention.width)
    .attr("height", svgDimention.height);

  const imageDimentionScaleX = d3
    .scaleLinear()
    .domain([participantsMinMax.x.min, participantsMinMax.x.max])
    .range([0, imageWidth]);

  const imageDimentionScaleY = d3
    .scaleLinear()
    .domain([participantsMinMax.y.min, participantsMinMax.y.max])
    .range([imageHeight, 0]);

  let d3Lasso;

  useEffect(() => {
    addEventListener();
    calculateSVGDimentions();
  }, []);

  useEffect(() => {
    (async () => {
      drawBaseImageMap();
      // drawBaseMapPoints();
      drawBuildingLocation();
    })();
  }, [svgDimention]);

  useEffect(() => {
    (async () => {
      setHideProgressBlock(false);
      const rawParticipantsLocation = await fetchNewParticipantsData();
      await modifyParticipantsData(rawParticipantsLocation);
    })();
  }, [dateTime]);

  useEffect(() => {
    drawParticipantsLocation();
    initLasso();
    onLassoStart();
    onLassoEnd();
    setHideProgressBlock(true);
  }, [participantsLocation]);

  async function fetchNewParticipantsData() {
    const date = dateTime.split(" ")[0];
    const time = dateTime.split(" ")[1];
    return await axios
      .get("http://127.0.0.1:8002/heatmap/" + date + "&" + time, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      })
      .then((d) => {
        return d.data;
      })
      .catch((e) => {
        console.log(e.message);
        return [];
      });
  }

  async function modifyParticipantsData(rawParticipantsLocation) {
    let maxAvailablebalance = Number.MIN_VALUE,
      minAvailablebalance = Number.MAX_VALUE;
    let modifiedParticipantsLocation = rawParticipantsLocation.map((d) => {
      const locationPointString = d.currentlocation;
      const locationPointSplitted = locationPointString.split(" ");
      const x = parseFloat(locationPointSplitted[1].slice(1, -1));
      const y = parseFloat(locationPointSplitted[2].slice(0, -1));
      if (+d.availablebalance > maxAvailablebalance) {
        maxAvailablebalance = +d.availablebalance;
      }
      if (+d.availablebalance < minAvailablebalance) {
        minAvailablebalance = +d.availablebalance;
      }

      return {
        ...d,
        availablebalance: parseFloat(d.availablebalance),
        x,
        y,
      };
    });

    setAvailablebalance({
      min: minAvailablebalance,
      max: maxAvailablebalance,
    });

    modifiedParticipantsLocation = modifiedParticipantsLocation.map((d) => ({
      ...d,
      x: imageDimentionScaleX(d.x),
      y: imageDimentionScaleY(d.y),
    }));

    setParticipantsLocation(modifiedParticipantsLocation);
  }

  function drawBaseImageMap() {
    if (!svg) return;
    svg.select("#base_map").remove();
    svg
      .append("image")
      .attr("id", "base_map")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", svgDimention.width)
      .attr("height", svgDimention.height)
      .attr("xlink:href", imgLocation);
  }

  function drawBaseMapPoints() {
    if (!svg) return;

    const imageScaleX = d3
      .scaleLinear()
      .domain([0, imageWidth])
      .range([0, svgDimention.width]);
    const imageScaleY = d3
      .scaleLinear()
      .domain([0, imageHeight])
      .range([0, svgDimention.height]);

    svg.selectAll("circle.map_points").remove();
    svg
      .selectAll("circle.map_points")
      .data(geoJSONdata)
      .enter()
      .append("circle")
      .attr("class", "map_points")
      .attr("cx", (d) => imageScaleX(d[0]))
      .attr("cy", (d) => imageScaleY(d[1]))
      .attr("r", pointsRadius)
      .attr("fill", "green")
      .style("opacity", 0.5);
  }

  function drawParticipantsLocation() {
    if (!svg) return;
    const imageScaleX = d3
      .scaleLinear()
      .domain([0, imageWidth])
      .range([
        pointsRadius * 2 + pointsRadius,
        svgDimention.width - pointsRadius,
      ]);
    const imageScaleY = d3
      .scaleLinear()
      .domain([0, imageHeight])
      .range([pointsRadius, svgDimention.height - pointsRadius * 2]);

    const heatMapColorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateHcl("#fafa6e", "#2A4858"))
      .domain([availablebalance.max, availablebalance.min]);

    const sizeScale = d3
      .scaleLinear()
      .domain([availablebalance.min, availablebalance.max])
      .range([pointsRadius * 1, pointsRadius * 2]);

    const participants = svg
      .selectAll("circle.participant")
      .data(participantsLocation);

    participants.join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "participant")
          .attr("cx", (d) => imageScaleX(d.x))
          .attr("cy", (d) => imageScaleY(d.y))
          .attr("r", (d) => sizeScale(d.availablebalance))
          .attr("fill", (d) => heatMapColorScale(d.availablebalance))
          .attr("stroke", "black")
          .attr("stroke-width", 0.6)
          .style("opacity", 0.5),

      (update) =>
        update
          .transition()
          .duration(750)
          .attr("cx", (d) => imageScaleX(d.x))
          .attr("cy", (d) => imageScaleY(d.y))
          .attr("r", (d) => sizeScale(d.availablebalance))
          .attr("fill", (d) => heatMapColorScale(d.availablebalance))
          .attr("stroke", "black")
          .attr("stroke-width", 0.6)
          .style("opacity", 0.5)
    );
  }

  function drawBuildingLocation() {
    if (!svg) return;

    const imageScaleX = d3
      .scaleLinear()
      .domain([0, imageWidth])
      .range([pointsRadius + 10, svgDimention.width - pointsRadius]);
    const imageScaleY = d3
      .scaleLinear()
      .domain([0, imageHeight])
      .range([pointsRadius, svgDimention.height - pointsRadius - 8]);

    svg.selectAll("circle.building").remove();

    svg
      .selectAll("circle.building")
      .data(rawBuildingLocation)
      .enter()
      .append("circle")
      .attr("class", "building")
      .attr("cx", (d) => imageScaleX(d.x))
      .attr("cy", (d) => imageScaleY(d.y))
      .attr("r", 2)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .style("opacity", 0);
  }

  function calculateSVGDimentions() {
    if (!svg || svg.node() === null) svg = d3.select("#densitymap_svg");
    const margin = 50;
    const parentHeight =
      svg.node().parentNode.getBoundingClientRect().height - margin;

    const svgWidthBasedOnImage = parentHeight * (imageWidth / imageHeight);

    setSvgDimention({
      width: svgWidthBasedOnImage,
      height: parentHeight,
    });
  }

  function addEventListener() {
    // window.addEventListener("resize", () => {
    //     calculateSVGDimentions();
    //     // drawBaseImageMap();
    //     // drawBaseMapPoints();
    //     drawParticipantsLocation()
    // });
  }

  function onLassoStart() {
    d3Lasso
      .items()
      // .attr("r",pointsRadius)
      .classed("not_possible", true)
      .classed("selected", false);
  }

  function onLassoDraw() {
    d3Lasso
      .possibleItems()
      .classed("not_possible", false)
      .classed("possible", true);
    d3Lasso
      .notPossibleItems()
      .classed("not_possible", true)
      .classed("possible", false);
  }

  function onLassoEnd() {
    d3Lasso.items().classed("not_possible", false).classed("possible", false);
    d3Lasso
      .selectedItems()
      .classed("selected", (d, i) => !d.hasOwnProperty("buildingId"));

    const currentSelectedParticipants = [];
    const currentSelectedBuildings = [];

    d3Lasso
      .selectedItems()
      .data()
      .forEach((d) => {
        if (d.hasOwnProperty("buildingId")) {
          if (d.businessType == "Restaurant" || d.businessType == "Pub")
            currentSelectedBuildings.push(d);
        } else currentSelectedParticipants.push(d);
      });
    participantContext.setSelectedParticipants(currentSelectedParticipants);
    buildingContext.setSelectedBuildings(currentSelectedBuildings);
  }

  function initLasso() {
    d3Lasso = Lasso().initLasso(svg);
    if (d3Lasso === null) return;
    d3Lasso.on("start", onLassoStart);
    d3Lasso.on("draw", onLassoDraw);
    d3Lasso.on("end", onLassoEnd);
  }

  const helpModalDescription = [
    "This chart shows the density of participants in the area. The size and color of the circle represents the amount of money the participant has in their account. The darker the circle, the more money they have.",
    "You can select multiple participants by clicking and dragging a lasso around them. You can also select multiple buildings by clicking and dragging a lasso around them.",
    "Buildings are plotted but not visible. You can see the selected buildings by lasso by clicking on the 'Detailed Charts' button.",
  ];

  return (
    <>
      <svg
        id="densitymap_svg"
        width={svgDimention.width}
        height={svgDimention.height}
      ></svg>
      {showHelpModal === true && (
        <HelpModal
          title="About Density Chart"
          descriptions={helpModalDescription}
        />
      )}
      <ProgressBlock color="secondary" hide={hideProgressBlock} />
    </>
  );
}

export default DensityMap;
