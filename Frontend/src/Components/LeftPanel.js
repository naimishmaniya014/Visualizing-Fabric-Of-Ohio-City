import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { DateTimeContext } from '../context';
import { useContext } from 'react';

export default function LeftPanel() {
    const dateTimeContext = useContext(DateTimeContext)
    const dateTime = dateTimeContext.dateTime
    const setDateTime = dateTimeContext.setDateTime

    function changeDate(djsObj) {
        const date = djsObj.format("YYYY-MM-DD");
        const time = dateTime.split(" ")[1];
        setDateTime(date+" "+time);
    }

    function changeTime(e) {
        const date = dateTime.split(" ")[0];
        const time = e.target.value;
        setDateTime(date+" "+time);
    }

    function shouldDisableDate(date) {
        return date.isBefore(dayjs("2022-03-01")) || date.isAfter(dayjs("2023-05-22"));
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="flex items-center">
                <div>
                    <InputLabel id="date-label">Date</InputLabel>
                    <DatePicker labelId="date-label" id="date-select" value={dayjs( dateTime.split(" ")[0] )} onChange={changeDate} shouldDisableDate={shouldDisableDate} />
                </div>
                <div>
                    <InputLabel id="time-label">Time</InputLabel>
                    <Select
                        labelId="time-label"
                        id="time-select"
                        value={dateTime.split(" ")[1]}
                        label="Time"
                        onChange={changeTime}
                    >
                        {
                            [...Array(24).keys()].map((hour,i) => {
                                return <MenuItem key={i} value={hour}>{`${hour}:00`}</MenuItem>
                            })
                        }
                    </Select>
                </div>
            </div>
        </LocalizationProvider>
    )
}