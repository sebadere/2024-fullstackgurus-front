import React, { useEffect, useMemo, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { grey } from '@mui/material/colors';
import CloseIcon from '@mui/icons-material/Close';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Brush, Rectangle, Legend } from 'recharts';
import Typography from '@mui/material/Typography';
import ScrollArea from '@mui/material/Box';
import { getWorkouts, saveWorkout, getWorkoutsCalories } from '../../api/WorkoutsApi';
import { getOutdoorWorkouts } from '../../api/OutdoorWorkoutsApi';
import { calculate_calories_and_duration_per_day } from '../../functions/calculations';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TopMiddleAlert from '../../personalizedComponents/TopMiddleAlert';
import { getCategories } from '../../api/CategoryApi';
import { getExerciseFromCategory } from '../../api/ExerciseApi';
import { getCoaches } from '../../api/CoachesApi_external';
import { FilterTrainingDialog } from './filter_training';
import { Divider } from '@mui/material';
import { top_exercises_done } from '../../functions/top_exercises_done';
import DynamicBarChart from './bars_graph';
import { adaptTraining, getTrainings, saveTraining } from '../../api/TrainingApi';
import { FilterCoachDialog } from './filter_coach';
import WaterIntakeCard from './water_intake';
import ResponsiveMenu from './menu_responsive';
import LoadingAnimation from '../../personalizedComponents/loadingAnimation';
import '../../App.css';
import LoadingButton from '../../personalizedComponents/buttons/LoadingButton';
import { getFilteredData } from './dates_filter';
import { getChallenges } from '../../api/ChallengesApi';
import ChallengeModal from '../../personalizedComponents/challengeModal';
import WorkspacePremiumTwoToneIcon from '@mui/icons-material/WorkspacePremiumTwoTone';
import { Tooltip as TooltipMui } from '@mui/material';
import { calculate_last_30_days_calories_progress } from '../../functions/progress_calories_calcs';
import Last30DaysProgress from './last30daysCaloriesProgress';


interface Workout {
  id: number | string;
  duration: number;
  date: string;
  total_calories: number;
  coach: string;
  training: Training;
  training_id: string;
  is_outdoor?: boolean;
  activity_type?: string;
  distance_km?: number;
  elevation_gain_m?: number;
  notes?: string;
}

interface Training {
  calories_per_hour_mean: number;
  exercises: Exercise[];
  name: string;
  owner: string;
}

interface Category {
  id: string;
  icon: string;
  name: string;
  owner: string;
  isCustom: boolean;
}

interface Exercise {
  id: string;
  calories_per_hour: number;
  category_id: string;
  name: string;
  owner: string;
  public: boolean;
  training_muscle: string;
  equipment_required?: string[];
  alternative_exercise_ids?: string[];
  exercise_id?: string; // trainings endpoint uses `exercise_id` for legacy reasons
}

interface CategoryWithExercises {
  id: string;
  icon: string,
  name: string;
  owner: string;
  isCustom: boolean;
  exercises: Exercise[];
}

interface ExerciseCount {
  exerciseId: string;
  name: string;
  count: number;
}

interface topCategoriesWithExercises {
  categoryId: string;
  categoryName: string;
  totalCount: number;
  exercises: ExerciseCount[];
}

interface Trainings {
  id: string;
  name: string;
  owner: string;
  calories_per_hour_mean: number;
  exercises: Exercise[];
}

interface Challenges {
  id: number;
  challenge: string;
  state: boolean;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('month');
  const [open, setOpen] = useState(false);
  const [alertWorkoutAddedOpen, setAlertWorkoutAddedOpen] = useState(false);
  const [alertWorkoutAddedForAgendaOpen, setAlertWorkoutAddedForAgendaOpen] = useState(false);
  const [alertWorkoutFillFieldsOpen, setAlertWorkoutFillFieldsOpen] = useState(false);
  const [workoutList, setWorkoutList] = useState<Workout[]>([]);
  const [caloriesPerDay, setCaloriesPerDay] = useState<{ [date: string]: [number, number] }>({});
  const [loading, setLoading] = useState(true);
  const [workoutsCount, setWorkoutsCount] = useState(0);
  const [openWorkoutAdding, setOpenWorkoutAdding] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [coaches, setCoaches] = useState([]);
  const [coachSelected, setCoachSelected] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDateOpen, setFilterDateOpen] = useState(false);
  const [filterTrainingOpen, setFilterTrainingOpen] = useState(false);
  const [filterCoachOpen, setFilterCoachOpen] = useState(false);
  const [filterExerciseOpen, setFilterExerciseOpen] = useState(false);
  const [selectedTrainingInFilter, setSelectedTrainingInFilter] = useState<Trainings | null>(null);
  const [selectedCoachInFilter, setSelectedCoachInFilter] = useState<string>('');
  const [selectedExerciseInFilter, setSelectedExerciseInFilter] = useState<Workout | null>(null);
  const [categoryWithExercises, setCategoryWithExercises] = useState<CategoryWithExercises[]>([]);
  const [topExercisesDone, setTopExercisesDone] = useState<topCategoriesWithExercises[]>([]);
  const [trainings, setTrainings] = useState<Trainings[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<Trainings | null>(null);
  const [loadingButton, setLoadingButton] = useState<boolean>(false)
  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [challengesList, setChallengesList] = useState<Challenges[]>([])

  type EquipmentMode = 'OFF' | 'NONE' | 'HOUSEHOLD';
  const [equipmentMode, setEquipmentMode] = useState<EquipmentMode>('OFF');
  const [adaptingTraining, setAdaptingTraining] = useState(false);
  const [adaptationPreview, setAdaptationPreview] = useState<{
    adapted_exercises: any[];
    replacements: { from: string; to: string }[];
    missing: string[];
  } | null>(null);
  const [alertAdaptMissingOpen, setAlertAdaptMissingOpen] = useState(false);

  const ADAPT_CACHE_KEY = 'adapted_training_cache_v1';

  const exerciseIdOf = (exercise: any): string => {
    return String(exercise?.exercise_id || exercise?.id || '');
  };

  const getAvailableEquipment = (mode: EquipmentMode): string[] => {
    if (mode === 'NONE') return ['NONE'];
    if (mode === 'HOUSEHOLD') return ['NONE', 'HOUSEHOLD'];
    return [];
  };

  const runAdaptation = async (training: Trainings, mode: EquipmentMode) => {
    const exerciseIds = (training.exercises || []).map(exerciseIdOf).filter(Boolean);
    return await adaptTraining({ exercises: exerciseIds, available_equipment: getAvailableEquipment(mode) });
  };

  const getAdaptCache = (): Record<string, { training_id: string; name: string; createdAt: string }> => {
    try {
      const raw = localStorage.getItem(ADAPT_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const setAdaptCache = (cache: Record<string, { training_id: string; name: string; createdAt: string }>) => {
    localStorage.setItem(ADAPT_CACHE_KEY, JSON.stringify(cache));
  };

  const handleChallengeModalClose = () => {
    setChallengeModalOpen(false)
  }

  const getChallengesList = async () => {
    try {
      const challenges = await getChallenges('workouts');
      setChallengesList(challenges)
    }
    catch (error) {
      console.error('Error al obtener challenges:', error);
    }
  }

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  const handleCategoriesClick = () => {
    navigate('/categories');
  }

  const getAllWorkouts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token no encontrado');

      // Obtén la fecha actual (hoy) en formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      // Llama a getWorkouts solo con el endDate como hoy
      const workouts = await getWorkouts(token, undefined, today);
      return Array.isArray(workouts) ? workouts : [];
    } catch (error) {
      console.error('Error al obtener todos los entrenamientos:', error);
      return [];
    }
  };

  const getAllOutdoorWorkouts = async (): Promise<Workout[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const outdoorWorkouts = await getOutdoorWorkouts(undefined, today);
      if (!Array.isArray(outdoorWorkouts)) return [];

      return outdoorWorkouts.map((ow: any) => ({
        id: ow.id,
        duration: ow.duration_minutes,
        date: ow.date,
        total_calories: ow.calories,
        coach: '',
        training_id: '',
        training: {
          name: ow.activity_type.charAt(0) + ow.activity_type.slice(1).toLowerCase(),
          calories_per_hour_mean: 0,
          exercises: [],
          owner: '',
        },
        is_outdoor: true,
        activity_type: ow.activity_type,
        distance_km: ow.distance_km,
        elevation_gain_m: ow.elevation_gain_m,
        notes: ow.notes,
      }));
    } catch (error) {
      console.error('Error al obtener outdoor workouts:', error);
      return [];
    }
  };

  useEffect(() => {
    const updateTimeRange = () => {
      setTimeRange(window.innerWidth < 768 ? 'WEEKLY' : 'TWO_WEEKS');
    };
    updateTimeRange(); // Set initially
    window.addEventListener('resize', updateTimeRange);

    return () => window.removeEventListener('resize', updateTimeRange);
  }, []);

  const parseLocalDate = (dateString: string): Date => {
    // Parse YYYY-MM-DD as local time (not UTC) to avoid timezone day shifts
    const parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (parts) {
      return new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
    }
    return new Date(dateString);
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const formatDataForChart = () => {
    return Object.keys(caloriesPerDay)
      .map((date) => ({
        date: formatDate(date),
        timestamp: parseLocalDate(date).getTime(),
        Calories: caloriesPerDay[date][0],
        Minutes: caloriesPerDay[date][1],
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const dataForChart = useMemo(() => formatDataForChart(), [caloriesPerDay]);

  const last30DaysData = useMemo(() => calculate_last_30_days_calories_progress(dataForChart), [dataForChart]);

  const [newWorkout, setNewWorkout] = useState({
    training_id: '',
    duration: '',
    coach: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFilterOpen = () => {
    setFilterOpen(true);
  }

  const handleFilterClose = () => {
    setFilterOpen(false);
  }

  const handleFilterDateOpen = () => {
    setFilterDateOpen(true);
  }

  const handleFilterTrainingOpen = () => {
    setFilterTrainingOpen(true);
  }

  const handleFilterExerciseOpen = () => {
    setFilterExerciseOpen(true);
  }

  const handleFilterDateClose = () => {
    setFilterDateOpen(false);
  }


  const getAllWorkoutsFromCache = (): Workout[] => {
    const regular = JSON.parse(localStorage.getItem('workouts') || '[]');
    const outdoor = JSON.parse(localStorage.getItem('outdoor_workouts') || '[]');
    return [...regular, ...outdoor];
  };

  const handleFilterTrainingClose = (selectedTraining: { id: string }) => {
    setFilterTrainingOpen(false);

    if (selectedTraining) {
      let allWorkoutsList = getAllWorkoutsFromCache();

      if (selectedCoachInFilter) {
        allWorkoutsList = allWorkoutsList.filter((workout: Workout) => workout.coach === selectedCoachInFilter);
      }

      const filteredWorkouts = allWorkoutsList.filter((workout: Workout) => workout.training_id === selectedTraining?.id);

      if (filteredWorkouts.length === 0) {
        setWorkoutList([]);
        setCaloriesPerDay({});
      } else {
        const calories_duration_per_dayFiltered = calculate_calories_and_duration_per_day(filteredWorkouts);
        setWorkoutList(filteredWorkouts);
        setCaloriesPerDay(calories_duration_per_dayFiltered);
      }
    }
  };

  const handleFilterCoachClose = (selectedCoach: string) => {
    setFilterCoachOpen(false);

    if (selectedCoach) {
      let allWorkoutsList = getAllWorkoutsFromCache();

      if (selectedTrainingInFilter) {
        allWorkoutsList = allWorkoutsList.filter((workout: Workout) => workout.training_id === selectedTrainingInFilter.id);
      }

      const filteredWorkouts = allWorkoutsList.filter((workout: Workout) => workout.coach === selectedCoach);

      if (filteredWorkouts.length === 0) {
        setWorkoutList([]);
        setCaloriesPerDay({});
      } else {
        const calories_duration_per_dayFiltered = calculate_calories_and_duration_per_day(filteredWorkouts);
        setWorkoutList(filteredWorkouts);
        setCaloriesPerDay(calories_duration_per_dayFiltered);
      }
    }
  };

  const handleCloseOfTrainingFilterLabel = () => {
    setSelectedTrainingInFilter(null);
    let allWorkoutsList = getAllWorkoutsFromCache();

    if (selectedCoachInFilter) {
      const filteredWorkouts = allWorkoutsList.filter((workout: Workout) => workout.coach === selectedCoachInFilter);

      if (filteredWorkouts.length === 0) {
        setWorkoutList([]);
        setCaloriesPerDay({});
      } else {
        const calories_duration_per_dayFiltered = calculate_calories_and_duration_per_day(filteredWorkouts);
        setWorkoutList(filteredWorkouts);
        setCaloriesPerDay(calories_duration_per_dayFiltered);
      }
    } else {
      const calories_duration_per_dayList = JSON.parse(localStorage.getItem('calories_duration_per_day') || '{}');
      setWorkoutList(allWorkoutsList);
      setCaloriesPerDay(calories_duration_per_dayList);
    }
  };

  const handleCloseOfCoachFilterLabel = () => {
    setSelectedCoachInFilter('');
    let allWorkoutsList = getAllWorkoutsFromCache();

    if (selectedTrainingInFilter) {
      const filteredWorkouts = allWorkoutsList.filter((workout: Workout) => workout.training_id === selectedTrainingInFilter.id);

      if (filteredWorkouts.length === 0) {
        setWorkoutList([]);
        setCaloriesPerDay({});
      } else {
        const calories_duration_per_dayFiltered = calculate_calories_and_duration_per_day(filteredWorkouts);
        setWorkoutList(filteredWorkouts);
        setCaloriesPerDay(calories_duration_per_dayFiltered);
      }
    } else {
      const calories_duration_per_dayList = JSON.parse(localStorage.getItem('calories_duration_per_day') || '{}');
      setWorkoutList(allWorkoutsList);
      setCaloriesPerDay(calories_duration_per_dayList);
    }
  };

  const handleFilterExerciseClose = () => {
    setFilterExerciseOpen(false);
  }

  const handleOpenWorkoutAdding = () => {
    setOpenWorkoutAdding(true);
    setOpen(false);
  }

  const handleCloseWorkoutAdding = () => {
    setOpenWorkoutAdding(false);
    setOpen(true);
    setSelectedCategory(null);
    setExercises([]);
    setCoachSelected('');
    setSelectedTraining(null);
    setEquipmentMode('OFF');
    setAdaptationPreview(null);
    setNewWorkout({
      training_id: '',
      duration: '',
      coach: '',
      date: new Date().toISOString().split('T')[0],
    });
  }

  const handlePreviewAdaptation = async () => {
    if (!selectedTraining || equipmentMode === 'OFF') return;
    try {
      setAdaptingTraining(true);
      const preview = await runAdaptation(selectedTraining, equipmentMode);
      setAdaptationPreview(preview);
      if (Array.isArray(preview?.missing) && preview.missing.length) {
        setAlertAdaptMissingOpen(true);
      }
    } catch (e) {
      console.error('Error adapting training:', e);
    } finally {
      setAdaptingTraining(false);
    }
  };

  const handleAddWorkout = async () => {
    if (newWorkout.training_id && newWorkout.duration && newWorkout.date) {
      setLoadingButton(true)

      setNewWorkout({
        training_id: '',
        coach: '',
        duration: '',
        date: new Date().toISOString().split('T')[0],
      });

      try {
        const token = localStorage.getItem('token');
        if (token) {
          let trainingIdToUse = newWorkout.training_id;

          if (equipmentMode !== 'OFF') {
            if (!selectedTraining) {
              setLoadingButton(false);
              setAlertWorkoutFillFieldsOpen(true);
              return;
            }

            // Preview adaptation if the user didn't do it explicitly.
            const previewResult =
              adaptationPreview || (await runAdaptation(selectedTraining, equipmentMode));
            setAdaptationPreview(previewResult);

            if (Array.isArray(previewResult?.missing) && previewResult.missing.length) {
              setLoadingButton(false);
              setAlertAdaptMissingOpen(true);
              return;
            }

            const cacheKey = `${selectedTraining.id}|${equipmentMode}`;
            const cache = getAdaptCache();
            const cached = cache[cacheKey];
            if (cached?.training_id) {
              trainingIdToUse = cached.training_id;
            } else {
              const label = equipmentMode === 'NONE' ? 'No equipment' : 'Household';
              const adaptedName = `${selectedTraining.name} (${label})`;

              const saved = await saveTraining({ name: adaptedName, exercises: previewResult?.adapted_exercises || [] });
              trainingIdToUse = saved.id;

              cache[cacheKey] = { training_id: trainingIdToUse, name: adaptedName, createdAt: new Date().toISOString() };
              setAdaptCache(cache);

              // Keep the training selector usable without a hard refresh.
              setTrainings((prev) => {
                if (prev.some((t) => t.id === trainingIdToUse)) return prev;
                return [
                  ...prev,
                  {
                    id: trainingIdToUse,
                    name: adaptedName,
                    owner: saved.owner || selectedTraining.owner,
                    calories_per_hour_mean: saved.calories_per_hour_mean,
                    exercises: (previewResult?.adapted_exercises || []).map((ex: any) => ({
                      ...ex,
                      id: String(ex?.id || ex?.exercise_id || ''),
                    })),
                  },
                ];
              });
            }
          }

          await saveWorkout(token, {
            training_id: trainingIdToUse,
            coach: newWorkout.coach,
            duration: parseInt(newWorkout.duration, 10),
            date: newWorkout.date,
          });
          console.log('Workout saved successfully');
          setWorkoutsCount((prevCount) => prevCount + 1);
          // Verificar si la fecha es futura para hacer alertas distintas
          const today = new Date().toISOString().split('T')[0];
          if (newWorkout.date > today) {
            setAlertWorkoutAddedForAgendaOpen(true);
          } else {
            setAlertWorkoutAddedOpen(true);
          }
        } else {
          setLoadingButton(false)
          console.error('No token found, unable to save workout');
        }
      } catch (error) {
        setLoadingButton(false)
        console.error('Error saving workout:', error);
      }

      setLoadingButton(false)
      handleCloseWorkoutAdding();
      handleClose();
      localStorage.removeItem('workouts');
      localStorage.removeItem('calories_duration_per_day');
    }
    else {
      setAlertWorkoutFillFieldsOpen(true);
    }
  };

  const getAllCategories = async () => {
    try {
      const categories = await getCategories();
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('Error al obtener todas las categorías:', error);
      return [];
    }
  };

  const getAllTrainings = async () => {
    try {
      const trainings = await getTrainings();
      console.log('Trainings:', trainings);
      return Array.isArray(trainings) ? trainings : [];
    } catch (error) {
      console.error('Error al obtener los entrenamientos:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const now = Date.now();
        const TTL = 60 * 60 * 1000; // 1 hora en milisegundos (Despues de una hora, se reinicia el localStorage)

        // Step 1: Fetch Categories and Exercises
        console.log("Fetching categories and exercises...");
        const categories_from_local_storage = JSON.parse(localStorage.getItem('categories') || '[]');
        const categories_timestamp = parseInt(localStorage.getItem('categories_timestamp') || '0', 10);
        const exercises_from_local_storage = JSON.parse(localStorage.getItem('categories_with_exercises') || '[]');

        if (categories_from_local_storage.length > 0 && exercises_from_local_storage.length > 0 && (now - categories_timestamp < TTL)) {
          setCategories(categories_from_local_storage);
          setCategoryWithExercises(exercises_from_local_storage);
        } else {
          const categories = await getAllCategories();
          let categories_with_exercises: CategoryWithExercises[] = [];

          for (const category of categories) {
            const exercises = await getExerciseFromCategory(category.id);
            categories_with_exercises = [...categories_with_exercises, { ...category, exercises }];
          }

          setCategories(categories);
          setCategoryWithExercises(categories_with_exercises);

          localStorage.setItem('categories_with_exercises', JSON.stringify(categories_with_exercises));
          localStorage.setItem('categories', JSON.stringify(categories));
          localStorage.setItem('categories_timestamp', Date.now().toString());
        }

        // Step 2a: Fetch Regular Workouts (with cache)
        console.log("Fetching workouts...");
        const workouts_from_local_storage = JSON.parse(localStorage.getItem('workouts') || '[]');
        const workouts_timestamp = parseInt(localStorage.getItem('workouts_timestamp') || '0', 10);
        let regularWorkouts: Workout[];

        if (workouts_from_local_storage.length > 0 && (now - workouts_timestamp < TTL)) {
          regularWorkouts = workouts_from_local_storage.filter((w: Workout) => !w.is_outdoor);
          console.log('Regular workouts loaded from local storage');
        } else {
          const workouts = await getAllWorkouts();
          regularWorkouts = workouts.filter((workout: Workout) => workout.duration && workout.date && workout.total_calories && workout.coach);
          localStorage.setItem('workouts', JSON.stringify(regularWorkouts));
          localStorage.setItem('workouts_timestamp', Date.now().toString());
        }

        // Step 2b: Fetch Outdoor Workouts (with separate cache)
        console.log("Fetching outdoor workouts...");
        const outdoor_from_local_storage = JSON.parse(localStorage.getItem('outdoor_workouts') || '[]');
        const outdoor_timestamp = parseInt(localStorage.getItem('outdoor_workouts_timestamp') || '0', 10);
        let outdoorWorkoutsList: Workout[];

        if (outdoor_from_local_storage.length > 0 && (now - outdoor_timestamp < TTL)) {
          outdoorWorkoutsList = outdoor_from_local_storage;
          console.log('Outdoor workouts loaded from local storage');
        } else {
          const outdoorRaw = await getAllOutdoorWorkouts();
          outdoorWorkoutsList = outdoorRaw.filter((workout: Workout) => workout.duration && workout.date && workout.total_calories);
          localStorage.setItem('outdoor_workouts', JSON.stringify(outdoorWorkoutsList));
          localStorage.setItem('outdoor_workouts_timestamp', Date.now().toString());
        }

        // Step 2c: Merge and compute stats
        const allWorkouts = [...regularWorkouts, ...outdoorWorkoutsList];
        const sortedWorkouts = allWorkouts.sort((a: Workout, b: Workout) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setWorkoutList(sortedWorkouts);

        const calories_duration_per_day = calculate_calories_and_duration_per_day(sortedWorkouts);
        setCaloriesPerDay(calories_duration_per_day);
        localStorage.setItem('calories_duration_per_day', JSON.stringify(calories_duration_per_day));

        // Step 3: Fetch Coaches
        console.log("Fetching coaches...");
        const coaches_from_local_storage = JSON.parse(localStorage.getItem('coaches') || '[]');
        const coaches_timestamp = parseInt(localStorage.getItem('coaches_timestamp') || '0', 10);

        if (coaches_from_local_storage.length > 0 && (now - coaches_timestamp < TTL)) {
          setCoaches(coaches_from_local_storage);
          console.log('Coaches loaded from local storage');
        } else {
          const coaches = await getCoaches();
          setCoaches(coaches);
          localStorage.setItem('coaches', JSON.stringify(coaches));
          localStorage.setItem('coaches_timestamp', Date.now().toString());
        }

        // Step 4: Fetch Trainings
        console.log("Fetching trainings...");
        const trainings = await getAllTrainings();
        if (trainings) {
          setTrainings(trainings);
          console.log(trainings);
        }

        // Step 5: Fetch Challenges
        console.log("Fetching challenges...");
        getChallengesList(); // Assuming this does not need to be awaited
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workoutsCount]); // Re-run only if workoutsCount changes

  useEffect(() => {
    const top_exercises_done_for_graph = top_exercises_done(workoutList, categoryWithExercises);
    setTopExercisesDone(top_exercises_done_for_graph.topCategoriesWithExercises);
  }, [workoutList]);

  return (
    <div className="min-h-screen bg-black from-gray-900 to-gray-800 text-white">
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Avatar
            alt="User"
            src={require('../../images/profile_pic_2.jpg')}
            onClick={handleAvatarClick}
            style={{ cursor: 'pointer', marginRight: '12px' }}
          />
          <img src={require('../../images/logo.png')} alt="Logo" width={200} height={150} />
        </div>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
          <ResponsiveMenu handleFilterOpen={handleFilterOpen} handleClickOpen={handleClickOpen} />
        </Box>
      </header>
      <TopMiddleAlert alertText='Added workout successfully' open={alertWorkoutAddedOpen} onClose={() => setAlertWorkoutAddedOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Added workout in Agenda successfully' open={alertWorkoutAddedForAgendaOpen} onClose={() => setAlertWorkoutAddedForAgendaOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Please fill in all the fields' open={alertWorkoutFillFieldsOpen} onClose={() => setAlertWorkoutFillFieldsOpen(false)} severity='warning' />
      <TopMiddleAlert alertText='Some exercises cannot be adapted with the selected equipment' open={alertAdaptMissingOpen} onClose={() => setAlertAdaptMissingOpen(false)} severity='warning' />

      {challengeModalOpen &&
        <ChallengeModal pageName='Workouts Challenges' listOfChallenges={challengesList} open={challengeModalOpen} handleClose={handleChallengeModalClose} />
      }

      {/* FILTER PRINCIPAL */}
      <Dialog open={filterOpen} onClose={handleFilterClose}
        PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff',
            borderRadius: '8px',
            padding: 2,
          },
        }}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Filter By</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="space-around" alignItems="center" mt={2} >
            <Box textAlign="center" mx={3}>
              <Button sx={{ backgroundColor: grey[700], borderColor: grey[900] }} onClick={() => setFilterTrainingOpen(true)} variant="contained">Training</Button>
            </Box>
            <Box textAlign="center" mx={3}>
              <Button sx={{ backgroundColor: grey[700], borderColor: grey[900] }} onClick={() => setFilterCoachOpen(true)} variant="contained">Coach</Button>
            </Box>
            {/* <Box textAlign="center" mx={3}>
              <Button sx={{ backgroundColor: grey[700], borderColor: grey[900]}} onClick={() => setFilterExerciseOpen(true)} variant="contained">Exercise</Button>
            </Box> */}
          </Box>
        </DialogContent>
      </Dialog>

      <FilterTrainingDialog filterTrainingOpen={filterTrainingOpen} handleFilterTrainingClose={handleFilterTrainingClose} selectedTrainingInFilter={selectedTrainingInFilter}
        setSelectedTrainingInFilter={setSelectedTrainingInFilter} trainings={trainings} handleFilterClose={handleFilterClose} />

      <FilterCoachDialog filterCoachOpen={filterCoachOpen} handleFilterCoachClose={handleFilterCoachClose} selectedCoachInFilter={selectedCoachInFilter}
        setSelectedCoachInFilter={setSelectedCoachInFilter} coaches={coaches} handleFilterClose={handleFilterClose} />

      {/* <FilterExerciseDialog filterExerciseOpen={filterExerciseOpen} handleFilterExerciseClose={handleFilterExerciseClose} selectedExerciseInFilter={selectedExerciseInFilter}
      setSelectedExerciseInFilter={setSelectedExerciseInFilter} handleFilterClose={handleFilterClose} workoutList={workoutList}/> */}

      <Dialog open={open} onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff',
            borderRadius: '8px',
            padding: 2,
            maxWidth: '30vw',
            width: '100%',
            height: 'auto',
            '@media (max-width: 1024px)': {
              padding: 1,
              maxWidth: '60vw',
            },
            '@media (max-width: 600px)': {
              padding: 1,
              maxWidth: '100vw',
            },
          },
        }}
      >
        <DialogActions>
          <IconButton aria-label="add" onClick={handleClose}>
            <CloseIcon sx={{ color: grey[900], fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' } }} className="h-8 w-8" />
          </IconButton>
        </DialogActions>

        <DialogTitle sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          mt: -6,
          fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
        }}>
          What do you want to add?
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mt={2} px={2}>
            <Box textAlign="center" mx={2} my={{ xs: 2, sm: 0 }}>
              <IconButton onClick={handleCategoriesClick}>
                <Avatar
                  style={{ border: '2px solid black' }}
                  alt="New Categories"
                  src={require('../../images/Sports2.png')}
                  sx={{
                    width: { xs: 120, sm: 150, md: 170 },
                    height: { xs: 120, sm: 150, md: 170 },
                  }}
                />
              </IconButton>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                New Category, Exercise or Training
              </Typography>
            </Box>

            <Box textAlign="center" mx={2} my={{ xs: 2, sm: 0 }}>
              <IconButton onClick={handleOpenWorkoutAdding}>
                <Avatar
                  style={{ border: '2px solid black' }}
                  alt="New Workout"
                  src={require('../../images/Exercise2.png')}
                  sx={{
                    width: { xs: 120, sm: 150, md: 170 },
                    height: { xs: 120, sm: 150, md: 170 },
                  }}
                />
              </IconButton>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1rem' }, mb: 3 }}>
                New Workout
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog open={openWorkoutAdding} onClose={handleCloseWorkoutAdding}
        PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff', // Esto ajusta el color del texto principal
            padding: 2,
          },
        }} className='border border-gray-600 rounded'>
        <DialogTitle sx={{ color: '#fff', textAlign: 'center' }}>Add New Workout</DialogTitle>
        <DialogContent className='text-white'>

          <Select
            fullWidth
            value={selectedTraining?.id || ""}
            onChange={(e) => {
              setSelectedTraining(trainings.find((training) => training.id === e.target.value) || null);
              setNewWorkout({ ...newWorkout, training_id: e.target.value || '' });
              setAdaptationPreview(null);
            }}
            displayEmpty
            sx={{
              marginBottom: 1,
              color: '#fff', // Color del texto en Select
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#fff', // Color del borde
              },
              '& .MuiSvgIcon-root': {
                color: '#fff', // Color del ícono (flecha de selección)
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
                  color: '#fff', // Color de los textos en el menú desplegable
                },
              },
            }}
          >
            <MenuItem value="" disabled>
              Select Training
            </MenuItem>
            {trainings.map((training) => (
              <MenuItem key={training.id} value={training.id}>
                {training.name}
              </MenuItem>
            ))}
          </Select>

          <Select
            fullWidth
            value={equipmentMode}
            onChange={(e) => {
              setEquipmentMode(e.target.value as any);
              setAdaptationPreview(null);
            }}
            displayEmpty
            disabled={!selectedTraining}
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
            <MenuItem value="OFF">
              No adaptation (use original routine)
            </MenuItem>
            <MenuItem value="NONE">
              Adapt for no equipment
            </MenuItem>
            <MenuItem value="HOUSEHOLD">
              Adapt for household items
            </MenuItem>
          </Select>

          {equipmentMode !== 'OFF' && selectedTraining && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handlePreviewAdaptation}
                disabled={adaptingTraining}
                sx={{ color: '#fff', borderColor: '#fff' }}
              >
                {adaptingTraining ? 'Adapting...' : 'Preview Adaptation'}
              </Button>

              {adaptationPreview && (
                <Box sx={{ mt: 2, p: 2, border: `1px solid ${grey[700]}`, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 'bold', mb: 1 }}>Adaptation Preview</Typography>

                  {adaptationPreview.replacements?.length ? (
                    <Box sx={{ mb: 1 }}>
                      {adaptationPreview.replacements.map((r, idx) => {
                        const from =
                          selectedTraining.exercises.find((ex) => (ex.exercise_id || ex.id) === r.from)?.name || r.from;
                        const to =
                          adaptationPreview.adapted_exercises.find((ex: any) => (ex.id || ex.exercise_id) === r.to)?.name || r.to;
                        return (
                          <Typography key={`${r.from}-${r.to}-${idx}`} sx={{ fontSize: '0.9rem' }}>
                            {from} → {to}
                          </Typography>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '0.9rem', color: grey[200], mb: 1 }}>
                      No replacements needed for this equipment.
                    </Typography>
                  )}

                  {adaptationPreview.missing?.length ? (
                    <Typography sx={{ fontSize: '0.9rem', color: '#ffb74d' }}>
                      Missing alternatives for: {adaptationPreview.missing.join(', ')}
                    </Typography>
                  ) : null}

                  <Typography sx={{ fontSize: '0.8rem', color: grey[300], mt: 1 }}>
                    Note: to record the workout, the app will save an adapted routine for your user and reuse it next time.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Select
            fullWidth
            value={coachSelected}
            onChange={(e) => { setCoachSelected(e.target.value); setNewWorkout({ ...newWorkout, coach: e.target.value }) }}
            displayEmpty
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
            <MenuItem value="" disabled>
              Select Coach
            </MenuItem>
            {coaches.map((coach: any) => (
              <MenuItem key={coach.fullName} value={coach.fullName}>
                {coach.fullName}
              </MenuItem>
            ))}
          </Select>

          <TextField
            fullWidth
            margin="dense"
            label="Duration"
            value={newWorkout.duration}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setNewWorkout({ ...newWorkout, duration: "" });
              } else {
                const numericValue = parseInt(value, 10);
                if (numericValue >= 1 && numericValue <= 1000) {
                  setNewWorkout({ ...newWorkout, duration: value });
                } else if (numericValue < 1) {
                  setNewWorkout({ ...newWorkout, duration: "1" });
                } else if (numericValue > 1000) {
                  setNewWorkout({ ...newWorkout, duration: "1000" });
                }
              }
            }}
            placeholder="In minutes"
            type="number"
            InputLabelProps={{
              style: { color: '#fff' }, // Color del label (Duration)
            }}
            InputProps={{
              style: { color: '#fff' }, // Color del texto dentro del input
            }}
            slotProps={{
              htmlInput: { min: 1, max: 1000 }
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#fff', // Color del borde
              },
            }}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Date"
            type="date"
            value={newWorkout.date}
            onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
            InputLabelProps={{
              style: { color: '#fff' }, // Color del label (Date)
            }}
            InputProps={{
              style: { color: '#fff' }, // Color del texto dentro del input
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#fff',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <LoadingButton
            isLoading={false}
            onClick={handleCloseWorkoutAdding}
            label="CANCEL"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
          <LoadingButton
            isLoading={loadingButton}
            onClick={handleAddWorkout}
            label="ADD NEW WORKOUT"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
        </DialogActions>
      </Dialog>

      {loading ? (
        <LoadingAnimation />
      ) : (
        <main className="p-4 space-y-6">
          <Card sx={{ backgroundColor: '#161616', color: '#fff' }} className='border border-gray-600' >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardHeader title="Workouts progress" />
              <TooltipMui title="Challenges" arrow>
                <Box sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => setChallengeModalOpen(true)}>
                  <WorkspacePremiumTwoToneIcon sx={{ fontSize: 50, mt: 2, mb: 1, mr: 2 }} style={{ color: '#AE8625' }}/>
                  <Typography sx={{mr: 2, mb: 0, mt: 0}} style={{ color: '#AE8625'}}>Challenges</Typography>
                </Box>
              </TooltipMui>
            </div>
            <CardContent>

              {(selectedTrainingInFilter && selectedTrainingInFilter.name) ? (
                <Box
                  sx={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: grey[700],
                    borderRadius: '8px',
                    padding: 2,
                    marginBottom: 2,
                    height: 50,
                    width: 'auto',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    marginRight: 2
                  }}
                >
                  <Typography variant="h6" noWrap>{selectedTrainingInFilter?.name}</Typography>
                  <IconButton aria-label="add" onClick={() => handleCloseOfTrainingFilterLabel()}>
                    <CloseIcon sx={{ color: grey[900], fontSize: 20 }} className="h-12 w-12" />
                  </IconButton>
                </Box>
              ) : (
                <Box></Box>
              )}

              {(selectedCoachInFilter) ? (
                <Box
                  sx={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: grey[700],
                    borderRadius: '8px',
                    padding: 2,
                    marginBottom: 2,
                    height: 50,
                    width: 'auto',
                    maxWidth: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <Typography variant="h6" noWrap>{selectedCoachInFilter}</Typography>
                  <IconButton aria-label="add" onClick={() => handleCloseOfCoachFilterLabel()}>
                    <CloseIcon sx={{ color: grey[900], fontSize: 20 }} className="h-12 w-12" />
                  </IconButton>
                </Box>
              ) : (
                <Box></Box>
              )}

              <ResponsiveContainer width="100%" height={440} >
                {Array.isArray(workoutList) && workoutList.length > 0 ? (
                  <LineChart data={getFilteredData(dataForChart, timeRange)} margin={{ top: 10, right: 0, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#fff" tick={{ dy: 13 }} />
                    <YAxis stroke="#E43654" yAxisId="left" tick={{ fontWeight: 'bold' }} />
                    <YAxis stroke="#44f814" orientation="right" yAxisId="right" tick={{ fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'black', borderRadius: '5px' }} labelStyle={{ color: 'white' }} />
                    <Legend verticalAlign="top" height={50} wrapperStyle={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}/>
                    <Line type="monotone" dataKey="Calories" stroke="#E43654" activeDot={{ r: 10 }} yAxisId="left" />
                    <Line type="monotone" dataKey="Minutes" stroke="#44f814" activeDot={{ r: 10 }} yAxisId="right" />
                    <Brush dataKey="date" height={30} stroke="#000000" y={400} fill="#161616" travellerWidth={10}
                      className="custom-brush"
                      traveller={(props) => {
                        const { x, y, width, height } = props;
                        return (
                          <g>
                            {/* Traveller rectangle */}
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill="#fff"
                              stroke="none"
                              style={{ outline: 'none' }}
                              tabIndex={-1}
                            />
                            {/* First horizontal line */}
                            <line
                              x1={x + 2}
                              y1={y + height / 2 - 1}
                              x2={x + width - 2}
                              y2={y + height / 2 - 1}
                              stroke="#808080"
                              strokeWidth={1}
                              style={{ outline: 'none' }}
                              tabIndex={-1}
                            />
                            {/* Second horizontal line */}
                            <line
                              x1={x + 2}
                              y1={y + height / 2 + 1}
                              x2={x + width - 2}
                              y2={y + height / 2 + 1}
                              stroke="#808080"
                              strokeWidth={1}
                              style={{ outline: 'none' }}
                              tabIndex={-1}
                            />
                          </g>
                        );
                      }} />
                    <text x="50%" y={420} fill="#ffffff" textAnchor="middle" fontSize="12px" >Filter date</text>
                  </LineChart>
                ) : (
                  <div>
                    <Typography variant="body2" color="gray">No progress available</Typography>
                    <a href="#" className="underline" onClick={handleClickOpen}>
                      <Typography sx={{ marginTop: 4 }} variant="body2" color="gray">Add new workout</Typography>
                    </a>

                  </div>
                )}
              </ResponsiveContainer>
              <Last30DaysProgress last30DaysData={last30DaysData} />
            </CardContent>
          </Card>
          <Box sx={{ display: 'flex', height: '100%', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Card sx={{ flex: 1, backgroundColor: '#161616', color: '#fff', width: '100%' }} className='border border-gray-600'>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardHeader title="Workouts" />
              </div>
              <CardContent>
                <ScrollArea sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {Array.isArray(workoutList) && workoutList.length > 0 ? (
                    workoutList.map((workout: any) => (
                      <div key={workout.id} className="flex items-center space-x-4 mb-4">
                        <div className="flex-1">
                          <Divider sx={{ backgroundColor: 'gray', marginY: 1 }} />
                          <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'row' }, justifyContent: 'space-between', width: '100%', marginBottom: 1 }}>
                            <Typography variant="h6" color={workout.is_outdoor ? '#f0a500' : '#81d8d0'} sx={{ flex: 1, fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' } }}>
                              {workout.training.name}
                              {workout.is_outdoor && <span style={{ fontSize: '0.7em', marginLeft: 6, opacity: 0.7 }}>Outdoor</span>}
                            </Typography>
                            <Typography variant="h6" color='#44f814' sx={{ flex: 1, textAlign: 'left', fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' } }}>{workout.duration} min</Typography>
                            <Typography variant="h6" color='#E43654' sx={{ flex: 1, textAlign: 'left', fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' } }}>{workout.total_calories} kcal</Typography>
                            <Typography variant="subtitle1" color='gray' sx={{ flex: 1, textAlign: 'right', fontSize: { xs: '0.8rem', sm: '1rem', md: '1.2rem' } }}>{formatDate(workout.date)} </Typography>
                          </Box>
                          {workout.is_outdoor ? (
                            <>
                              {(workout.distance_km > 0 || workout.elevation_gain_m > 0) && (
                                <Typography variant="body2">
                                  {workout.distance_km > 0 && <span>{workout.distance_km} km</span>}
                                  {workout.distance_km > 0 && workout.elevation_gain_m > 0 && ' - '}
                                  {workout.elevation_gain_m > 0 && <span>{workout.elevation_gain_m} m elevation</span>}
                                </Typography>
                              )}
                              {workout.notes && <Typography variant="body2" color="gray">{workout.notes}</Typography>}
                            </>
                          ) : (
                            <>
                              <Typography variant="body2">
                                {workout.training.exercises.map((exercise: any, index: number) => (
                                  <span key={exercise.id}>
                                    {exercise.name}
                                    {index < workout.training.exercises.length - 1 && ' - '}
                                  </span>
                                ))}
                              </Typography>
                              <Typography variant="body2" color="gray">Coach: {workout.coach}</Typography>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Typography variant="body2" color="gray">No workouts available</Typography>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, backgroundColor: '#161616', color: '#fff', width: '100%' }} className='border border-gray-600'>
              <CardHeader title="Top Categories & Exercises done" />
              <CardContent>
                {Array.isArray(topExercisesDone) && topExercisesDone.length > 0 ? (
                  <DynamicBarChart topExercisesDone={topExercisesDone} />
                ) : (
                  <Typography variant="body2" color="gray">No workouts available</Typography>
                )}
              </CardContent>
            </Card>

            <WaterIntakeCard />
          </Box>
        </main>
      )}
    </div>
  );
}
