import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { ArrowBack as ArrowLeftIcon } from '@mui/icons-material';
import { grey } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';
import { addOutdoorWorkout, getOutdoorWorkouts, updateOutdoorWorkout, deleteOutdoorWorkout, OutdoorWorkoutPayload } from '../../api/OutdoorWorkoutsApi';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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

const invalidateOutdoorCache = () => {
  localStorage.removeItem('outdoor_workouts');
  localStorage.removeItem('outdoor_workouts_timestamp');
  localStorage.removeItem('calories_duration_per_day');
};

const OutdoorPage: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<OutdoorWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertEditOpen, setAlertEditOpen] = useState(false);
  const [alertDeleteOpen, setAlertDeleteOpen] = useState(false);
  const [alertErrorOpen, setAlertErrorOpen] = useState(false);
  const [alertErrorText, setAlertErrorText] = useState('Please review highlighted fields');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('RUNNING');
  const [formErrors, setFormErrors] = useState<OutdoorFormErrors>({});

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<OutdoorWorkout | null>(null);

  // Edit
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState<OutdoorWorkout | null>(null);
  const [editFormData, setEditFormData] = useState<OutdoorFormState>({
    activity_type: 'RUNNING',
    date: '',
    duration_minutes: '',
    distance_km: '',
    elevation_gain_m: '',
    calories: '',
    notes: '',
  });
  const [editFormErrors, setEditFormErrors] = useState<OutdoorFormErrors>({});

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

  const validateForm = (data: OutdoorFormState, errorsState: OutdoorFormErrors): OutdoorFormErrors => {
    const errors: OutdoorFormErrors = {};
    const duration = Number(data.duration_minutes);
    const distance = data.distance_km === '' ? 0 : Number(data.distance_km);
    const elevation = data.elevation_gain_m === '' ? 0 : Number(data.elevation_gain_m);
    const calories = Number(data.calories);

    if (!data.activity_type) errors.activity_type = 'Activity is required';
    if (!data.date) errors.date = 'Date is required';
    if (data.duration_minutes.trim() === '') {
      errors.duration_minutes = 'Duration is required';
    }
    if (data.calories.trim() === '') {
      errors.calories = 'Calories is required';
    }

    const durationOk = Number.isFinite(duration) && duration >= OUTDOOR_BOUNDS.durationMinutes.min && duration <= OUTDOOR_BOUNDS.durationMinutes.max;
    const distanceOk = Number.isFinite(distance) && distance >= OUTDOOR_BOUNDS.distanceKm.min && distance <= OUTDOOR_BOUNDS.distanceKm.max;
    const elevationOk = Number.isFinite(elevation) && elevation >= OUTDOOR_BOUNDS.elevationGainM.min && elevation <= OUTDOOR_BOUNDS.elevationGainM.max;
    const caloriesOk = Number.isFinite(calories) && calories >= OUTDOOR_BOUNDS.calories.min && calories <= OUTDOOR_BOUNDS.calories.max;

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

    return errors;
  };

  const buildPayload = (data: OutdoorFormState): OutdoorWorkoutPayload => {
    const notes = (data.notes || '').slice(0, FIELD_LIMITS.outdoorNotes);
    return {
      activity_type: data.activity_type,
      date: data.date,
      duration_minutes: Number(data.duration_minutes),
      distance_km: data.distance_km === '' ? 0 : Number(data.distance_km),
      elevation_gain_m: data.activity_type === 'HIKING' ? (data.elevation_gain_m === '' ? 0 : Number(data.elevation_gain_m)) : 0,
      calories: Number(data.calories),
      notes,
    };
  };

  const handleSave = async () => {
    const errors = validateForm(formData, formErrors);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setAlertErrorText('Please review highlighted fields');
      setAlertErrorOpen(true);
      return;
    }

    try {
      setLoading(true);
      await addOutdoorWorkout(buildPayload(formData));
      invalidateOutdoorCache();
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

  // --- Delete confirmation ---
  const handleDeleteClick = (workout: OutdoorWorkout) => {
    setWorkoutToDelete(workout);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workoutToDelete) return;
    try {
      setLoading(true);
      await deleteOutdoorWorkout(workoutToDelete.id);
      invalidateOutdoorCache();
      setDeleteConfirmOpen(false);
      setWorkoutToDelete(null);
      setAlertDeleteOpen(true);
      await fetchWorkouts();
    } catch (error) {
      console.error('Error deleting outdoor workout:', error);
      setAlertErrorText('Could not delete outdoor session');
      setAlertErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setWorkoutToDelete(null);
  };

  // --- Edit ---
  const handleEditClick = (workout: OutdoorWorkout) => {
    setWorkoutToEdit(workout);
    const dateMatch = workout.date.match(/(\d{4}-\d{2}-\d{2})/);
    setEditFormData({
      activity_type: workout.activity_type,
      date: dateMatch ? dateMatch[1] : workout.date,
      duration_minutes: String(workout.duration_minutes),
      distance_km: String(workout.distance_km ?? 0),
      elevation_gain_m: String(workout.elevation_gain_m ?? 0),
      calories: String(workout.calories),
      notes: workout.notes || '',
    });
    setEditFormErrors({});
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setWorkoutToEdit(null);
    setEditFormErrors({});
  };

  const handleEditSave = async () => {
    if (!workoutToEdit) return;

    const errors = validateForm(editFormData, editFormErrors);
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      setAlertErrorText('Please review highlighted fields');
      setAlertErrorOpen(true);
      return;
    }

    try {
      setLoading(true);
      await updateOutdoorWorkout(workoutToEdit.id, buildPayload(editFormData));
      invalidateOutdoorCache();
      setAlertEditOpen(true);
      handleEditClose();
      await fetchWorkouts();
    } catch (error) {
      console.error('Error updating outdoor workout:', error);
      setAlertErrorText('Could not update outdoor session');
      setAlertErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = workouts.filter((workout) => workout.activity_type === selectedActivity);

  // Shared form fields renderer
  const renderFormFields = (
    data: OutdoorFormState,
    setData: React.Dispatch<React.SetStateAction<OutdoorFormState>>,
    errors: OutdoorFormErrors,
    setErrors: React.Dispatch<React.SetStateAction<OutdoorFormErrors>>
  ) => (
    <>
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="activity-type-label" sx={{ color: '#fff' }}>Activity</InputLabel>
        <Select
          labelId="activity-type-label"
          value={data.activity_type}
          label="Activity"
          error={Boolean(errors.activity_type)}
          sx={{ color: '#fff' }}
          MenuProps={{ PaperProps: { sx: { backgroundColor: '#444', color: '#fff' } } }}
          onChange={(e) => {
            setData({ ...data, activity_type: e.target.value as ActivityType });
            setErrors((prev) => ({ ...prev, activity_type: undefined }));
          }}
        >
          <MenuItem value="RUNNING">Running</MenuItem>
          <MenuItem value="CYCLING">Cycling</MenuItem>
          <MenuItem value="HIKING">Hiking</MenuItem>
          <MenuItem value="WALKING">Walking</MenuItem>
        </Select>
        {errors.activity_type && (
          <FormHelperText sx={{ color: '#d32f2f' }}>{errors.activity_type}</FormHelperText>
        )}
      </FormControl>

      <TextField margin="dense" label="Date" type="date" fullWidth
        InputLabelProps={{ shrink: true }} InputProps={{ style: { color: '#fff' } }}
        sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
        error={Boolean(errors.date)} helperText={errors.date} value={data.date}
        onChange={(e) => { setData({ ...data, date: e.target.value }); setErrors((prev) => ({ ...prev, date: undefined })); }}
      />
      <TextField margin="dense" label="Duration (minutes)" type="number" fullWidth
        InputProps={{ style: { color: '#fff' } }} sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
        error={Boolean(errors.duration_minutes)} helperText={errors.duration_minutes} value={data.duration_minutes}
        onChange={(e) => { setData({ ...data, duration_minutes: e.target.value }); setErrors((prev) => ({ ...prev, duration_minutes: undefined })); }}
        slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.durationMinutes.min, max: OUTDOOR_BOUNDS.durationMinutes.max } }}
      />
      <TextField margin="dense" label="Distance (km)" type="number" fullWidth
        InputProps={{ style: { color: '#fff' } }} sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
        error={Boolean(errors.distance_km)} helperText={errors.distance_km} value={data.distance_km}
        onChange={(e) => { setData({ ...data, distance_km: e.target.value }); setErrors((prev) => ({ ...prev, distance_km: undefined })); }}
        slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.distanceKm.min, max: OUTDOOR_BOUNDS.distanceKm.max } }}
      />
      {data.activity_type === 'HIKING' && (
        <TextField margin="dense" label="Elevation Gain (m)" type="number" fullWidth
          InputProps={{ style: { color: '#fff' } }} sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
          error={Boolean(errors.elevation_gain_m)} helperText={errors.elevation_gain_m} value={data.elevation_gain_m}
          onChange={(e) => { setData({ ...data, elevation_gain_m: e.target.value }); setErrors((prev) => ({ ...prev, elevation_gain_m: undefined })); }}
          slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.elevationGainM.min, max: OUTDOOR_BOUNDS.elevationGainM.max } }}
        />
      )}
      <TextField margin="dense" label="Calories" type="number" fullWidth
        InputProps={{ style: { color: '#fff' } }} sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
        error={Boolean(errors.calories)} helperText={errors.calories} value={data.calories}
        onChange={(e) => { setData({ ...data, calories: e.target.value }); setErrors((prev) => ({ ...prev, calories: undefined })); }}
        slotProps={{ htmlInput: { min: OUTDOOR_BOUNDS.calories.min, max: OUTDOOR_BOUNDS.calories.max } }}
      />
      <TextField margin="dense" label="Notes" type="text" fullWidth
        InputProps={{ style: { color: '#fff' } }} sx={{ '& .MuiInputLabel-root': { color: '#fff' } }}
        value={data.notes}
        onChange={(e) => setData({ ...data, notes: e.target.value.slice(0, FIELD_LIMITS.outdoorNotes) })}
        multiline minRows={3}
        helperText={`${(data.notes || '').length}/${FIELD_LIMITS.outdoorNotes}`}
      />
    </>
  );

  const dialogPaperProps = {
    sx: {
      backgroundColor: grey[800],
      color: '#fff',
      borderRadius: '8px',
      padding: 2,
    },
  };

  return (
    <Box sx={{ backgroundColor: 'black', color: 'white', p: 4, minHeight: '100vh' }}>
      <TopMiddleAlert alertText='Outdoor session saved' open={alertOpen} onClose={() => setAlertOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Outdoor session updated' open={alertEditOpen} onClose={() => setAlertEditOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Outdoor session deleted' open={alertDeleteOpen} onClose={() => setAlertDeleteOpen(false)} severity='success' />
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
              <Box key={workout.id} sx={{ mb: 2, p: 2, backgroundColor: grey[800], borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
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
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <IconButton onClick={() => handleEditClick(workout)} sx={{ color: '#81d8d0' }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(workout)} sx={{ color: '#E43654' }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))
          ) : (
            <Typography sx={{ color: grey[400] }}>No sessions for this activity.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ color: '#fff' }}>Add Outdoor Session</DialogTitle>
        <DialogContent>
          {renderFormFields(formData, setFormData, formErrors, setFormErrors)}
        </DialogContent>
        <DialogActions>
          <LoadingButton isLoading={false} onClick={handleCloseDialog} label="CANCEL" icon={<></>}
            borderColor="border-transparent" borderWidth="border" bgColor="bg-transparent" color="text-white" />
          <LoadingButton isLoading={loading} onClick={handleSave} label="SAVE" icon={<></>}
            borderColor="border-transparent" borderWidth="border" bgColor="bg-transparent" color="text-white" />
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ color: '#fff' }}>Edit Outdoor Session</DialogTitle>
        <DialogContent>
          {renderFormFields(editFormData, setEditFormData, editFormErrors, setEditFormErrors)}
        </DialogContent>
        <DialogActions>
          <LoadingButton isLoading={false} onClick={handleEditClose} label="CANCEL" icon={<></>}
            borderColor="border-transparent" borderWidth="border" bgColor="bg-transparent" color="text-white" />
          <LoadingButton isLoading={loading} onClick={handleEditSave} label="SAVE CHANGES" icon={<></>}
            borderColor="border-transparent" borderWidth="border" bgColor="bg-transparent" color="text-white" />
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel} PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ color: '#fff' }}>Delete Outdoor Session</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: grey[200], mt: 1 }}>
            Are you sure you want to delete this {workoutToDelete ? activityLabels[workoutToDelete.activity_type].toLowerCase() : ''} session?
          </Typography>
          {workoutToDelete && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: grey[700], borderRadius: 2 }}>
              <Typography sx={{ color: grey[200] }}>
                {`Duration: ${workoutToDelete.duration_minutes} min · Calories: ${workoutToDelete.calories} kcal`}
              </Typography>
              <Typography sx={{ color: grey[400], fontSize: '0.85rem' }}>
                {new Date(workoutToDelete.date).toLocaleDateString()}
              </Typography>
            </Box>
          )}
          <Typography sx={{ color: '#E43654', mt: 2, fontSize: '0.9rem' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <LoadingButton isLoading={false} onClick={handleDeleteCancel} label="CANCEL" icon={<></>}
            borderColor="border-transparent" borderWidth="border" bgColor="bg-transparent" color="text-white" />
          <LoadingButton isLoading={loading} onClick={handleDeleteConfirm} label="DELETE" icon={<></>}
            borderColor="border-transparent" borderWidth="border" bgColor="bg-transparent" color="text-red-500" />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OutdoorPage;
