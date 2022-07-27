import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import EditIcon from '@mui/icons-material/Edit';
import {
  Badge,
  Button,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper, Switch, Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import {
  DataGrid, GridActionsColDef, GridColDef, GridSortModel,
} from '@mui/x-data-grid';
import capitalize from 'lodash/capitalize';
import { useRouter } from 'next/router';
import {
  ReactElement, useEffect, useMemo, useReducer, useState,
} from 'react';

import { NextPageWithLayout } from '~/pages/_app';
import { Commands } from '~/src/classes/Commands';
import { Layout } from '~/src/components/Layout/main';
import { BotCommandEdit } from '~/src/components/RightDrawer/BotCommandEdit';
import { getPermissionName } from '~/src/helpers/getPermissionName';
import { getSocket } from '~/src/helpers/socket';
import { usePermissions } from '~/src/hooks/usePermissions';
import { useTranslation } from '~/src/hooks/useTranslation';
import theme from '~/src/theme';

import 'simplebar-react/dist/simplebar.min.css';

const PageCommandsBot: NextPageWithLayout = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  const [ items, setItems ] = useState<Commands[]>([]);

  const [ showGroups, setShowGroups ] = useReducer((state: string[], value: string) => {
    if (state.includes(value)) {
      return state.filter(o => o !== value);
    } else {
      return [...state, value];
    }
  }, []);

  const [ loading, setLoading ] = useState(true);
  const { permissions } = usePermissions();

  const [ showOnlyModified, setShowOnlyModified ] = useState(false);

  const groups = useMemo(() => {
    return Array.from(new Set(items.map(o => o.type)));
  }, [items]);

  const columns: (GridColDef | GridActionsColDef)[] = [
    {
      field:      'command', headerName: translate('command'), flex:       1, hideable:   false,renderCell: (params) => {
        return (<Typography>
          {params.row.defaultValue !== params.row.command ? (<>
            <Typography component='span' sx={{ textDecoration: 'line-through' }}>{params.row.defaultValue}</Typography>
            <ArrowRightAltIcon sx={{ mx: 0.5, verticalAlign: 'bottom' }}/>
            {params.row.command}
          </>
          ) : <>{params.row.defaultValue}</>}

        </Typography>);
      },
    },
    {
      field: 'name', headerName: capitalize(translate('name')), flex: 0.5, hideable: false,
    },
    {
      field:      'permission', headerName: translate('permission'), flex:       0.5, hideable:   false,
      renderCell: (params) => {
        return (<Typography color={!params.row.permission ? theme.palette.error.dark : 'undefined'}>
          {params.row.permission === null ? '-- unset --' : getPermissionName(params.row.permission, permissions || [])}
        </Typography>);
      },
    },
    {
      field: 'type', headerName: capitalize(translate('type')), hideable: false,
    },
    {
      field:      'actions',
      type:       'actions',
      hideable:   false,
      align:      'right',
      width:      95,
      getActions: (params) => [
        <Button
          size='small'
          key="edit"
          variant="contained"
          startIcon={<EditIcon/>}
          onClick={() => {
            router.push('/commands/botcommands/edit/' + params.row.id);
          }}>Edit</Button>,
      ],
    },
  ];
  const [ sortModel, setSortModel ] = useState<GridSortModel>([{ field: 'command', sort: 'asc' }]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [router]);

  const refresh = async () => {
    await Promise.all([
      new Promise<void>(resolve => {
        getSocket('/core/general').emit('generic::getCoreCommands', (err, commands) => {
          if (err) {
            resolve();
            return console.error(err);
          }
          setItems(commands);
          resolve();
        });
      }),
    ]);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => showOnlyModified ? item.defaultValue !== item.command : true);
  }, [items, showOnlyModified]);

  return (
    <>
      {groups.length > 0 && <Grid container sx={{ pb: 0.7 }} spacing={1} alignItems='center'>
        {groups.map((group, idx) => (
          <Grid item key={idx}>
            <Button variant={showGroups.includes(group) ? 'contained' : 'outlined'} onClick={() => setShowGroups(group)}>
              <Badge badgeContent={items.filter(o => o.type === group
                && ((showOnlyModified && o.defaultValue !== o.command) || !showOnlyModified)).length}
              sx={{
                '& .MuiBadge-badge': {
                  color:      'white',
                  textShadow: '0px 0px 5px black',
                  position:   'relative',
                  transform:  'scale(1) translate(30%, 1px)',
                  width:      '20px',
                },
              }}
              showZero>
                {group}
              </Badge>
            </Button>
          </Grid>
        )
        )}

        <Grid item xs="auto" mx={2}>
          <FormGroup>
            <FormControlLabel control={<Switch onChange={event => setShowOnlyModified(event.target.checked)} />} label="Show only modified" />
          </FormGroup>
        </Grid>
      </Grid>
      }

      {loading
        ? <CircularProgress color="inherit" sx={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 0)',
        }} />
        : <Paper sx={{
          m: 0, p: 1, height: 'calc(100vh - 117px)',
        }}>
          <DataGrid
            sx={{ border: 0, backgroundColor: grey[900] }}
            rows={filteredItems.filter(o => showGroups.length === 0 || showGroups.includes(o.type))}
            columns={columns}
            sortModel={sortModel}
            onSortModelChange={(model) => setSortModel(model)}
            autoPageSize
            isRowSelectable={() => false}
          />
        </Paper>}
      <BotCommandEdit items={items}/>
    </>
  );
};

PageCommandsBot.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default PageCommandsBot;