import { useEffect, useState, useContext } from "react";
import { ParticipantsContext, DateTimeContext } from "../context";
import axios from "axios";
import ProgressBlock from "./progressBlock";
import HelpModal from "./helpModal";

function InteractiveScatter({ showHelpModal = false }) {
  const activities = [
    "Transport",
    "AtHome",
    "AtRecreation",
    "AtRestaurant",
    "AtWork",
  ];
  const ANIMATION_STEP = 2500;
  const RADIUS_CIRCLE = 5;

  const [svgDimention, setSvgDimention] = useState({
    width: null,
    height: null,
  });
  const [myTimer, setMyTimer] = useState(null);
  const [hideProgressBlock, setHideProgressBlock] = useState(false);

  const participantContext = useContext(ParticipantsContext);
  const participants = participantContext.selectedParticipants;
  const dateTimeContext = useContext(DateTimeContext);
  const date = dateTimeContext.dateTime.split(" ")[0];

  const d3 = window.d3;

  useEffect(() => {
    calculateSVGDimentions();
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(myTimer);
    };
  }, [myTimer]);

  useEffect(() => {
    setHideProgressBlock(false);
    if (
      typeof svgDimention.width !== "number" ||
      typeof svgDimention.height !== "number"
    )
      return;
    (async () => {
      const rawJsonData = await fetchParticipantConnections(
        makeQuery(date, participants)
      );
      const data = restructureData(rawJsonData);
      drawInteractivePlot(data);
    })();
  }, [participants, svgDimention]);

  function calculateSVGDimentions() {
    const svg = d3.select("#interactive_svg");
    if (svg.node() === null) return;
    const margin = 24;
    const dimentions = svg.node().parentNode.getBoundingClientRect();
    const parentHeight = dimentions.height - margin;
    const parentWidth = dimentions.width - margin;

    setSvgDimention({
      width: parentWidth,
      height: parentHeight,
    });
  }

  function drawInteractivePlot(data) {
    const svg = d3
      .select("#interactive_svg")
      .attr("width", svgDimention.width)
      .attr("height", svgDimention.height);
    svg.selectAll("*").remove();
    const RADIUS = svgDimention.height / 2.5;
    // const circle = svg
    //   .append("circle")
    //   .attr("cx", svgDimention.width / 2)
    //   .attr("cy", svgDimention.height / 2)
    //   .attr("r", RADIUS / 1.05)
    //   .style("fill", "none")
    //   .style("stroke", "black")
    //   .style("stroke-width", "3px")
    //   .style("opacity", 0.75);

    const theta = d3
      .scaleBand()
      .range([0, 2 * Math.PI])
      .align(0)
      //   .domain(activities);
      .domain(activities.slice(1));

    const color = d3
      .scaleOrdinal()
      .range(["violet", "blue", "green", "orange", "red"])
      .domain(activities);

    const labels = svg
      .selectAll("mylabels")
      .data(activities)
      .join("text")
      .text((d) => d)
      .style("text-anchor", (d) => {
        if (d == "Transport") {
          return "start";
        } else {
          const angle = (theta(d) * 180) / Math.PI;
          if (angle > 90 && angle < 270) {
            return "start";
          } else {
            return "end";
          }
        }
      })
      .attr("transform", function (d) {
        if (d == "Transport") {
          return `translate(${
            svgDimention.width / 2 - this.getBoundingClientRect().width / 2
          }, ${svgDimention.height / 2})`;
        } else {
          const angle = (theta(d) * 180) / Math.PI;
          if (angle > 90 && angle < 270) {
            return `translate(${
              svgDimention.width / 2 +
              (RADIUS + RADIUS / 5) * Math.cos(theta(d)) * 0.98 -
              this.getBoundingClientRect().width / 2
            }, ${
              svgDimention.height / 2 +
              (RADIUS + RADIUS / 7) * Math.sin(theta(d)) * 0.98
            })`;
          } else {
            return `translate(${
              svgDimention.width / 2 +
              (RADIUS + RADIUS / 5) * Math.cos(theta(d)) * 0.98 +
              this.getBoundingClientRect().width / 2
            }, ${
              svgDimention.height / 2 +
              (RADIUS + RADIUS / 7) * Math.sin(theta(d)) * 0.98
            })`;
          }
        }
      })
      .style("font-size", 16);

    const simulation = d3
      .forceSimulation(data)
      .force("collision", d3.forceCollide().radius(7).strength(0.25)) // Add collision force to prevent overlap
      .force(
        "x",
        d3
          .forceX()
          .strength(0.1)
          .x((d) => {
            if (d.currentmode == "Transport") {
              return svgDimention.width / 2;
            } else {
              return (
                svgDimention.width / 2 +
                (RADIUS + RADIUS / 5) * Math.cos(theta(d.currentmode)) * 0.75
              );
            }
          })
      ) // Add x-axis centering force
      .force(
        "y",
        d3
          .forceY()
          .strength(0.1)
          .y((d) => {
            if (d.currentmode == "Transport") {
              return svgDimention.height / 2;
            } else {
              return (
                svgDimention.height / 2 +
                (RADIUS + RADIUS / 5) * Math.sin(theta(d.currentmode)) * 0.75
              );
            }
          })
      ) // Add y-axis centering force
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.currentmode)
          .distance(50)
          .strength(1)
      );

    playAnimation();
    function playAnimation() {
      let index = 16;
      clearInterval(myTimer);
      setMyTimer(
        setInterval(function () {
          if (!data[index][0]) index = (index + 1) % data.length;
          const manipulatedData = positionManupilation(data[index]);
          drawInteractivePlotUtil(manipulatedData);
          drawTime((index + 7) % data.length);
          if (!hideProgressBlock && (index + 7) % data.length == 0)
            setHideProgressBlock(true);
          index = (index + 1) % data.length;
        }, ANIMATION_STEP)
      );
    }

    function drawTime(hour) {
      const time = svg.selectAll(".time").data([hour]);
      time.join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "time")
            .attr("x", svgDimention.width / 2)
            .attr("y", svgDimention.height / 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "24px")
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text(`Time: ${hour}:00`),
        (update) => update.text(`Time: ${hour}:00`),
        (exit) => exit.remove()
      );
    }

    function drawInteractivePlotUtil(data) {
      const nodes = svg.selectAll(".nodes").data(data);

      nodes.join(
        (enter) =>
          enter
            .append("circle")
            .attr("class", "nodes")
            .attr("r", "5")
            .attr("cx", (d) => {
              return d.x;
            })
            .attr("cy", (d) => {
              return d.y;
            })
            .style("fill", (d) => color(d.currentmode))
            .attr("stroke", "white")
            .attr("stroke-width", 1),
        (update) =>
          update
            .attr("class", "nodes")
            .attr("r", "5")
            .attr("cx", (d) => {
              return d.x;
            })
            .attr("cy", (d) => {
              return d.y;
            })
            .style("fill", (d) => color(d.currentmode)),
        (exit) => exit.remove()
      );

      const activityCount = categoryCounter(data);
      const totalCount = data.length;

      const labels = svg.selectAll(".int_labels").data(activityCount);

      labels.join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "int_labels")
            .text((d, i) => {
              return ((d * 100) / totalCount).toFixed(2) + "%";
            })
            .attr("transform", function (d, i) {
              if (activities[i] == "Transport") {
                return `translate(${
                  svgDimention.width / 2 -
                  this.getBoundingClientRect().width / 2
                }, ${svgDimention.height / 2 + 25})`;
              } else {
                const angle = (theta(activities[i]) * 180) / Math.PI;
                if (angle > 90 && angle < 270) {
                  return `translate(${
                    svgDimention.width / 2 -
                    this.getBoundingClientRect().width / 2 +
                    (RADIUS + RADIUS / 5) *
                      Math.cos(theta(activities[i])) *
                      0.98
                  }, ${
                    svgDimention.height / 2 +
                    (RADIUS + RADIUS / 7) *
                      Math.sin(theta(activities[i])) *
                      0.98 +
                    25
                  })`;
                } else {
                  return `translate(${
                    svgDimention.width / 2 -
                    this.getBoundingClientRect().width / 2 +
                    (RADIUS + RADIUS / 5) *
                      Math.cos(theta(activities[i])) *
                      0.98
                  }, ${
                    svgDimention.height / 2 +
                    (RADIUS + RADIUS / 7) *
                      Math.sin(theta(activities[i])) *
                      0.98 +
                    +25
                  })`;
                }
              }
            }),

        (update) =>
          update.text((d, i) => {
            return ((d * 100) / totalCount).toFixed(2) + "%";
          }),

        (exit) => exit.remove()
      );

      simulation.nodes(data).on("tick", ticked);
      simulation.alpha(0.9).restart();

      function ticked() {
        nodes
          .transition()
          .duration(750)
          .ease(d3.easeLinear)
          .attr("cx", (d) => {
            return d.x;
          })
          .attr("cy", (d) => {
            return d.y;
          });
      }
    }

    function positionManupilation(data) {
      const activityCounter = categoryCounter(data);
      const circularCoords = [];
      activityCounter.map(function (count, index) {
        if (index == 0) {
          circularCoords.push(
            formCircleAroundCenter(
              count,
              svgDimention.width / 2,
              svgDimention.height / 2,
              RADIUS_CIRCLE
            )
          );
        } else {
          circularCoords.push(
            formCircleAroundCenter(
              count,
              svgDimention.width / 2 +
                (RADIUS - RADIUS / 7) * Math.cos(theta(activities[index])),
              svgDimention.height / 2 +
                (RADIUS - RADIUS / 7) * Math.sin(theta(activities[index])),
              RADIUS_CIRCLE
            )
          );
        }
      });

      var pointer = new Array(activities.length).fill(0);
      data.forEach((point) => {
        const index = activities.indexOf(point["currentmode"]);
        point["x"] = circularCoords[index][pointer[index]]["x"];
        point["y"] = circularCoords[index][pointer[index]]["y"];
        pointer[index] += 1;
      });
      return data;
    }
  }

  function formCircleAroundCenter(numberOfNodes, x, y, radius) {
    const coord = [{ x: x, y: y }];
    var layer = 1;
    var angleDiff = Math.PI / 3;
    numberOfNodes -= 1;
    while (numberOfNodes > 0) {
      for (var i = 0; i < 2 * Math.PI; i += angleDiff) {
        if (numberOfNodes >= 0) {
          coord.push({
            x: x + layer * 2 * radius * Math.cos(i),
            y: y + layer * 2 * radius * Math.sin(i),
          });
          numberOfNodes -= 1;
        }
      }
      layer += 1;
      angleDiff /= 2;
    }

    return coord;
  }

  function categoryCounter(data) {
    var count = [];
    activities.forEach((activity) => {
      var cnt = 0;
      data.forEach((elem) => {
        if (elem["currentmode"] == activity) {
          cnt += 1;
        }
      });
      count.push(cnt);
    });
    return count;
  }

  function makeQuery(date, participants) {
    let query = date;
    participants.forEach((participant) => {
      query += "&" + participant.participantid;
    });

    return query;
  }

  function restructureData(data) {
    data.forEach((row) => {
      row.forEach((elem) => {
        elem["x"] = 0;
        elem["y"] = 0;
      });
    });
    return data;
  }

  async function fetchParticipantConnections(query) {
    return await axios
      .get("http://127.0.0.1:8002/activity/" + query, {
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

  const helpModalDescription = [
    "This chart shows the activity of the participants in the selected date.",
    "The color of the circle represents the activity of the participant.",
    "It shows the location of the participant based on hour of the day. The time is updated in 1 hour interval and with that the location of the participant is updated.",
  ];

  return (
    <>
      <svg
        id="interactive_svg"
        width={svgDimention.width}
        height={svgDimention.height}
        className={`${hideProgressBlock ? "opacity-1" : "opacity-0"}`}
      ></svg>
      {showHelpModal === true && (
        <HelpModal
          title="About Interactive Scatter Plot Chart"
          descriptions={helpModalDescription}
        />
      )}
      <ProgressBlock hide={hideProgressBlock} color="secondary" />
    </>
  );
}

export default InteractiveScatter;
