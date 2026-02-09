import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, Checkbox, ListItemText, SelectChangeEvent, FormControlLabel } from '@mui/material';
import grey from '@mui/material/colors/grey';
import { adaptTraining, saveTraining } from '../../api/TrainingApi';
import handleCategoryIcon from '../../personalizedComponents/handleCategoryIcon';
import LoadingButton from '../../personalizedComponents/buttons/LoadingButton';
import { FIELD_LIMITS } from '../../constants';

interface Exercise {
  id: string;
  calories_per_hour: number | string;
  category_id: string;
  name: string;
  owner: string;
  public: boolean;
  training_muscle: string;
  equipment_required?: string[];
  alternative_exercise_ids?: string[];
}

interface CategoryWithExercises {
  id: string;
  icon: string;
  name: string;
  owner: string;
  isCustom: boolean;
  exercises: Exercise[];
}

interface Trainings {
  id: string;
  name: string;
  owner: string;
  calories_per_hour_mean: number;
  exercises: Exercise[];
}

interface CreateTrainingDialogProps {
  createNewTraining: boolean;
  handleCloseAddTrainingDialog: () => void;
  categoryWithExercises: CategoryWithExercises[];
  setTrainings: React.Dispatch<React.SetStateAction<Trainings[]>>;
  setAlertTrainingAddedOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateTrainingDialog: React.FC<CreateTrainingDialogProps> = ({ createNewTraining, handleCloseAddTrainingDialog, categoryWithExercises, setTrainings, setAlertTrainingAddedOpen }) => {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = React.useState<{ [key: string]: string[] }>({});
  const [trainingName, setTrainingName] = React.useState<string>('');
  const [loadingButton, setLoadingButton] = React.useState<boolean>(false)
  const [autoAdapt, setAutoAdapt] = React.useState<boolean>(true);
  const [availability, setAvailability] = React.useState<'NONE' | 'HOUSEHOLD'>('NONE');
  const [adaptationResult, setAdaptationResult] = React.useState<{ replacements: { from: string, to: string }[], missing: string[] } | null>(null);

  const exerciseNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    categoryWithExercises.forEach((category) => {
      category.exercises.forEach((exercise) => {
        map.set(exercise.id, exercise.name);
      });
    });
    return map;
  }, [categoryWithExercises]);

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setSelectedCategories(value as string[]);
  };

  const handleExerciseChange = (categoryId: string) => (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setSelectedExercises((prevState) => ({
      ...prevState,
      [categoryId]: value as string[],
    }));
  };

  const handleCreateTraining = async () => {
    const trainingNameTrimmed = trainingName.trim();
    const selectedExerciseObjects = Object.keys(selectedExercises).reduce((allExercises, categoryId) => {
      const exercisesInCategory = categoryWithExercises.find(cat => cat.id === categoryId)?.exercises || [];
      const selectedObjects = selectedExercises[categoryId].map(exId => exercisesInCategory.find(ex => ex.id === exId)!).filter(Boolean);
      return [...allExercises, ...selectedObjects];
    }, [] as Exercise[]);

    if (!trainingNameTrimmed) {
      return;
    }

    let exercisesForSave = selectedExerciseObjects;

    try {
      setLoadingButton(true);

      if (autoAdapt && selectedExerciseObjects.length) {
        const available_equipment = availability === 'HOUSEHOLD' ? ['NONE', 'HOUSEHOLD'] : ['NONE'];
        const adaptResult = await adaptTraining({
          exercises: selectedExerciseObjects.map(exercise => exercise.id),
          available_equipment,
        });

        setAdaptationResult({
          replacements: adaptResult.replacements || [],
          missing: adaptResult.missing || [],
        });

        exercisesForSave = adaptResult.adapted_exercises || [];

        const updatedSelections: { [key: string]: string[] } = {};
        exercisesForSave.forEach((exercise: Exercise) => {
          if (!updatedSelections[exercise.category_id]) {
            updatedSelections[exercise.category_id] = [];
          }
          updatedSelections[exercise.category_id].push(exercise.id);
        });
        setSelectedCategories(Object.keys(updatedSelections));
        setSelectedExercises(updatedSelections);
      }

      const newTraining = {
        name: trainingNameTrimmed,
        exercises: exercisesForSave,
      };

      if (!newTraining.exercises.length) {
        setLoadingButton(false);
        return;
      }

      const training = await saveTraining(newTraining);
      const trainingWithId = { ...newTraining, id: training.id, calories_per_hour_mean: training.calories_per_hour_mean, owner: training.owner };
      setTrainings((prevTrainings) => [...prevTrainings, trainingWithId]);
      setAlertTrainingAddedOpen(true);
    } catch (error) {
      console.error('Error al guardar el entrenamiento:', error);
    } finally {
      setLoadingButton(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedCategories([]);
    setSelectedExercises({});
    setTrainingName('');
    setAdaptationResult(null);
    handleCloseAddTrainingDialog();
  };

  return (
    <Dialog
      open={createNewTraining}
      onClose={handleClose}
      fullWidth={true}
      maxWidth={'xs'}
      PaperProps={{
        sx: {
          backgroundColor: grey[800],
          color: '#fff',
          borderRadius: '8px',
          padding: 2,
        },
      }}
    >
      <DialogTitle>Create New Training</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="training-name"
          label="Name"
          type="text"
          fullWidth
          variant="standard"
          value={trainingName}
          onChange={(e) => setTrainingName(e.target.value.slice(0, FIELD_LIMITS.trainingName))}
          InputLabelProps={{
            style: { color: '#fff' }, // Color del label (Duration)
          }}
          InputProps={{
            style: { color: '#fff' }, // Color del texto dentro del input
          }}
          helperText={`${trainingName.length}/${FIELD_LIMITS.trainingName}`}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={autoAdapt}
              onChange={(e) => setAutoAdapt(e.target.checked)}
            />
          }
          label="Auto-adapt exercises for no equipment"
          sx={{ mt: 2, color: '#fff' }}
        />
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="availability-label" sx={{ color: '#fff' }}>Availability</InputLabel>
          <Select
            labelId="availability-label"
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as 'NONE' | 'HOUSEHOLD')}
            label="Availability"
            sx={{
              color: '#fff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              '& .MuiSvgIcon-root': { color: '#fff' },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: '#444',
                  color: '#fff',
                },
              },
            }}
          >
            <MenuItem value="NONE">No equipment</MenuItem>
            <MenuItem value="HOUSEHOLD">Household items</MenuItem>
          </Select>
        </FormControl>
        {adaptationResult && (adaptationResult.replacements.length > 0 || adaptationResult.missing.length > 0) && (
          <div style={{ marginTop: 12, color: '#fff' }}>
            {adaptationResult.replacements.length > 0 && (
              <p style={{ fontSize: '0.85rem' }}>
                Replacements: {adaptationResult.replacements.map((item) => `${exerciseNameById.get(item.from) || item.from} → ${exerciseNameById.get(item.to) || item.to}`).join(', ')}
              </p>
            )}
            {adaptationResult.missing.length > 0 && (
              <p style={{ fontSize: '0.85rem', color: '#ffb74d' }}>
                Missing alternatives for {adaptationResult.missing.length} exercises. They will be skipped.
              </p>
            )}
          </div>
        )}

        {/* MultiSelect para categorías */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="categories" sx={{
            color: '#fff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#fff',
            },
            '& .MuiSvgIcon-root': {
              color: '#fff',
            }
          }}>Categories</InputLabel>
          <Select
            labelId="categories"
            id="categories"
            label="Categories"
            multiple
            value={selectedCategories}
            onChange={handleCategoryChange}
            renderValue={(selected) => (selected as string[]).map(catId => {
              const category = categoryWithExercises.find(c => c.id === catId);
              return category ? category.name : '';
            }).join(', ')}

            sx={{
              marginBottom: 1,
              color: '#fff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#fff',
              },
              '& .MuiSvgIcon-root': {
                color: '#fff',
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  maxWidth: 300,
                  padding: 1,
                  backgroundColor: '#444',
                  color: '#fff',
                },
              },
            }}
          >
            {categoryWithExercises.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                <Checkbox checked={selectedCategories.indexOf(category.id) > -1} />
                {handleCategoryIcon(category.icon)}
                <ListItemText primary={category.name} sx={{ ml: 1 }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Mostrar MultiSelect de ejercicios según las categorías seleccionadas */}
        {selectedCategories.map((categoryId) => (
          <FormControl key={categoryId} fullWidth sx={{ mt: 2 }}>
            <InputLabel id={`exercises-${categoryId}`}

              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#fff',
                },
                '& .MuiSvgIcon-root': {
                  color: '#fff',
                }
              }}

            >Exercises from {categoryWithExercises.find(cat => cat.id === categoryId)?.name}</InputLabel>
            <Select
              labelId={`exercises-${categoryId}`}
              id={`exercises-${categoryId}`}
              label={`Exercises from ${categoryWithExercises.find(cat => cat.id === categoryId)?.name || "category"}`}
              multiple
              value={selectedExercises[categoryId] || []}
              onChange={handleExerciseChange(categoryId)}
              renderValue={(selected) => (selected as string[]).map(exerciseId => {
                const category = categoryWithExercises.find(cat => cat.id === categoryId);
                const exercise = category?.exercises.find(ex => ex.id === exerciseId);
                return exercise ? exercise.name : '';
              }).join(', ')}
              sx={{
                marginBottom: 1,
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#fff',
                },
                '& .MuiSvgIcon-root': {
                  color: '#fff',
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    maxWidth: 300,
                    padding: 1,
                    backgroundColor: '#444',
                    color: '#fff',
                  },
                },
              }}
            >
              {categoryWithExercises.find(cat => cat.id === categoryId)?.exercises.map((exercise) => (
                <MenuItem key={exercise.id} value={exercise.id}>
                  <Checkbox checked={selectedExercises[categoryId]?.indexOf(exercise.id) > -1} />
                  <ListItemText primary={`${exercise.name} (${exercise.calories_per_hour} kcal/h)`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </DialogContent>
      <DialogActions>
        <LoadingButton
            isLoading={false}
            onClick={handleClose}
            label="CANCEL"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
        <LoadingButton
            isLoading={loadingButton}
            onClick={handleCreateTraining}
            label="SAVE CHANGES"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
      </DialogActions>
    </Dialog>
  );
};

export default CreateTrainingDialog;
