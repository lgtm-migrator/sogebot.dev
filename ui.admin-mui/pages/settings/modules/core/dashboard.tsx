import {
  DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ArrowBackIosNewTwoTone, SwapVertTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import { isEqual } from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import { v4 } from 'uuid';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { DashboardSortableItem } from '~/src/components/Sortable/DashboardSortableItem';
import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

const PageSettingsModulesCoreDashboard: NextPageWithLayout = () => {
  const socketEndpoint = '/core/dashboard';

  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ loading, setLoading ] = useState(true);
  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  const [ settingsInit, setSettingsInit ] = useState<null | Record<string, any>>(null);
  // const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    await new Promise<void>((resolve, reject) => {
      getSocket(socketEndpoint)
        .emit('settings', (err, _settings: {
          [x: string]: any
        }, /* _ui: {
          [x: string]: {
            [attr: string]: any
          }
        }*/ ) => {
          if (err) {
            reject(err);
            return;
          }
          // setUI(_ui);
          setSettings(_settings);
          setSettingsInit(_settings);
          resolve();
        });
    });
    setLoading(false);
  }, [ ]);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const isSettingsChanged = useMemo(() => {
    return isEqual(settings, settingsInit);
  }, [ settings, settingsInit]);

  const [ saving, setSaving ] = useState(false);
  const save = useCallback(() => {
    if (settings) {
      setSaving(true);
      saveSettings(socketEndpoint, settings)
        .then(() => {
          setSettingsInit(settings);
          enqueueSnackbar('Settings saved.', { variant: 'success' });
        })
        .finally(() => setSaving(false));
    }
  }, [ settings, enqueueSnackbar ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: { active: any; over: any; }) {
    const { active, over } = event;

    if (!active || !over) {
      return;
    }
    if (active.id !== over.id) {
      setSettings((s) => {
        if (s) {
          const oldIndex = s.µWidgets[0].indexOf(active.id);
          const newIndex = s.µWidgets[0].indexOf(over.id);
          return {
            ...s,
            µWidgets: [
              arrayMove(s.µWidgets[0], oldIndex, newIndex),
              s.µWidgets[1],
            ],
          };
        } else {
          return s;
        }
      });
    }
    setActiveId(null);
  }
  const [activeId, setActiveId] = useState<null | string>(null);

  function handleDragStart(event: { active: any; }) {
    const { active } = event;
    setActiveId(active.id);
  }

  const availableµWidgetsFiltered = useMemo(() => {
    const availableµWidgets = [
      'twitch|status',
      'twitch|uptime',
      'twitch|viewers',
      'twitch|maxViewers',
      'twitch|newChatters',
      'twitch|chatMessages',
      'twitch|followers',
      'twitch|subscribers',
      'twitch|bits',
      'general|tips',
      'twitch|watchedTime',
      'general|currentSong',
    ];

    if (!settings) {
      return availableµWidgets;
    }

    return availableµWidgets.filter(o => {
      return settings.µWidgets[0].filter((p: string) => p.includes(o)).length === 0;
    });
  }, [settings ]);

  const [clickedId, setClickedId] = useState<null | string>(null);

  const swapItems = useCallback(() => {
    if (!clickedId) {
      return;
    }

    setSettings((s) => {
      if (s) {
        const newClickedId = availableµWidgetsFiltered.includes(clickedId)
          ? clickedId + `|${v4()}`
          : clickedId.split('|').filter((_, idx) => idx < 2).join('|');
        console.log({ newClickedId });
        setClickedId(newClickedId);
        return {
          ...s,
          µWidgets: [
            availableµWidgetsFiltered.includes(clickedId)
              ? [...s.µWidgets[0], newClickedId]
              : s.µWidgets[0].filter((o: string) => !o.includes(newClickedId)),
            s.µWidgets[1],
          ],
        };
      } else {
        return s;
      }
    });
  }, [clickedId, availableµWidgetsFiltered]);

  return (
    <Box sx={{
      maxWidth: 960, m: 'auto', 
    }}>
      <Button sx={{ mb: 1 }} onClick={() => router.push('/settings/modules')}><ArrowBackIosNewTwoTone sx={{ pr: 1 }}/>{translate('menu.modules')}</Button>

      <Typography variant='h1' sx={{ pb: 2 }}>Dashboard</Typography>
      <Typography variant='h3' sx={{ pb: 2 }}>{ translate('categories.general') }</Typography>
      {settings && <Paper elevation={1} sx={{ p: 1 }}>
        <Divider><Typography variant='h5'>µWidgets</Typography></Divider>
        <Paper sx={{
          p: 2, m: 2, backgroundColor: blueGrey[900],
        }} variant='outlined'>
          <Divider><Typography variant='h6'>Used</Typography></Divider>
          <Grid container spacing={1} sx={{ pt: 2 }}>
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
            >
              <SortableContext
                items={settings.µWidgets[0]}
                strategy={rectSortingStrategy}
              >
                {settings.µWidgets[0].map((item: string) => <DashboardSortableItem draggable onClick={() => setClickedId(clickedId === item ? null : item)} key={item} id={item} isClicked={item === clickedId} isDragging={item === activeId} />)}
              </SortableContext>
            </DndContext>
          </Grid>

          <Box textAlign={'center'} sx={{ p: 2 }}>
            <Button disabled={!clickedId} variant='contained' sx={{ minWidth: 300 }} onClick={swapItems}><SwapVertTwoTone/></Button>
          </Box>

          <Divider><Typography variant='h6'>Available</Typography></Divider>
          <Grid container spacing={1} sx={{ pt: 2 }}>
            {availableµWidgetsFiltered.map((item: string) => <DashboardSortableItem onClick={() => setClickedId(clickedId === item ? null : item)} key={item} id={item} isClicked={item === clickedId} isDragging={item === activeId} />)}
          </Grid>
        </Paper>
      </Paper>
      }

      <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
        <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} onClick={save} disabled={isSettingsChanged}>Save changes</LoadingButton>
      </Stack>

      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>
    </Box>
  );
};

PageSettingsModulesCoreDashboard.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsModulesCoreDashboard;
