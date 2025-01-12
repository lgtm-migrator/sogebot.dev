import { TabContext, TabList } from '@mui/lab';
import {
  Box, Card, Tab,
} from '@mui/material';
import * as React from 'react';

import { classes } from '~/src/components/styles';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import theme from '~/src/theme';

export const DashboardWidgetTwitch: React.FC = () => {
  const { translate } = useTranslation();

  const [value, setValue] = React.useState('1');
  const [room, setRoom] = React.useState('');

  const [height, setHeight] = React.useState(0);
  const ref = React.createRef<HTMLDivElement>();

  React.useEffect(() => {
    getSocket('/widgets/chat').emit('room', (err, val) => {
      if (err) {
        return console.error(err);
      }
      setRoom(val);
    });

    if (ref.current) {
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = ref.current.getBoundingClientRect();
      const offset   = elemRect.top - bodyRect.top;
      setHeight(window.innerHeight - offset - 3);
    }
  }, [ref]);

  const videoUrl = React.useMemo(() => {
    return `${window.location.protocol}//player.twitch.tv/?channel=${room}&autoplay=true&muted=true&parent=${window.location.hostname}`;
  }, [room]);

  const chatUrl = React.useMemo(() => {
    return 'https://twitch.tv/embed/'
      + room
      + '/chat'
      + '?darkpopout'
      + '&parent=' + window.location.hostname;
  }, [room]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Card variant="outlined" sx={{ height: height + 'px' }} ref={ref}>
      <TabContext value={value}>
        <Box sx={{
          borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.grey[900],
        }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label={translate('widget-title-chat')} value="1" />
            <Tab label={translate('widget-title-monitor')} value="2" />
          </TabList>
        </Box>
        <Box sx={{
          position: 'relative', height: 'calc(100% - 48px);', 
        }}>
          <Box sx={{
            ...(value === '1' ? classes.showTab : classes.hideTab), height: '100%', width: '100%', 
          }}>
            <iframe
              frameBorder="0"
              scrolling="no"
              src={chatUrl}
              width="100%"
              height="100%"
            />
          </Box>
          <Box sx={{
            ...(value === '2' ? classes.showTab : classes.hideTab), height: '100%', width: '100%', 
          }}>
            <iframe
              frameBorder="0"
              scrolling="no"
              src={videoUrl}
              width="100%"
              height="100%"
            />
          </Box>
        </Box>
      </TabContext>
    </Card>
  );
};
