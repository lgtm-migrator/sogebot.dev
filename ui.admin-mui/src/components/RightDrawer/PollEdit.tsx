import { Poll } from '@entity/poll';
import { LoadingButton } from '@mui/lab';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, Divider, Fade, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import { red } from '@mui/material/colors';
import axios from 'axios';
import { validateOrReject } from 'class-validator';
import {
  capitalize,
  merge,
} from 'lodash';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useEffect } from 'react';

import getAccessToken from '~/src/getAccessToken';
import { useTranslation } from '~/src/hooks/useTranslation';
import { useValidator } from '~/src/hooks/useValidator';
import { StripTypeORMEntity } from '~/src/types/stripTypeORMEntity';

export const PollEdit: React.FC<{
  items: Poll[]
}> = (props) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [ editDialog, setEditDialog ] = useState(false);
  const [ item, setItem ] = useState<StripTypeORMEntity<Poll>>(new Poll());
  const [ loading, setLoading ] = useState(true);
  const [ saving, setSaving ] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { propsError, reset, setErrors, validate, haveErrors } = useValidator();

  const [ options, setOptions ] = useState(['', '', '', '', '']);

  const handleOptionsChange = useCallback((idx: number, value: string) => {
    setOptions(o => {
      const _o = [...o];
      _o[idx] = value;
      return _o;
    });
  }, []);

  useEffect(() => {
    setItem(i => ({
      ...i, options: options.filter(Boolean),
    }));
  }, [options]);

  const handleValueChange = useCallback(<T extends keyof Poll>(key: T, value: Poll[T]) => {
    setItem(i => ({
      ...i, [key]: value,
    }));
  }, []);

  useEffect(() => {
    setLoading(true);
    setItem(new Poll());
    setOptions(['', '', '', '', '']);
    setLoading(false);
    reset();
  }, [router.query.id, props.items, editDialog, reset]);

  useEffect(() => {
    if (!loading && editDialog && item) {
      const toCheck = new Poll();
      merge(toCheck, item);
      console.log('Validating', toCheck);
      validateOrReject(toCheck)
        .then(() => setErrors(null))
        .catch(setErrors);
    }
  }, [item, loading, editDialog, setErrors]);

  useEffect(() => {
    if (router.asPath.includes('polls/create') ) {
      setEditDialog(true);
    } else {
      setEditDialog(false);
    }
  }, [router]);

  const handleClose = () => {
    setEditDialog(false);
    setTimeout(() => {
      router.push('/manage/polls');
    }, 200);
  };

  const handleSave = () => {
    setSaving(true);
    axios.post(`${localStorage.server}/api/systems/polls`,
      item,
      { headers: { authorization: `Bearer ${getAccessToken()}` } })
      .then(() => {
        enqueueSnackbar('Poll saved.', { variant: 'success' });
        router.push(`/manage/polls/`);
      })
      .catch(e => {
        validate(e.response.data.errors);
      })
      .finally(() => setSaving(false));
  };

  return(<Dialog
    open={editDialog}
    fullWidth
    maxWidth='md'
  >
    {loading
      && <Grid
        sx={{ pt: 10 }}
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      ><CircularProgress color="inherit" /></Grid>}
    <Fade in={!loading}>
      <DialogContent>
        <Box
          component="form"
          sx={{ '& .MuiFormControl-root': { my: 0.5 } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            {...propsError('title')}
            variant="filled"
            value={item?.title || ''}
            required
            label={capitalize(translate('title'))}
            onChange={(event) => handleValueChange('title', event.target.value)}
            sx={{ margin: 0 }}
          />

          <FormControl fullWidth sx={{ marginBottom: 2 }}>
            <InputLabel variant='filled' id="poll-options-label">{capitalize(translate('systems.polls.votingBy'))}</InputLabel>
            <Select
              variant='filled'
              labelId="poll-options-label"
              value={item?.type || 'normal'}
              label={capitalize(translate('systems.polls.votingBy'))}
              onChange={(event) => handleValueChange('type', event.target.value as any)}
            >
              {['tips', 'bits', 'normal', 'numbers'].map((o, idx) => <MenuItem key={o + idx} value={o}>{capitalize(translate('systems.polls.' + o))}</MenuItem>)}
            </Select>
          </FormControl>

          {options.map((o, idx) => <TextField
            key={idx}
            variant="filled"
            value={o}
            label={`Answer ${idx + 1}`}
            onInput={propsError('options').onInput}
            error={propsError('options').error}
            onChange={(event) => handleOptionsChange(idx, event.target.value)}
          />)}

          {propsError('options').helperText && <Typography color={red[500]} sx={{ marginLeft: 2 }}>{propsError('options').helperText}</Typography>}
        </Box>
      </DialogContent>
    </Fade>
    <Divider/>
    <Box sx={{ p: 1 }}>
      <Grid container sx={{ height: '100%' }} justifyContent={'space-between'} spacing={1}>
        <Grid item></Grid>
        <Grid item>
          <Stack spacing={1} direction='row'>
            <Button sx={{ width: 150 }} onClick={handleClose}>Close</Button>
            <LoadingButton variant='contained' color='primary' sx={{ width: 150 }} onClick={handleSave} loading={saving} disabled={haveErrors}>Save</LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </Dialog>);
};