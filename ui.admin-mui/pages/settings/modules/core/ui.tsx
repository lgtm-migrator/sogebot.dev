import { ArrowBackIosNewTwoTone } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { IsNotEmpty, validateOrReject } from 'class-validator';
import {
  cloneDeep, get, set,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  ReactElement, useCallback, useEffect, useState,
} from 'react';

import { NextPageWithLayout } from '~/pages/_app';
import { Layout } from '~/src/components/Layout/main';
import { saveSettings } from '~/src/helpers/settings';
import { getSocket } from '~/src/helpers/socket';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';

class Settings {
  @IsNotEmpty()
    domain: string;
}

const PageSettingsModulesCoreSocket: NextPageWithLayout = () => {
  const socketEndpoint = '/core/ui';

  const router = useRouter();
  const { translate } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [ loading, setLoading ] = useState(true);
  const [ settings, setSettings ] = useState<null | Record<string, any>>(null);
  // const [ ui, setUI ] = useState<null | Record<string, any>>(null);

  const { propsError, setErrors, haveErrors } = useValidator({ translations: { domain: translate('core.ui.settings.domain.title') } });

  useEffect(() => {
    if (!loading && settings) {
      const toCheck = new Settings();
      toCheck.domain = settings.domain[0];
      validateOrReject(toCheck, { always: true })
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [loading, settings, setErrors]);

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
          resolve();
        });
    });
    setLoading(false);
  }, [ ]);

  useEffect(() => {
    refresh();
  }, [ router, refresh ]);

  const [ saving, setSaving ] = useState(false);
  const save = useCallback(() => {
    if (settings) {
      setSaving(true);
      saveSettings(socketEndpoint, settings)
        .then(() => {
          enqueueSnackbar('Settings saved.', { variant: 'success' });
        })
        .finally(() => setSaving(false));
    }
  }, [ settings, enqueueSnackbar ]);

  const handleChange = (key: string, value: any): void => {
    setSettings((settingsObj) => {
      if (!settingsObj) {
        return null;
      }
      const newSettingsObj = cloneDeep(settingsObj);
      set(newSettingsObj, key, [value, get(settingsObj, `${key}[1]`)]);
      return newSettingsObj;
    });
  };

  return (
    <Box sx={{
      maxWidth: 960, m: 'auto',
    }}>
      <Button sx={{ mb: 1 }} onClick={() => router.push('/settings/modules')}><ArrowBackIosNewTwoTone sx={{ pr: 1 }}/>{translate('menu.modules')}</Button>
      <Typography variant='h1' sx={{ pb: 2 }}>UI</Typography>
      <Typography variant='h3' sx={{ pb: 2 }}>{ translate('categories.general') }</Typography>
      {settings && <Paper elevation={1} sx={{ p: 1 }}>
        <TextField
          {...propsError('domain')}
          fullWidth
          variant="filled"
          required
          value={settings.domain[0]}
          label={translate('core.ui.settings.domain.title')}
          onChange={(event) => handleChange('domain', event.target.value)}
        />

        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.enablePublicPage[0]} onChange={(_, checked) => handleChange('enablePublicPage', checked)} />} label={translate('core.ui.settings.enablePublicPage')} />
        </FormGroup>

        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.percentage[0]} onChange={(_, checked) => handleChange('percentage', checked)} />} label={translate('core.ui.settings.percentage')} />
        </FormGroup>

        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.shortennumbers[0]} onChange={(_, checked) => handleChange('shortennumbers', checked)} />} label={translate('core.ui.settings.shortennumbers')} />
        </FormGroup>

        <FormGroup>
          <FormControlLabel control={<Checkbox checked={settings.showdiff[0]} onChange={(_, checked) => handleChange('showdiff', checked)} />} label={translate('core.ui.settings.showdiff')} />
        </FormGroup>
      </Paper>
      }

      <Stack direction='row' justifyContent='center' sx={{ pt: 2 }}>
        <LoadingButton sx={{ width: 300 }} variant='contained' loading={saving} type="submit" onClick={save} disabled={haveErrors}>Save changes</LoadingButton>
      </Stack>

      <Backdrop open={loading} >
        <CircularProgress color="inherit"/>
      </Backdrop>
    </Box>
  );
};

PageSettingsModulesCoreSocket.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageSettingsModulesCoreSocket;
