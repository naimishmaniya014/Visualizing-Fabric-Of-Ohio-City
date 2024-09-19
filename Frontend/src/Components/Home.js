import DensityMap from "./densitymap";
import {
  ParticipantsContext,
  BuildingContext,
  DateTimeContext,
  EarningsAndVisitorsContext,
} from "../context";
import { useState } from "react";
import RightPanel from "./RightPanel";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import Chord from "./chord";
import Circular from "./circular";
import InteractiveScatter from "./interactiveScatter";
import BarGraph from "./barGraph";
import { cloneElement } from "react";

function Home() {
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  const [dateTime, setDateTime] = useState("2022-03-01 17");
  const [visitorsAndEarnings, setVisitorsAndEarnings] = useState([]);
  const [rightPanelComponents, setRightPanelComponents] = useState([]);

  const allPageComponents = [
    <InteractiveScatter />,
    <Chord />,
    <Circular setPageTo={changePageTo} />,
  ];

  const [chartTitle, setChartTitle] = useState(
    "Density Map of Participants at parts of Ohio"
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [focusedChartComponent, setFocusedChartComponent] = useState(
    <DensityMap />
  );

  const breadcrumbs = [
    "Density Map",
    "Detailed Charts",
    "Earnings and Visitors",
  ];

  function changePageTo(pageNumber) {
    setCurrentPage(pageNumber);
    changeTitle(pageNumber);
  }

  function changeTitle(pageNumber) {
    switch (pageNumber) {
      case 1:
        setChartTitle("Density Map of Participants at parts of Ohio");
        break;
      case 2:
        setChartTitle("Detailed Charts");
        break;
      case 3:
        setChartTitle("Earnings and Visitors");
        break;
      default:
        break;
    }
  }

  function changeFocusedChartComponent(component) {
    setRightPanelComponents(
      allPageComponents.filter((c) => c.type.name !== component.type.name)
    );

    component = cloneElement(component, {
      showHelpModal: true,
    });

    setFocusedChartComponent(component);
  }

  useEffect(() => {
    switch (currentPage) {
      case 1:
        changeFocusedChartComponent(<DensityMap />);
        break;
      case 2:
        changeFocusedChartComponent(<InteractiveScatter />);
        break;
      case 3:
        changeFocusedChartComponent(<BarGraph />);
        break;
      default:
        break;
    }
  }, [currentPage]);

  useEffect(() => {
    changePageTo(1);
  }, [dateTime]);

  return (
    <ParticipantsContext.Provider
      value={{ selectedParticipants, setSelectedParticipants }}
    >
      <BuildingContext.Provider
        value={{ selectedBuildings, setSelectedBuildings }}
      >
        <DateTimeContext.Provider value={{ dateTime, setDateTime }}>
          <EarningsAndVisitorsContext.Provider
            value={{ visitorsAndEarnings, setVisitorsAndEarnings }}
          >
            <div className="px-10 py-4 w-screen h-screen flex flex-col">
              <div className="bg-white border border-black-50 p-2 text-4xl rounded-lg text-center">
                {chartTitle}
              </div>
              <div className="my-4">
                <Stack spacing={2}>
                  <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                  >
                    {breadcrumbs.map((breadcrumb, index) => {
                      if (index < currentPage) {
                        return (
                          <Link
                            className=" cursor-pointer font-bold text-blue-700"
                            underline="hover"
                            key={index}
                            onClick={() => changePageTo(index + 1)}
                          >
                            {breadcrumb}
                          </Link>
                        );
                      } else {
                        return (
                          <Typography key={index} className=" text-gray-500">
                            {breadcrumb}
                          </Typography>
                        );
                      }
                    })}
                  </Breadcrumbs>
                </Stack>
              </div>
              <div className="flex-1 flex items-center justify-evenly">
                <div className="relative h-full flex-1 flex items-center justify-center bg-white border border-black-50 rounded-lg mr-10">
                  {focusedChartComponent}
                </div>
                <RightPanel
                  setPageTo={changePageTo}
                  currentPage={currentPage}
                  rightPanelComponents={rightPanelComponents}
                  changeFocusedChartComponent={changeFocusedChartComponent}
                />
              </div>
            </div>
          </EarningsAndVisitorsContext.Provider>
        </DateTimeContext.Provider>
      </BuildingContext.Provider>
    </ParticipantsContext.Provider>
  );
}

export default Home;
