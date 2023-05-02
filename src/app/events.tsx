import Box from "@mui/material/Box";
import { useAppSelector } from "./redux/hooks";

export default function Events() {

    const events = useAppSelector(state => state.events);

    const eventComps = events.map((event, index) => (
        <div key={index}>{event.ns} - {event.value}</div>
    )).reverse().slice(0, 20);

    return (
        <Box>
            {eventComps}
        </Box>
    );
}
