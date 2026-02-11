import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { ArrowBack as ArrowLeftIcon } from '@mui/icons-material';
import { grey } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';
import { addOutdoorWorkout, getOutdoorWorkouts, OutdoorWorkoutPayload } from '../../api/OutdoorWorkoutsApi';
import { FIELD_LIMITS } from '../../constants';
import LoadingButton from '../../personalizedComponents/buttons/LoadingButton';
import TopMiddleAlert from '../../personalizedComponents/TopMiddleAlert';

type ActivityType = 'RUNNING' | 'CYCLING' | 'HIKING' | 'WALKING';

interface OutdoorWorkout {
  id: string;
  activity_type: ActivityType;
  date: string;
  duration_minutes: number;
  distance_km: number;
  elevation_gain_m: number;
  calories: number;
  notes?: string;
}

interface OutdoorFormState {
  activity_type: ActivityType;
  date: string;
  duration_minutes: string;
  distance_km: string;
  elevation_gain_m: string;
  calories: string;
  notes: string;
}

interface OutdoorFormErrors {
  activity_type?: string;
  date?: string;
  duration_minutes?: string;
  distance_km?: string;
  elevation_gain_m?: string;
  calories?: string;
}

const activityLabels: Record<ActivityType, string> = {
  RUNNING: 'Running',
  CYCLING: 'Cycling',
  HIKING: 'Hiking',
  WALKING: 'Walking',
};

const OUTDOOR_BOUNDS = {
  durationMinutes: { min: 1, max: 600 },
  distanceKm: { min: 0, max: 300 },
  elevationGainM: { min: 0, max: 10000 },
  calories: { min: 1, max: 5000 },
} as const;

const OutdoorPage: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<OutdoorWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertErrorOpen, setAlertErrorOpen] = useState(false);
  const [alertErrorText, setAlertErrorText] = useState('Please review highlighted fields');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('RUNNING');
  const [formErrors, setFormErrors] = useState<OutdoorFormErrors>({});

  const [formData, setFormData] = useState<OutdoorFormState>({
    activity_type: 'RUNNING',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '30',
    distance_km: '5',
    elevation_gain_m: '0',
    calories: '300',
    notes: '',
  });

  const resetFormData = () => {
    setFormData({
      activity_type: 'RUNNING',
      date: new Date().toISOString().split('T')[0],
      duration_minutes: '30',
      distance_km: '5',
      elevation_gain_m: '0',
      calories: '300',
      notes: '',
    });
    setFormErrors({});
  };

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const data = await getOutdoorWorkouts();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching outdoor workouts:', error);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleBackToHome = () => {
    navigate('/homepage');
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetFormData();
  };

  const handleSave = async () => {
    const notes = (formData.notes || '').slice(0, FIELD_LIMITS.outdoorNotes);
    const duration = Number(formData.duration_minutes);
    const distance = formData.distance_km === '' ? 0 : Number(formData.distance_km);
    const elevation = formData.elevation_gain_m === '' ? 0 : Number(formData.elevation_gain_m);
    const calories = Number(formData.calories);

    const errors: OutdoorFormErrors = {};
    if (!formData.activity_type) errors.activity_type = 'Activity is required';
    if (!formData.date) errors.date = 'Date is required';
    if (formData.duration_minutes.trim() === '') {
      errors.duration_minutes = 'Duration is required';
    }
    if (formData.calories.trim() === '') {
      errors.calories = 'Calories is required';
    }
    const durationOk =
      Number.isFinite(duration) &&
      duration >= OUTDOOR_BOUNDS.durationMinutes.min &&
      duration <= OUTDOOR_BOUNDS.durationMinutes.max;
    const distanceOk =
      Number.isFinite(distance) &&
      distance >= OUTDOOR_BOUNDS.distanceKm.min &&
      distance <= OUTDOOR_BOUNDS.distanceKm.max;
    const elevationOk =
      Number.isFinite(elevation) &&
      elevation >= OUTDOOR_BOUNDS.elevationGainM.min &&
      elevation <= OUTDOOR_BOUNDS.elevationGainM.max;
    const caloriesOk =
      Number.isFinite(calories) &&
      calories >= OUTDOOR_BOUNDS.calories.min &&
      calories <= OUTDOOR_BOUNDS.calories.max;

    if (!errors.duration_minutes && !durationOk) {
      errors.duration_minutes = `Duration must be between ${OUTDOOR_BOUNDS.durationMinutes.min} and ${OUTDOOR_BOUNDS.durationMinutes.max}`;
    }
    if (!distanceOk) {
      errors.distance_km = `Distance must be between ${OUTDOOR_BOUNDS.distanceKm.min} and ${OUTDOOR_BOUNDS.distanceKm.max}`;
    }
    if (!elevationOk) {
      errors.elevation_gain_m = `Elevation must be between ${OUTDOOR_BOUNDS.elevationGainM.min} and ${OUTDOOR_BOUNDS.elevationGainM.max}`;
    }
    if (!errors.calories && !caloriesOk) {
      errors.calories = `Calories must be between ${OUTDOOR_BOUNDS.calories.min} and ${OUTDOOR_BOUNDS.calories.max}`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setAlertErrorText('Please review highlighted fields');
      setAlertErrorOpen(true);
      return;
    }

    const payload: OutdoorWorkoutPayload = {
      activity_type: formData.activity_type,
      date: formData.date,
      duration_minutes: duration,
      distance_km: distance,
      elevation_gain_m: formData.activity_type === 'HIKING' ? elevation : 0,
      calories,
      notes,
    };

    try {
      setLoading(true);
      await addOutdoorWorkout(payload);
      setAlertOpen(true);
      handleCloseDialog();
      await fetchWorkouts();
    } catch (error) {
      console.error('Error saving outdoor workout:', error);
      setAlertErrorText('Could not save outdoor session');
      setAlertErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = workouts.filter((workout) => workout.activity_type === selectedActivity);

  return (
    <Box sx={{ backgroundColor: 'black', color: 'white', p: 4, minHeight: '100vh' }}>
      <TopMiddleAlert alertText='Outdoor session saved' open={alertOpen} onClose={() => setAlertOpen(false)} severity='success' />
      <TopMiddleAlert alertText={alertErrorText} open={alertErrorOpen} onClose={() => setAlertErrorOpen(false)} severity='warning' />

      <Box component="header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton component="a" sx={{ color: 'white' }} onClick={handleBackToHome}>
            <ArrowLeftIcon />
          </IconButton>
          <img
            src={require('../../images/logo.png')}
            alt="Logo"
            width={200}
            height={150}
            className="hidden md:block"
          />
        </Box>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.2rem', sm: '1.6rem', md: '2rem' } }}>
          Outdoor Workouts
        </Typography>
        <Button variant="outlined" sx={{ color: grey[50], borderColor: grey[700] }} onClick={handleOpenDialog}>
          Add Outdoor Session
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {(['RUNNING', 'CYCLING', 'HIKING', 'WALKING'] as ActivityType[]).map((activity) => (
          <Button
            key={activity}
            variant={selectedActivity === activity ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: selectedActivity === activity ? grey[700] : 'transparent',
              borderColor: grey[600],
              color: grey[50],
            }}
            onClick={() => setSelectedActivity(activity)}
          >
            {activityLabels[activity]}
          </Button>
        ))}
      </Box>

      <Card sx={{ backgroundColor: '#161616', color: '#fff' }}>
        <CardHeader title={`Latest ${activityLabels[selectedActivity]} Sessions`} />
        <CardContent>
          {loading ? (
            <Typography sx={{ color: grey[400] }}>Loading sessions...</Typography>
          ) : filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <Box key={workout.id} sx={{ mb: 2, p: 2, backgroundColor: grey[800], borderRadius: 2 }}>
                <Typography sx={{ color: '#81d8d0', fontWeight: 'bold' }}>
                  {activityLabels[workout.activity_type]} · {new Date(workout.date).toLocaleDateString()}
                </Typography>
                <Typography sx={{ color: grey[200] }}>
                  {`Duration: ${workout.duration_minutes} min`}
                </Typography>
                <Typography sx={{ color: grey[200] }}>
                  {`Distance: ${workout.distance_km ?? 0} km`}
                </Typography>
                {workout.activity_type === 'HIKING' && (
                  <Typography sx={{ color: grey[200] }}>
                    {`Elevation: ${workout.elevation_gain_m ?? 0} m`}
                  </Typography>
                )}
                <Typography sx={{ color: '#44f814' }}>
                  {`Calories: ${workout.calories} kcal`}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography sx={{ color: grey[400] }}>No sessions for this activity.</Typography>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff',
            borderRadius: '8px',
            padding: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Add Outdoor Session</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="activity-type-label" sx={{ color: '#fff' }}>Activity</InputLabel>
            <Select
              labelId="activity-type-label"
              value={formData.activity_type}
              label="Activity"
              error={Boolean(formErrors.activity_type)}
              sx={{ color: '#fff' }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#444',
                    color: '#fff',
                  },
                },
              }}
              onChange={(e) => {
                setFormData({ ...formData, activity_type: e.target.value as ActivityType });
                setFormErrors((prev) => ({ ...prev, activity_type: undefined }));
              }}
            >
              <MenuItem value="RUNNING">Running</MenuItem>
              <MenuItem value="CYCLING">Cycling</MenuItem>
              <MenuItem value="HIKING">Hiking</MenuItem>
              <MenuItem value="WALKING">Walking</MenuItem>
            </Select>
            {formErrors.activity_type && (
              <FormHelperText sx={{ color: '#d32f2f' }}>{formErrors.activity_type}</FormHelperText>
            )}
          </FormControl>

          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
            error={Boolean(formErrors.date)}
            helperText={formErrors.date}
            value={formData.date}
            onChange={(e) => {
              setFormData({ ...formData, date: e.target.value });
              setFormErrors((prev) => ({ ...prev, date: undefined }));
            }}
          />
          <TextField
            margin="dense"
            label="Duration (minutes)"
            type="number"
            fullWidth
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
            error={Boolean(formErrors.duration_minutes)}
            helperText={formErrors.duration_minutes}
            value={formData.duration_minutes}
            onChange={(e) => {
              setFormData({ ...formData, duration_minutes: e.target.value });
              setFormErrors((prev) => ({ ...prev, duration_minutes: undefined }));
            }}
            slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.durationMinutes.min, max: OUTDOOR_BOUNDS.durationMinutes.max } }}
          />
          <TextField
            margin="dense"
            label="Distance (km)"
            type="number"
            fullWidth
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
            error={Boolean(formErrors.distance_km)}
            helperText={formErrors.distance_km}
            value={formData.distance_km}
            onChange={(e) => {
              setFormData({ ...formData, distance_km: e.target.value });
              setFormErrors((prev) => ({ ...prev, distance_km: undefined }));
            }}
            slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.distanceKm.min, max: OUTDOOR_BOUNDS.distanceKm.max } }}
          />
          {formData.activity_type === 'HIKING' && (
            <TextField
              margin="dense"
              label="Elevation Gain (m)"
              type="number"
              fullWidth
              InputProps={{ style: { color: '#fff' } }}
              sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
              error={Boolean(formErrors.elevation_gain_m)}
              helperText={formErrors.elevation_gain_m}
              value={formData.elevation_gain_m}
              onChange={(e) => {
                setFormData({ ...formData, elevation_gain_m: e.target.value });
                setFormErrors((prev) => ({ ...prev, elevation_gain_m: undefined }));
              }}
              slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.elevationGainM.min, max: OUTDOOR_BOUNDS.elevationGainM.max } }}
            />
          )}
          <TextField
            margin="dense"
            label="Calories"
            type="number"
            fullWidth
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
            error={Boolean(formErrors.calories)}
            helperText={formErrors.calories}
            value={formData.calories}
            onChange={(e) => {
              setFormData({ ...formData, calories: e.target.value });
              setFormErrors((prev) => ({ ...prev, calories: undefined }));
            }}
            slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.calories.min, max: OUTDOOR_BOUNDS.calories.max } }}
          />
          <TextField
            margin="dense"
            label="Notes"
            type="text"
            fullWidth
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value.slice(0, FIELD_LIMITS.outdoorNotes) })
            }
            multiline
            minRows={3}
            helperText={`${(formData.notes || '').length}/${FIELD_LIMITS.outdoorNotes}`}
          />
        </DialogContent>
        <DialogActions>
          <LoadingButton
            isLoading={false}
            onClick={handleCloseDialog}
            label="CANCEL"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
          <LoadingButton
            isLoading={loading}
            onClick={handleSave}
            label="SAVE"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OutdoorPage;
