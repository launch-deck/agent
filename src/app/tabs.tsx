import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import React, { useEffect } from "react";
import Connect from "./connect";
import Tiles from "./tiles";
import { useAppDispatch } from "./redux/hooks";
import { fetchData } from "./redux/agent-data-slice";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    if (value === index) {
        return (
            <div
                role="tabpanel"
                style={{ overflow: 'hidden' }}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}>
                {value === index && (
                    <Box sx={{ p: 3, display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
                        {children}
                    </Box>
                )}
            </div>
        );
    }

    return (<></>);
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function BasicTabs() {

    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchData())
    }, [dispatch])

    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateRows: 'auto 1fr'
        }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Connect" {...a11yProps(0)} />
                    <Tab label="Tiles" {...a11yProps(1)} />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <Typography variant="h2">Connect</Typography>
                <Connect></Connect>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Typography variant="h2">Tiles</Typography>
                <Tiles></Tiles>
            </TabPanel>
        </Box>
    );
}
