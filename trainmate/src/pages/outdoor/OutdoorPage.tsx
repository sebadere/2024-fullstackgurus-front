import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
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
  const [workouts, setWorkouts] = useState<OutdoorWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertErrorOpen, setAlertErrorOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('RUNNING');

  const [formData, setFormData] = useState<OutdoorWorkoutPayload>({
    activity_type: 'RUNNING',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 30,
    distance_km: 5,
    elevation_gain_m: 0,
    calories: 300,
    notes: '',
  });

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

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    const notes = (formData.notes || '').slice(0, FIELD_LIMITS.outdoorNotes);
    const durationOk =
      formData.duration_minutes >= OUTDOOR_BOUNDS.durationMinutes.min &&
      formData.duration_minutes <= OUTDOOR_BOUNDS.durationMinutes.max;
    const distanceOk =
      (formData.distance_km ?? 0) >= OUTDOOR_BOUNDS.distanceKm.min &&
      (formData.distance_km ?? 0) <= OUTDOOR_BOUNDS.distanceKm.max;
    const elevationOk =
      (formData.elevation_gain_m ?? 0) >= OUTDOOR_BOUNDS.elevationGainM.min &&
      (formData.elevation_gain_m ?? 0) <= OUTDOOR_BOUNDS.elevationGainM.max;
    const caloriesOk =
      formData.calories >= OUTDOOR_BOUNDS.calories.min &&
      formData.calories <= OUTDOOR_BOUNDS.calories.max;

    if (!formData.date || !durationOk || !distanceOk || !elevationOk || !caloriesOk) {
      setAlertErrorOpen(true);
      return;
    }
    try {
      setLoading(true);
      await addOutdoorWorkout({ ...formData, notes });
      setAlertOpen(true);
      handleCloseDialog();
      await fetchWorkouts();
    } catch (error) {
      console.error('Error saving outdoor workout:', error);
      setAlertErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = workouts.filter((workout) => workout.activity_type === selectedActivity);

  return (
    <Box sx={{ backgroundColor: 'black', color: 'white', p: 4, minHeight: '100vh' }}>
      <TopMiddleAlert alertText='Outdoor session saved' open={alertOpen} onClose={() => setAlertOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Please fill all required fields' open={alertErrorOpen} onClose={() => setAlertErrorOpen(false)} severity='warning' />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
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
              sx={{ color: '#fff' }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#444',
                    color: '#fff',
                  },
                },
              }}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as ActivityType })}
            >
              <MenuItem value="RUNNING">Running</MenuItem>
              <MenuItem value="CYCLING">Cycling</MenuItem>
              <MenuItem value="HIKING">Hiking</MenuItem>
              <MenuItem value="WALKING">Walking</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Duration (minutes)"
            type="number"
            fullWidth
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
            slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.durationMinutes.min, max: OUTDOOR_BOUNDS.durationMinutes.max } }}
          />
          <TextField
            margin="dense"
            label="Distance (km)"
            type="number"
            fullWidth
            InputProps={{ style: { color: '#fff' } }}
            sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
            value={formData.distance_km ?? 0}
            onChange={(e) => setFormData({ ...formData, distance_km: Number(e.target.value) })}
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
              value={formData.elevation_gain_m ?? 0}
              onChange={(e) => setFormData({ ...formData, elevation_gain_m: Number(e.target.value) })}
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
            value={formData.calories}
            onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
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
