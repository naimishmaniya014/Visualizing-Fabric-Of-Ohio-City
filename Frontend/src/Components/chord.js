import { useEffect, useState, useContext } from "react";
import { ParticipantsContext, DateTimeContext } from "../context";
import axios from "axios";
import ProgressBlock from "./progressBlock";
import HelpModal from "./helpModal";

function Chord({ showHelpModal = false }) {
  const [svgDimention, setSvgDimention] = useState({
    width: null,
    height: null,
  });
  const [hideProgressBlock, setHideProgressBlock] = useState(false);

  const participantContext = useContext(ParticipantsContext);
  const participants = participantContext.selectedParticipants;
  const dateTimeContext = useContext(DateTimeContext);
  const dateTime = dateTimeContext.dateTime;
  const date = dateTime.split(" ")[0];

  const d3 = window.d3;

  useEffect(() => {
    calculateSVGDimentions();
  }, []);

  useEffect(() => {
    if (
      typeof svgDimention.width !== "number" ||
      typeof svgDimention.height !== "number"
    )
      return;
    (async () => {
      const query = makeQuery(date, participants);
      const rawJsonData = await fetchParticipantConnections(query);
      const selectedParticipantsIdSet = new Set(query.split("&").splice(1));
      const data = restructureData(rawJsonData);
      drawChordChart(data, selectedParticipantsIdSet);
      setHideProgressBlock(true);
    })();
  }, [participants, svgDimention]);

  async function fetchParticipantConnections(query) {
    return await axios
      .get("http://127.0.0.1:8002/social_network/" + query, {
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

  function calculateSVGDimentions() {
    const svg = d3.select("#chord_svg");
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

  function drawChordChart(data, selectedParticipantsIdSet) {
    const svg = d3
      .select("#chord_svg")
      .attr("width", svgDimention.width)
      .attr("height", svgDimention.height);
    svg.selectAll("*").remove();
    if (data.nodes.length === 0) {
      svg
        .append("text")
        .attr("x", svgDimention.width / 2)
        .attr("y", svgDimention.height / 2)
        .attr("text-anchor", "middle")
        .text("No data available for selected participants")
        .attr("font-size", "1.5em")
        .attr("font-weight", "bold")
        .attr("fill", "gray");

      return;
    }
    const RADIUS = svgDimention.height / 2.5;
    const allNodes = data.nodes.map((d) => d.name);

    const theta = d3
      .scaleBand()
      .range([0, 2 * Math.PI])
      .align(0)
      .domain(allNodes);

    const idToNode = {};
    data.nodes.forEach(function (n) {
      idToNode[n.id] = n;
    });

    const links = svg
      .selectAll("mylinks")
      .data(data.links)
      .join("path")
      .attr("d", (d) => {
        var startX =
          svgDimention.width / 2 +
          RADIUS * Math.cos(theta(idToNode[d.source].name));
        var endX =
          svgDimention.width / 2 +
          RADIUS * Math.cos(theta(idToNode[d.target].name));
        var startY =
          svgDimention.height / 2 +
          RADIUS * Math.sin(theta(idToNode[d.source].name));
        var endY =
          svgDimention.height / 2 +
          RADIUS * Math.sin(theta(idToNode[d.target].name));
        return [
          "M",
          startX,
          startY,
          "A",
          RADIUS,
          ",",
          RADIUS,
          0,
          0,
          ",",
          0,
          endX,
          ",",
          endY,
        ].join(" ");
      })
      .style("fill", "none")
      .attr("stroke", "grey")
      .style("stroke-width", 1)
      .style("opacity", 1);

    const nodes = svg
      .selectAll("mynodes")
      .data(
        data.nodes.sort((a, b) => {
          return +b.n - +a.n;
        })
      )
      .join("circle")
      .attr("cx", (d) => {
        return svgDimention.width / 2 + RADIUS * Math.cos(theta(d.name));
      })
      .attr("cy", (d) => {
        return svgDimention.height / 2 + RADIUS * Math.sin(theta(d.name));
      })
      .attr("r", "5")
      .style("fill", (d) => {
        if (selectedParticipantsIdSet.has(d.id)) {
          return "#9c27b0";
        } else {
          return "grey";
        }
      })
      .attr("stroke", "white")
      .attr("class", "chord_nodes")
      .attr("id", (d) => "chord_node_" + d.name);

    const labels = svg
      .selectAll("mylabels")
      .data(
        data.nodes.sort((a, b) => {
          return +b.n - +a.n;
        })
      )
      .join("text")
      .text((d) => d.name)
      .style("text-anchor", (d) => {
        const angle = (theta(d.name) * 180) / Math.PI;
        if (angle > 90 && angle < 270) {
          return "start";
        } else {
          return "end";
        }
      })
      .attr("transform", (d) => {
        const angle = (theta(d.name) * 180) / Math.PI;
        if (angle > 90 && angle < 270) {
          return `translate(${
            svgDimention.width / 2 +
            (RADIUS + RADIUS / 7) * Math.cos(theta(d.name))
          }, ${
            svgDimention.height / 2 +
            (RADIUS + RADIUS / 7) * Math.sin(theta(d.name))
          }) rotate(${(theta(d.name) * 180) / Math.PI + 180})`;
        } else {
          return `translate(${
            svgDimention.width / 2 +
            (RADIUS + RADIUS / 7) * Math.cos(theta(d.name))
          }, ${
            svgDimention.height / 2 +
            (RADIUS + RADIUS / 7) * Math.sin(theta(d.name))
          }) rotate(${(theta(d.name) * 180) / Math.PI})`;
        }
      })
      .style("font-size", 12);

    nodes
      .on("mouseover", function (d, i) {
        try {
          const connections = new Set();
          connections.add(i.name);
          // Links
          links
            .style("stroke", function (link_d) {
              // Find connected nodes
              if (link_d.source === i.name || link_d.target === i.name) {
                connections.add(link_d.source);
                connections.add(link_d.target);
                return "black";
              }
              return "grey";
            })
            .style("opacity", function (link_d) {
              return link_d.source === i.name || link_d.target === i.name
                ? 1
                : 0;
            });

          // Highlight selected node and its connections
          const circleSelectionData = svg.selectAll(".chord_nodes");
          const circleSelectionDOM = circleSelectionData.nodes();
          for (let itr = 0; circleSelectionDOM[itr]; itr++) {
            try {
              const currentNode = circleSelectionData._groups[0][itr];
              const currentNodeName = currentNode.__data__["name"];
              if (connections.has(currentNodeName)) {
                svg
                  .select("#chord_node_" + currentNodeName)
                  .style("opacity", 1);
              } else {
                svg
                  .select("#chord_node_" + currentNodeName)
                  .style("opacity", 0.2);
              }
              // Labels
              labels
                .style("font-size", function (label_d) {
                  return connections.has(label_d.name) ? 15 : 2;
                })
                .attr("transform", (d) => {
                  const angle = (theta(d.name) * 180) / Math.PI;
                  if (angle > 90 && angle < 270) {
                    return `translate(${
                      svgDimention.width / 2 +
                      (RADIUS + RADIUS / 5) * Math.cos(theta(d.name))
                    }, ${
                      svgDimention.height / 2 +
                      (RADIUS + RADIUS / 5) * Math.sin(theta(d.name))
                    }) rotate(${(theta(d.name) * 180) / Math.PI + 180})`;
                  } else {
                    return `translate(${
                      svgDimention.width / 2 +
                      (RADIUS + RADIUS / 5) * Math.cos(theta(d.name))
                    }, ${
                      svgDimention.height / 2 +
                      (RADIUS + RADIUS / 5) * Math.sin(theta(d.name))
                    }) rotate(${(theta(d.name) * 180) / Math.PI})`;
                  }
                });
            } catch (err) {
              console.log(err);
            }
          }
        } catch (err) {
          console.log(err);
        }
      })
      .on("mouseout", function (d) {
        try {
          nodes.style("opacity", 1);
          links.style("stroke", "grey").style("opacity", 1);
          labels.style("font-size", 8).attr("transform", (d) => {
            const angle = (theta(d.name) * 180) / Math.PI;
            if (angle > 90 && angle < 270) {
              return `translate(${
                svgDimention.width / 2 +
                (RADIUS + RADIUS / 7) * Math.cos(theta(d.name))
              }, ${
                svgDimention.height / 2 +
                (RADIUS + RADIUS / 7) * Math.sin(theta(d.name))
              }) rotate(${(theta(d.name) * 180) / Math.PI + 180})`;
            } else {
              return `translate(${
                svgDimention.width / 2 +
                (RADIUS + RADIUS / 7) * Math.cos(theta(d.name))
              }, ${
                svgDimention.height / 2 +
                (RADIUS + RADIUS / 7) * Math.sin(theta(d.name))
              }) rotate(${(theta(d.name) * 180) / Math.PI})`;
            }
          });
        } catch (err) {
          console.log(err);
        }
      });
  }

  function makeQuery(date, participants) {
    let query = date;
    participants.forEach((participant) => {
      query += "&" + participant.participantid;
    });

    return query;
  }

  function restructureData(rawJsonData) {
    const distinctNodes = new Set();
    const tempDict = {
      links: [],
      nodes: [],
    };
    rawJsonData.forEach((data) => {
      tempDict["links"].push({
        source: data["participantidfrom"],
        target: data["participantidto"],
        value: 1,
      });
      if (!distinctNodes.has(data["participantidfrom"])) {
        distinctNodes.add(data["participantidfrom"]);
        tempDict["nodes"].push({
          name: data["participantidfrom"],
          id: data["participantidfrom"],
        });
      }
      if (!distinctNodes.has(data["participantidto"])) {
        distinctNodes.add(data["participantidto"]);
        tempDict["nodes"].push({
          name: data["participantidto"],
          id: data["participantidto"],
        });
      }
    });

    return tempDict;
  }

  const helpModalDescription = [
    "This chart shows the interactions between selected participants from lasso in the selected day",
    "You can hover over the nodes to see the participants and their interactions with other participants",
    "The nodes colored in pink are the selected participants and the nodes colored in grey are the participants that interacted with the selected participants",
  ];

  return (
    <>
      <svg
        id="chord_svg"
        width={svgDimention.width}
        height={svgDimention.height}
      ></svg>
      {showHelpModal === true && (
        <HelpModal
          title="About Chord Chart"
          descriptions={helpModalDescription}
        />
      )}
      <ProgressBlock color="primary" hide={hideProgressBlock} />
    </>
  );
}

export default Chord;
