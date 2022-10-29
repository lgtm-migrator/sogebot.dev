import { SettingsTwoTone } from '@mui/icons-material';
import {
  Backdrop,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Switch,
  Typography,
} from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import { Stack } from '@mui/system';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useMemo, useState,
} from 'react';
import { possibleLists } from '~/../backend/d.ts/src/helpers/socket';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';

type systemFromIO = { name: string; enabled: boolean; areDependenciesEnabled: boolean; isDisabledByEnv: boolean, type: string };

const canBeDisabled = (item: systemFromIO) => {
  return item.type !== 'core' && item.type !== 'services';
};
const haveAnySettings = (item: systemFromIO) => {
  const configurableList = [
    'core|dashboard', 'core|tts', 'core|emotes', 'core|currency',
    'core|general', 'core|socket', 'core|updater', 'core|ui',

    'services|google', 'services|twitch',

    'systems|antihateraid', 'systems|points', 'systems|checklist',
    'systems|cooldown', 'systems|highlights', 'systems|polls',
    'systems|emotescombo', 'systems|songs', 'systems|moderation',
    'systems|bets', 'systems|scrim', 'systems|raffles',
    'systems|levels', 'systems|userinfo', 'systems|raffles',

    'integrations|donatello', 'integrations|kofi', 'integrations|tiltify',
    'integrations|discord', 'integrations|donationalerts', 'integrations|lastfm',
    'integrations|obswebsocket', 'integrations|pubg', 'integrations|qiwi',
    'integrations|spotify', 'integrations|streamelements', 'integrations|stramlabs',
    'integrations|tipeeestream', 'integrations|twitter',

    'games|fightme', 'games|duel', 'games|gamble',
    'games|heist', 'games|roulette', 'games|seppuku',
  ];
  return configurableList.includes(`${item.type}|${item.name}`);
};
const canBeDisabledOrHaveSettings = (item: systemFromIO) => {
  return canBeDisabled(item) || haveAnySettings(item);
};

const PageSettingsPermissions: NextPageWithLayout = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const types: possibleLists[] = useMemo(() => ['core', 'services', 'systems', 'integrations', 'games'], []);
  const [items, setItems] = useState([] as systemFromIO[]);

  const [ loading, setLoading ] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setItems([]);
    await Promise.all(
      types.map((type) => new Promise<void>((resolve, reject) => {
        getSocket('/').emit('populateListOf', type, (err, systems) => {
          if (err) {
            enqueueSnackbar(String(err), { variant: 'error' });
            reject();
            return;
          }

          setItems(i => ([
            ...i,
            ...systems.sort((a, b) => {
              return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
            }) as any,
          ]));

          resolve();
          setLoading(false);
        });

      }))
    );
  }, [ enqueueSnackbar, translate, types ]);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  return (
    <>
      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>

      {types.map(type => {
        return <Card variant='elevation' key={type}>
          <CardContent sx={{
            p: 1, '&:last-child': { p: 1 },
          }}>
            <Divider sx={{ mb: 2 }}><Typography variant='caption' sx={{ fontSize: '20px' }}>{translate('menu.' + type)}</Typography></Divider>

            <Grid container spacing={1}>
              {items.filter(o => o.type === type && canBeDisabledOrHaveSettings(o)).map(item => {
                return <Grid item xs={12} sm={6} md={4} lg={4} xl={2} key={`${type}-${item.name}`}>
                  <Card variant='elevation' sx={{ backgroundColor: blueGrey[900] }}>
                    <CardContent sx={{
                      p: 1, '&:last-child': { p: 1 },
                    }}>
                      <Stack direction={'row'} alignItems='center' justifyContent='space-between'>
                        <Typography variant='button'>{item.name}</Typography>
                        <Box sx={{ width: `${(canBeDisabled(item) ? 58 : 0) + (haveAnySettings(item) ? 40 : 0)}px` }}>
                          {canBeDisabled(item) && <Switch defaultChecked />}
                          {haveAnySettings(item) && <IconButton onClick={() => router.push(`/settings/modules/${item.type}/${item.name}`)}><SettingsTwoTone /></IconButton>}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>;
              })}
            </Grid>
          </CardContent>
        </Card>;
      }
      )}
    </>
  );
};

PageSettingsPermissions.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsPermissions;