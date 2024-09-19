import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import {
  DateTimeContext,
  EarningsAndVisitorsContext,
  ParticipantsContext,
} from "../context";
import { useContext } from "react";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import { blueGrey } from "@mui/material/colors";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Radar from "./radar";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

export default function RightPanel({
  setPageTo = () => {},
  currentPage = 1,
  rightPanelComponents = [],
  changeFocusedChartComponent = () => {},
}) {
  const dateTimeContext = useContext(DateTimeContext);
  const dateTime = dateTimeContext.dateTime;
  const setDateTime = dateTimeContext.setDateTime;

  const participantsContext = useContext(ParticipantsContext);
  const selectedParticipants = participantsContext.selectedParticipants;

  function changeDate(djsObj) {
    const date = djsObj.format("YYYY-MM-DD");
    const time = dateTime.split(" ")[1];
    setDateTime(date + " " + time);
  }

  function changeTime(e) {
    const date = dateTime.split(" ")[0];
    const time = e.target.value;
    setDateTime(date + " " + time);
  }

  function shouldDisableDate(date) {
    return (
      date.isBefore(dayjs("2022-03-01")) || date.isAfter(dayjs("2023-05-22"))
    );
  }

  const firstPageComponent = (
    <>
      <div className="">
        <Card className="">
          <CardContent>
            <div className="font-bold text-xl">Filters</div>
            <div className="flex items-center mt-2 w-full">
              <div className="flex-1">
                <InputLabel id="date-label">Date</InputLabel>
                <DatePicker
                  className="w-full"
                  labelId="date-label"
                  id="date-select"
                  value={dayjs(dateTime.split(" ")[0])}
                  onChange={changeDate}
                  shouldDisableDate={shouldDisableDate}
                />
              </div>
              <div className="ml-4">
                <InputLabel id="time-label">Time</InputLabel>
                <Select
                  labelId="time-label"
                  id="time-select"
                  value={dateTime.split(" ")[1]}
                  label="Time"
                  className="w-36"
                  onChange={changeTime}
                >
                  {[...Array(24).keys()].map((hour, i) => {
                    return (
                      <MenuItem key={i} value={hour}>{`${hour}:00`}</MenuItem>
                    );
                  })}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className=" mt-4">
          <CardContent>
            <div className="font-bold text-xl">
              Selected Participants ({selectedParticipants.length})
            </div>
            <div className="flex flex-col mt-2 w-full h-72 xl:h-80 2xl:h-96 overflow-y-auto">
              {selectedParticipants.length === 0 ? (
                <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
                  <span>No one selected</span>
                  <span className="text-gray-400 text-sm">
                    (Select participants by clicking and then dragging on the
                    map)
                  </span>
                </div>
              ) : (
                selectedParticipants.map((participant, i) => {
                  return (
                    <Paper
                      variant="outlined"
                      className="p-2 rounded flex items-center my-2"
                      key={i}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: blueGrey[500],
                        }}
                        src="/broken-image.jpg"
                      />
                      <div className="ml-2 flex flex-col justify-center">
                        <div className=" text-gray-500 flex items-center">
                          <div>
                            <span className="font-bold text-gray-700">
                              ID:{" "}
                            </span>
                            {participant.participantid}
                          </div>
                          <div className="ml-4">
                            <span className="font-bold text-gray-700">
                              Location:{" "}
                            </span>
                            {participant.currentmode}
                          </div>
                        </div>
                        <div className=" text-gray-500">
                          <span className="font-bold text-gray-700">
                            Balance:{" "}
                          </span>
                          {`$${participant.availablebalance.toFixed(2)}`}
                        </div>
                      </div>
                    </Paper>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full mt-4">
        <Button
          disabled={selectedParticipants.length === 0}
          variant="contained"
          className="w-full h-12"
          onClick={() => setPageTo(2)}
        >
          Detailed Charts
        </Button>
      </div>
    </>
  );

  const getComputedCardHeight = () => {
    const cardHeight = (window.innerHeight - 160) / 2;
    return { height: `${parseInt(cardHeight)}px` };
  };

  const secondPageComponent = (
    <div className="flex flex-col justify-evenly h-full">
      {rightPanelComponents.map((component, i) => {
        return (
          <Tooltip title={"Click to enlarge"} key={i} arrow placement="top">
            <Card
              key={i}
              style={getComputedCardHeight()}
              className="relative w-full overflow-hidden take-cover cursor-pointer flex items-center justify-center"
              onClick={() => {
                changeFocusedChartComponent(component);
              }}
            >
              {component}
            </Card>
          </Tooltip>
        );
      })}
    </div>
  );

  const thirdPageComponent = (
    <div className="flex-1 relative bg-white flex items-center justify-center h-full border border-black-50 rounded-lg">
      <Radar showHelpModal={true} />
    </div>
  );

  const getComponentByPage = () => {
    switch (currentPage) {
      case 1:
        return firstPageComponent;
      case 2:
        return secondPageComponent;
      case 3:
        return <> </>;
      default:
        return firstPageComponent;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {currentPage === 3 ? (
        thirdPageComponent
      ) : (
        <Container
          maxWidth="sm"
          className="px-2 rounded-lg h-full flex flex-col justify-between"
        >
          {getComponentByPage()}
        </Container>
      )}
    </LocalizationProvider>
  );
}
