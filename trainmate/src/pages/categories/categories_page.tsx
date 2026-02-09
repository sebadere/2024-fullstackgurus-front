import React, { useEffect, useState, useRef } from 'react';
import { Button, Card, CardContent, CardHeader, Typography, TextField, InputLabel, Box, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem, Select, FormControl, CircularProgress, } from '@mui/material';
import { Add as PlusIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowLeftIcon, ExpandMore as ExpandMoreIcon, BorderColor, } from '@mui/icons-material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useNavigate } from 'react-router-dom';
import { grey } from '@mui/material/colors';
import { deleteCategory, editCategory, getCategories, saveCategory } from '../../api/CategoryApi';
import { deleteExercise, editExercise, getExerciseFromCategory, saveExercise } from '../../api/ExerciseApi';
import { getTrainings } from '../../api/TrainingApi';
import TopMiddleAlert from '../../personalizedComponents/TopMiddleAlert';
import handleCategoryIcon from '../../personalizedComponents/handleCategoryIcon';
import CreateTrainingDialog from './training_dialog';
import AreYouSureAlert from '../../personalizedComponents/areYouSureAlert';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Visibility as EyeIcon } from '@mui/icons-material'; // Add the Eye icon import
import DialogContentText from '@mui/material/DialogContentText';

import { muscularGroups } from "../../enums/muscularGroups";
import PopularExercisesModal from './popular_exercise_modal';
import LoadingAnimation from '../../personalizedComponents/loadingAnimation';
import LoadingButton from '../../personalizedComponents/buttons/LoadingButton';

interface CategoryWithExercises {
  id: string;
  icon: string,
  name: string;
  owner: string;
  isCustom: boolean;
  exercises: Exercise[];
}

interface Category {
  id: string;
  icon: string,
  name: string;
  owner: string;
  isCustom: boolean;
}

interface Exercise {
  id: string;
  calories_per_hour: number | string;
  category_id: string;
  name: string;
  owner: string;
  public: boolean;
  training_muscle: string;
  image_url?: string;
  equipment_required?: string[];
  alternative_exercise_ids?: string[];
}

interface NewCategory {
  name: string;
  icon: string;
}

interface NewExercise {
  training_muscle: string;
  id: string;
  calories_per_hour: number | string;
  name: string;
  category_id: string;
  equipment_required?: string[];
  alternative_exercise_ids?: string[];
}

interface Trainings {
  id: string;
  name: string;
  owner: string;
  calories_per_hour_mean: number;
  exercises: Exercise[];
}

export default function CategoriesPage() {
  const EQUIPMENT_OPTIONS = ['NONE', 'HOUSEHOLD', 'DUMBBELLS', 'BANDS', 'KETTLEBELL', 'BARBELL', 'MACHINE', 'CARDIO', 'UNKNOWN'];

  const navigate = useNavigate();
  const effectRan = useRef(false);
  const [loading, setLoading] = useState(true);

  const [categoryWithExercises, setCategoryWithExercises] = useState<CategoryWithExercises[]>([]);
  const [trainings, setTrainings] = useState<Trainings[]>([]);

  const [newCategory, setNewCategory] = useState<NewCategory | null>(null);
  const [newExercise, setNewExercise] = useState<NewExercise | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | any | null>(null);

  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editExerciseDialogOpen, setEditExerciseDialogOpen] = useState(false);

  const handleOpenAddCategoryDialog = () => setAddCategoryDialogOpen(true);
  const handleCloseAddCategoryDialog = () => setAddCategoryDialogOpen(false);

  const [createNewTraining, setCreateNewTraining] = useState(false);

  const handleOpenAddTrainingDialog = () => setCreateNewTraining(true);
  const handleCloseAddTrainingDialog = () => setCreateNewTraining(false);

  const [alertCategoryAddedOpen, setAlertCategoryAddedOpen] = useState(false);
  const [alertCategoryFillFieldsOpen, setAlertCategoryFillFieldsOpen] = useState(false);
  const [alertExerciseAddedOpen, setAlertExerciseAddedOpen] = useState(false);
  const [alertExerciseFillFieldsOpen, setAlertExerciseFillFieldsOpen] = useState(false);
  const [alertTrainingAddedOpen, setAlertTrainingAddedOpen] = useState(false);
  const [alertCategoryEditedOpen, setAlertCategoryEditedOpen] = useState(false);
  const [alertExerciseEditedOpen, setAlertExerciseEditedOpen] = useState(false);
  const [alertCategoryDeletedSuccessOpen, setAlertCategoryDeletedSuccessOpen] = useState(false);
  const [alertCategoryDeletedErrorOpen, setAlertCategoryDeletedErrorOpen] = useState(false);
  const [alertExerciseDeletedSuccessOpen, setAlertExerciseDeletedSuccessOpen] = useState(false);
  const [alertExerciseDeletedErrorOpen, setAlertExerciseDeletedErrorOpen] = useState(false);

  const [deleteCategoryAlertOpen, setDeleteCategoryAlertOpen] = useState(false);
  const [deleteExerciseAlertOpen, setDeleteExerciseAlertOpen] = useState(false);
  const [categoryDataToDelete, setCategoryDataToDelete] = useState('');
  const [exerciseDataToDelete, setExerciseDataToDelete] = useState<{ exerciseId: string, categoryId: string } | null>(null);
  const [loadingButton, setLoadingButton] = useState<boolean>(false)

  // Add state for the modal to display the image
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [openRankingModal, setOpenRankingModal] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState<'ALL' | 'NONE' | 'HOUSEHOLD'>('ALL');


  const handleCloseRankingModal = () => {
    setOpenRankingModal(false);
  };

  const normalizeEquipment = (equipment: string[] | undefined) => {
    if (!equipment || !Array.isArray(equipment)) return [];
    return equipment.map((item) => (typeof item === 'string' ? item.toUpperCase() : '')).filter(Boolean);
  };

  const isExerciseCompatibleWithFilter = (exercise: Exercise) => {
    if (equipmentFilter === 'ALL') return true;
    const equipment = normalizeEquipment(exercise.equipment_required);
    if (equipmentFilter === 'NONE') {
      return equipment.includes('NONE');
    }
    if (equipmentFilter === 'HOUSEHOLD') {
      return equipment.includes('HOUSEHOLD') || equipment.includes('NONE');
    }
    return true;
  };

  const getEquipmentBadge = (exercise: Exercise) => {
    const equipment = normalizeEquipment(exercise.equipment_required);
    if (!equipment.length) return 'UNKNOWN';
    return equipment.join(', ');
  };

  // Function to handle opening the image modal
  const handleOpenImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  // Function to handle closing the image modal
  const handleCloseImageModal = () => {
    setSelectedImage(null);
    setImageModalOpen(false);
  };


  const [imageFile, setImageFile] = useState<File | null>(null); // State to store the selected image file
  const [uploading, setUploading] = useState(false); // State to track upload status

  // File input change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]); // Store the selected image file
    }
  };

  const handleCategoryDataToDelete = (categoryId: string) => {
    setCategoryDataToDelete(categoryId);
    setDeleteCategoryAlertOpen(true);
  }

  const handleExerciseDataToDelete = (exerciseId: string, categoryId: string) => {
    setExerciseDataToDelete({ exerciseId, categoryId });
    setDeleteExerciseAlertOpen(true);
  };

  const handleCloseAgreeDeleteCategoryAlert = (categoryId: string) => {
    setDeleteCategoryAlertOpen(false);
    handleDeleteCategory(categoryId);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId, trainings);
      setCategoryWithExercises(categoryWithExercises.filter((category) => category.id !== categoryId));
      setAlertCategoryDeletedSuccessOpen(true);
      localStorage.removeItem('categories');
      localStorage.removeItem('categories_with_exercises');
    } catch (error) {
      setAlertCategoryDeletedErrorOpen(true);
      console.error('Error al eliminar la categoría:', error);
    }
  };

  const handleCloseAgreeDeleteExerciseAlert = (dataToDelete: { exerciseId: string, categoryId: string }) => {
    setDeleteExerciseAlertOpen(false);
    handleDeleteExercise(dataToDelete.exerciseId, dataToDelete.categoryId);
  };

  const handleDeleteExercise = async (exerciseId: string, categoryId: string) => {
    try {
      await deleteExercise(exerciseId, trainings);
      setCategoryWithExercises(
        categoryWithExercises.map((category) => {
          if (category.id === categoryId) {
            return {
              ...category,
              exercises: category.exercises.filter((exercise) => exercise.id !== exerciseId),
            };
          }
          return category;
        })
      );
      setAlertExerciseDeletedSuccessOpen(true);
      localStorage.removeItem('categories_with_exercises'); // Ya que se actualizaron exercises, hago que después se vuelva a cargar
    } catch (error) {
      setAlertExerciseDeletedErrorOpen(true);
      console.log('Error al eliminar el ejercicio:', error);
      console.error('Error al eliminar el ejercicio:', error);
    }
  };

  const handleCloseDisagreeDeleteCategoryAlert = () => {
    setDeleteCategoryAlertOpen(false)
  };

  const handleCloseDisagreeDeleteExerciseAlert = () => {
    setDeleteExerciseAlertOpen(false)
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
  }

  useEffect(() => {
    // El effectRan lo utilizo para que el useEffect se ejecute solo una vez, ya que por default se ejecuta dos veces
    if (!effectRan.current) {
      const fetchCategories = async () => {
        try {
          setLoading(true);

          const trainings = await getAllTrainings();
          if (trainings) {
            setTrainings(trainings);
          }

          const categories = await getAllCategories();
          for (const category of categories) {
            await getExercisesFromCategory(category);
          }
        } catch (error) {
          console.error('Error al obtener las categorías:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCategories();
      effectRan.current = true;
    }
  }, []);

  // Pensar quizás en optimizar esta funcionalidad, ya que se hace una llamada a la API por cada categoría, lo cual puede ser ineficiente
  // Podríamos hacer una unica llamada, mandando todas las categorías y que nos devuelva listas de todas las categorías con todos sus ejercicios
  const getExercisesFromCategory = async (category: Category) => {
    try {
      const exercises = await getExerciseFromCategory(category.id);
      console.log("Setting category with exercises", category, exercises);
      setCategoryWithExercises((prev) => [
        ...prev,
        { ...category, exercises }
      ]);
    } catch (error) {
      console.error('Error al obtener todas las categorías:', error);
    }
  };

  const handleOpenAddExerciseDialog = (categoryId: string) => {
    setNewExercise({
      ...newExercise,
      category_id: categoryId,
      calories_per_hour: newExercise?.calories_per_hour || 0,
      name: newExercise?.name || '',
      id: '',
      training_muscle: newExercise?.training_muscle || '',
      equipment_required: newExercise?.equipment_required || ['NONE'],
      alternative_exercise_ids: newExercise?.alternative_exercise_ids || [],
    });
    setAddExerciseDialogOpen(true);
  };
  const handleCloseAddExerciseDialog = () => {
    setAddExerciseDialogOpen(false);
    setNewExercise(null);
    setImageFile(null)
  };

  const handleOpenEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryDialogOpen(true);
  };
  const handleCloseEditCategoryDialog = () => {
    setEditCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  const handleOpenEditExerciseDialog = (Exercise: Exercise) => {
    setEditingExercise(Exercise);
    setEditExerciseDialogOpen(true);
  };
  const handleCloseEditExerciseDialog = () => {
    setEditExerciseDialogOpen(false);
    setEditingExercise(null);
  };

  const handleAddCategory = async () => {
    if (newCategory && newCategory.name && newCategory.icon) {
      // Para evitar recargar la pagina de vuelta, hago un save en el front, mientras igualmente se guarda en el back. Esto es para evitar recarga lenta
      // y que se muestre inmediatamente la nueva categoría agregada
      try {
        setLoadingButton(true)
        const category = await saveCategory(newCategory);
        setNewCategory({ name: '', icon: '' });
        setCategoryWithExercises((prev) => [
          ...prev,
          { ...category, exercises: [] }
        ]);
        setAlertCategoryAddedOpen(true);
        localStorage.removeItem('categories');
        localStorage.removeItem('categories_with_exercises');
      } catch (error) {
        setLoadingButton(false)
        console.error('Error al guardar la categoría:', error)
      }
      setLoadingButton(false)
      handleCloseAddCategoryDialog();
    }
    else {
      setAlertCategoryFillFieldsOpen(true);
    }
  };



  const handleAddExercise = async () => {
    if (newExercise) {
      if (imageFile) {
        setUploading(true);
        setLoadingButton(true) // Show loading indicator
        setLoadingButton(true)
        const storage = getStorage();
        const storageRef = ref(storage, `exercises/${imageFile.name}`);

        // Upload the image to Firebase Storage
        await uploadBytes(storageRef, imageFile);

        // Get the download URL for the uploaded image
        const image_url = await getDownloadURL(storageRef);


        const exerciseToSave = {
          ...newExercise,
          training_muscle: newExercise.training_muscle || 'Fullbody',
          image_url,
          equipment_required: newExercise.equipment_required || ['NONE'],
          alternative_exercise_ids: newExercise.alternative_exercise_ids || [],
        };

        if (exerciseToSave.name && exerciseToSave.calories_per_hour && exerciseToSave.category_id && exerciseToSave.training_muscle) {
          try {
            const exercise = await saveExercise(exerciseToSave);
            setImageFile(null);
            setUploading(false);
            setCategoryWithExercises(
              categoryWithExercises.map((category) => {
                if (category.id === exerciseToSave.category_id) {
                  return {
                    ...category,
                    exercises: [
                      ...category.exercises,
                      exercise
                    ],
                  };
                }
                return category;
              })
            );
            setNewExercise(null);
            setAlertExerciseAddedOpen(true);
            setLoadingButton(false);
            localStorage.removeItem('categories');
            localStorage.removeItem('categories_with_exercises');
          } catch (error) {
            console.error('Error al guardar el ejercicio:', error);
            setLoadingButton(false)
          }
          handleCloseAddExerciseDialog();
          setLoadingButton(false)
        }
        else {
          setAlertExerciseFillFieldsOpen(true);
        }
      }
      else {
        setAlertExerciseFillFieldsOpen(true);
      }
    };
  }

  const handleEditCategory = async () => {
    if (editingCategory) {
      try {
        await editCategory({ name: editingCategory.name, icon: editingCategory.icon }, editingCategory.id);
        setCategoryWithExercises(
          categoryWithExercises.map((category) =>
            category.id === editingCategory.id ? { ...editingCategory, exercises: category.exercises } : category
          )
        );
        setAlertCategoryEditedOpen(true);
        localStorage.removeItem('categories');
        localStorage.removeItem('categories_with_exercises');
      } catch (error) {
        console.error('Error al editar la categoría:', error);
      }
      setEditingCategory(null);
      handleCloseEditCategoryDialog();
    }
  };

  const handleEditExercise = async () => {
    if (editingExercise) {
      try {
        setLoadingButton(true);

        let image_url = editingExercise.image_url;
        if (imageFile) {
          const storage = getStorage();
          const storageRef = ref(storage, `exercises/${imageFile.name}`);

          // Upload the new image to Firebase Storage
          await uploadBytes(storageRef, imageFile);
          // Get the download URL for the uploaded image
          image_url = await getDownloadURL(storageRef);
        }

        await editExercise(
          {
            name: editingExercise.name,
            calories_per_hour: editingExercise.calories_per_hour,
            training_muscle: editingExercise.training_muscle,
            image_url,
            equipment_required: editingExercise.equipment_required || ['NONE'],
            alternative_exercise_ids: editingExercise.alternative_exercise_ids || [],
          },
          editingExercise.id
        );

        setCategoryWithExercises(
          categoryWithExercises.map((category) => {
            if (category.id === editingExercise.category_id) {
              return {
                ...category,
                exercises: category.exercises.map((exercise) =>
                  exercise.id === editingExercise.id ? { ...editingExercise, image_url } : exercise
                ),
              };
            }
            return category;
          })
        );

        setAlertExerciseEditedOpen(true);
        setImageFile(null);
        setLoadingButton(false);
        handleCloseEditExerciseDialog();
        setLoading(true);
        const trainings = await getAllTrainings();
        if (trainings) {
          setTrainings(trainings);
        }
        setLoading(false);
        localStorage.removeItem('categories');
        localStorage.removeItem('categories_with_exercises');
      } catch (error) {
        setLoadingButton(false);
        console.error('Error al editar el ejercicio:', error);
      }
      setEditingExercise(null);
      setLoadingButton(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/homepage');
  };

  const handleTrophyButton = () => {
    setOpenRankingModal(true);
  };

  const allExercises = categoryWithExercises.flatMap((category) =>
    category.exercises.map((exercise) => ({
      ...exercise,
      category_name: category.name,
    }))
  );

  return (
    <Box sx={{ 'backgroundColor': 'black', color: 'white', p: 4 }}  >
      <Box component="header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <div className="flex items-center">
          <IconButton component="a" sx={{ color: 'white' }} onClick={handleBackToHome}>
            <ArrowLeftIcon />
          </IconButton>
          <img src={require('../../images/logo.png')} alt="Logo" width={200} height={150} className="hidden md:block" />
        </div>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.3rem', sm: '1.8rem', md: '2.5rem' }, ml: { xs: 0, sm: -12, md: -14 } }}>Categories, Exercises & Trainings</Typography>
        <div style={{display:'flex', flexDirection:'row', alignItems:'center', justifyContent: 'center'}}>
          <IconButton component="a" sx={{ color: 'white' }} onClick={handleTrophyButton}>
            <EmojiEventsIcon sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }} />
          </IconButton>
          <p>Top exercises</p>
          <PopularExercisesModal open={openRankingModal} onClose={handleCloseRankingModal} />
        </div>
      </Box >

      <TopMiddleAlert alertText='Added category successfully' open={alertCategoryAddedOpen} onClose={() => setAlertCategoryAddedOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Added exercise successfully' open={alertExerciseAddedOpen} onClose={() => setAlertExerciseAddedOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Added training successfully' open={alertTrainingAddedOpen} onClose={() => setAlertTrainingAddedOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Edited category successfully' open={alertCategoryEditedOpen} onClose={() => setAlertCategoryEditedOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Edited exercise successfully' open={alertExerciseEditedOpen} onClose={() => setAlertExerciseEditedOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Deleted category successfully' open={alertCategoryDeletedSuccessOpen} onClose={() => setAlertCategoryDeletedSuccessOpen(false)} severity='success' />
      <TopMiddleAlert alertText='Deleted exercise successfully' open={alertExerciseDeletedSuccessOpen} onClose={() => setAlertExerciseDeletedSuccessOpen(false)} severity='success' />
      <TopMiddleAlert alertText='You cannot delete an exercise that is part of a training' open={alertExerciseDeletedErrorOpen} onClose={() => setAlertExerciseDeletedErrorOpen(false)} severity='warning' />
      <TopMiddleAlert alertText='You cannot delete a category that has exercises in a training' open={alertCategoryDeletedErrorOpen} onClose={() => setAlertCategoryDeletedErrorOpen(false)} severity='warning' />
      <TopMiddleAlert alertText='Please fill all fields' open={alertCategoryFillFieldsOpen} onClose={() => setAlertCategoryFillFieldsOpen(false)} severity='warning' />
      <TopMiddleAlert alertText='Please fill all fields' open={alertExerciseFillFieldsOpen} onClose={() => setAlertExerciseFillFieldsOpen(false)} severity='warning' />

      {
        deleteCategoryAlertOpen &&
        <AreYouSureAlert areYouSureTitle='Are you sure you want to delete this category?' areYouSureText='You will not be able to recuperate it'
          open={deleteCategoryAlertOpen} handleCloseAgree={handleCloseAgreeDeleteCategoryAlert} handleCloseDisagree={handleCloseDisagreeDeleteCategoryAlert} dataToDelete={categoryDataToDelete}
        />
      }
      {
        deleteExerciseAlertOpen &&
        <AreYouSureAlert areYouSureTitle='Are you sure you want to delete this exercise?' areYouSureText='You will not be able to recuperate it'
          open={deleteExerciseAlertOpen} handleCloseAgree={handleCloseAgreeDeleteExerciseAlert} handleCloseDisagree={handleCloseDisagreeDeleteExerciseAlert} dataToDelete={exerciseDataToDelete}
        />
      }

      {
        loading ? (
          <LoadingAnimation />
        ) : (
          <Box sx={{ display: 'flex', gap: 2, height: '100%', flexDirection: { xs: 'column', sm: 'row' } }}>
            {/* Card de Categorías */}
            <Card sx={{ flex: 1, backgroundColor: '#161616', color: '#fff', width: '100%', height: '100%' }} >
              <CardHeader
                title="Categories"
                titleTypographyProps={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' }, variant: 'h6' }}
                action={
                  <IconButton aria-label="add" onClick={handleOpenAddCategoryDialog}>
                    <PlusIcon sx={{ color: grey[50], fontSize: 25 }} />
                    <div>
                      <Typography className='p-1 text-white text-lg'>Add New Category</Typography>
                    </div>
                  </IconButton>
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="equipment-filter" sx={{ color: '#fff' }}>Equipment Filter</InputLabel>
                    <Select
                      labelId="equipment-filter"
                      id="equipment-filter"
                      label="Equipment Filter"
                      value={equipmentFilter}
                      onChange={(e) => setEquipmentFilter(e.target.value as 'ALL' | 'NONE' | 'HOUSEHOLD')}
                      sx={{
                        color: '#fff',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                        '& .MuiSvgIcon-root': { color: '#fff' },
                      }}
                      MenuProps={{ PaperProps: { sx: { backgroundColor: '#444', color: '#fff' } } }}
                    >
                      <MenuItem value="ALL">All</MenuItem>
                      <MenuItem value="NONE">No Equipment</MenuItem>
                      <MenuItem value="HOUSEHOLD">Household</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ height: 'calc(102vh - 300px)', overflowY: 'auto' }}>
                  {categoryWithExercises.map((category) => (
                    <Accordion key={category.id} sx={{ backgroundColor: "#161616", color: 'white' }} className='border border-gray-600'>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                        aria-controls={`panel-${category.id}-content`}
                        id={`panel-${category.id}-header`}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {handleCategoryIcon(category.icon)}
                          <Typography sx={{ ml: 1, fontWeight: 'bold', fontSize: '1.2rem' }}>{category.name}</Typography>
                        </Box>
                        {category.isCustom && (
                          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                            <IconButton size="small" color="inherit" onClick={() => handleOpenEditCategoryDialog(category)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="inherit" onClick={() => handleCategoryDataToDelete(category.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ pl: 4 }}>
                          {category.exercises.filter((exercise: Exercise) => isExerciseCompatibleWithFilter(exercise)).map((exercise: Exercise) => (
                            <Box key={exercise.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography>{exercise.name}</Typography>
                                <Typography sx={{ fontSize: '0.7rem', marginLeft: 3 }}>({exercise.training_muscle})</Typography>
                                <Typography sx={{ fontSize: '0.7rem', marginLeft: 3 }}>({exercise.calories_per_hour} kcal/h)</Typography>
                                <Typography sx={{ fontSize: '0.7rem', marginLeft: 3 }}>[{getEquipmentBadge(exercise)}]</Typography>
                              </Box>
                              <Box>
                                {!exercise.public && (
                                  <Box>
                                    <IconButton size="small" color="inherit" onClick={() => handleOpenEditExerciseDialog(exercise)}>
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton size="small" color="inherit" onClick={() => handleExerciseDataToDelete(exercise.id, category.id)}>
                                      <DeleteIcon />
                                    </IconButton>
                                    {exercise.image_url && (
                                      <IconButton size="small" color="inherit" onClick={() => exercise.image_url && handleOpenImageModal(exercise.image_url)}>
                                        <EyeIcon />
                                      </IconButton>
                                    )}
                                  </Box>
                                )}

                              </Box>
                            </Box>
                          ))}
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PlusIcon />}
                            sx={{ mt: 2 }}
                            onClick={() => handleOpenAddExerciseDialog(category.id)}
                          >
                            Add Custom Exercise
                          </Button>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </CardContent>
            </Card>
            <Dialog open={imageModalOpen} onClose={handleCloseImageModal} fullWidth maxWidth="sm">
              <DialogTitle>Exercise Image</DialogTitle>
              <DialogContent>
                {selectedImage ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <img src={selectedImage} alt="Exercise" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                  </Box>
                ) : (
                  <DialogContentText>No image available</DialogContentText>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseImageModal} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>

            {/* Nueva Card de Trainings */}
            <Card sx={{ flex: 1, backgroundColor: '#161616', color: '#fff', width: '100%', height: '100%' }}>
              <CardHeader
                title="Trainings"
                titleTypographyProps={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' }, variant: 'h6' }}
                action={
                  <IconButton aria-label="add" onClick={handleOpenAddTrainingDialog}>
                    <PlusIcon sx={{ color: grey[50], fontSize: 25 }} />
                    <div>
                      <Typography className='p-1 text-white text-lg'>Create new Training</Typography>
                    </div>
                  </IconButton>
                }
              />
              <CardContent>
                <Box sx={{ height: 'calc(102vh - 300px)', overflowY: 'auto' }}>
                  {trainings.map((training) => (
                    <Accordion key={training.id} sx={{ backgroundColor: '#161616', color: 'white' }} className='border border-gray-600' >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                        aria-controls={`panel-${training.id}-content`}
                        id={`panel-${training.id}-header`}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{training.name}</Typography>
                        </Box>
                        <Typography sx={{ ml: 'auto', fontWeight: 'bold', fontSize: '1rem' }}>
                          {training.calories_per_hour_mean} kcal/h
                        </Typography>
                      </AccordionSummary>
                      {<AccordionDetails>
                        <Box sx={{ pl: 4 }}>
                          {training.exercises.map((exercise) => (
                            <Box key={exercise.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography>{exercise.name}</Typography>
                                <Typography sx={{ fontSize: '0.7rem', marginLeft: 3 }}>({exercise.calories_per_hour} kcal/h)</Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </AccordionDetails>}
                    </Accordion>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )
      }

      {/* Add Category Dialog */}
      <Dialog open={addCategoryDialogOpen} onClose={handleCloseAddCategoryDialog} fullWidth={true} maxWidth={'xs'}
        PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff',
            borderRadius: '8px',
            padding: 2,
          },
        }}>
        <DialogTitle sx={{ color: '#fff', textAlign: 'center' }}>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="category-name"
            label="Name"
            InputLabelProps={{
              style: { color: '#fff' }, // Color del label (Duration)
            }}
            InputProps={{
              style: { color: '#fff' }, // Color del texto dentro del input
            }}
            slotProps={{
              htmlInput: { min: 1, max: 1000 }
            }}
            type="text"
            fullWidth
            variant="standard"
            value={newCategory?.name || ''}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, icon: newCategory?.icon || '' })}
            sx={{ mb: 3 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="icon-label " sx={{
              color: '#fff',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#fff',
              },
              '& .MuiSvgIcon-root': {
                color: '#fff',
              }
            }}>Icon</InputLabel>
            <Select
              labelId="icon-label"
              id="icon"
              label="Icon"
              value={newCategory?.icon || ''}
              onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value, name: newCategory?.name || '' })}
              MenuProps={{
                PaperProps: {
                  sx: {
                    /* display: 'flex',
                    flexWrap: 'wrap',
                    maxWidth: 300,
                    padding: 1, */
                    backgroundColor: '#444',
                    color: '#fff', // Color del texto en Select
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#fff', // Color del borde
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#fff', // Color del ícono (flecha de selección)
                    }

                  },
                },
              }}
            >
              <MenuItem value="">
                <em>Select an icon</em>
              </MenuItem>
              <MenuItem value="Dumbbell">{handleCategoryIcon('Dumbbell')}</MenuItem>
              <MenuItem value="Ball">{handleCategoryIcon('Ball')}</MenuItem>
              <MenuItem value="Heart">{handleCategoryIcon('Heart')}</MenuItem>
              <MenuItem value="Basketball">{handleCategoryIcon('Basketball')}</MenuItem>
              <MenuItem value="Tennis">{handleCategoryIcon('Tennis')}</MenuItem>
              <MenuItem value="Fight">{handleCategoryIcon('Fight')}</MenuItem>
              <MenuItem value="Martial">{handleCategoryIcon('Martial')}</MenuItem>
              <MenuItem value="Mma">{handleCategoryIcon('Mma')}</MenuItem>
              <MenuItem value="Motorsports">{handleCategoryIcon('Motorsports')}</MenuItem>
              <MenuItem value="Hiking">{handleCategoryIcon('Hiking')}</MenuItem>
              <MenuItem value="Sailing">{handleCategoryIcon('Sailing')}</MenuItem>
              <MenuItem value="Skiing">{handleCategoryIcon('Skiing')}</MenuItem>
              <MenuItem value="Pool">{handleCategoryIcon('Pool')}</MenuItem>
              <MenuItem value="Skate">{handleCategoryIcon('Skate')}</MenuItem>
              <MenuItem value="Rugby">{handleCategoryIcon('Rugby')}</MenuItem>
              <MenuItem value="Volleyball">{handleCategoryIcon('Volleyball')}</MenuItem>
            </Select >
          </FormControl >
        </DialogContent >
        <DialogActions>
          <LoadingButton
            isLoading={false}
            onClick={handleCloseAddCategoryDialog}
            label="CANCEL"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
          <LoadingButton
            isLoading={loadingButton}
            onClick={handleAddCategory}
            label="SAVE CHANGES"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
        </DialogActions>
      </Dialog >

      {/* Add Exercise Dialog */}
      < Dialog open={addExerciseDialogOpen} onClose={handleCloseAddExerciseDialog} fullWidth={true} maxWidth={'xs'}
        PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff',
            borderRadius: '8px',
            padding: 2,
          },
        }
        }>
        <DialogTitle>Add New Exercise</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="exercise-name"
            label="Name"
            type="text"
            fullWidth
            variant="standard"
            value={newExercise?.name || ''}
            InputLabelProps={{
              style: { color: '#fff' }, // Color del label (Duration)
            }}
            InputProps={{
              style: { color: '#fff' }, // Color del texto dentro del input
            }}
            slotProps={{
              htmlInput: { min: 1, max: 1000 }
            }}
            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value, calories_per_hour: newExercise?.calories_per_hour || 1, category_id: newExercise?.category_id || '', id: '', training_muscle: newExercise?.training_muscle || '' })}
          />
          <TextField
            margin="dense"
            id="exercise-calories"
            label="Kcal per Hour"
            type="number"
            fullWidth
            variant="standard"
            value={newExercise?.calories_per_hour ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setNewExercise({
                  ...newExercise,
                  id: '',
                  calories_per_hour: "",
                  name: newExercise?.name || '',
                  category_id: newExercise?.category_id || '',
                  training_muscle: newExercise?.training_muscle || ''
                });
              } else {
                const numericValue = parseInt(value, 10);
                if (numericValue >= 1 && numericValue <= 4000) {
                  setNewExercise({
                    ...newExercise,
                    id: '',
                    calories_per_hour: numericValue,
                    name: newExercise?.name || '',
                    category_id: newExercise?.category_id || '',
                    training_muscle: newExercise?.training_muscle || ''
                  });
                } else if (numericValue < 1) {
                  setNewExercise({
                    ...newExercise,
                    id: '',
                    calories_per_hour: 1,
                    name: newExercise?.name || '',
                    category_id: newExercise?.category_id || '',
                    training_muscle: newExercise?.training_muscle || ''
                  });
                } else if (numericValue > 4000) {
                  setNewExercise({
                    ...newExercise,
                    id: '',
                    calories_per_hour: 4000,
                    name: newExercise?.name || '',
                    category_id: newExercise?.category_id || '',
                    training_muscle: newExercise?.training_muscle || ''
                  });
                }
              }
            }}
            placeholder="Kcal per Hour"
            InputLabelProps={{
              style: { color: '#fff' }, // Color del label (Duration)
            }}
            InputProps={{
              style: { color: '#fff' }, // Color del texto dentro del input
            }}
            slotProps={{
              htmlInput: { min: 1, max: 4000 }
            }}
          />
          <FormControl fullWidth sx={{ marginTop: 4 }}>
            <InputLabel id="muscle-label">Muscular Group</InputLabel>
            <Select
              labelId="muscle-label"
              id="muscle"
              value={newExercise?.training_muscle || 'Fullbody'}
              onChange={(e) =>
                setNewExercise({
                  ...newExercise,
                  training_muscle: e.target.value,
                  name: newExercise?.name || '',
                  calories_per_hour: newExercise?.calories_per_hour || 1,
                  category_id: newExercise?.category_id || '',
                  id: ''
                })
              }
              label="Muscular Group"
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxWidth: 300,
                    backgroundColor: '#444',
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#fff',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#fff',
                    }
                  },
                },
              }}
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
            >
              <MenuItem value="">
                <em>Select a muscle</em>
              </MenuItem>
              {muscularGroups.map((muscle) => (
                <MenuItem key={muscle} value={muscle}>
                  {muscle}
                </MenuItem>
              ))}
            </Select>

          </FormControl>
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel id="equipment-required-label">Equipment Required</InputLabel>
            <Select
              labelId="equipment-required-label"
              id="equipment-required"
              multiple
              value={newExercise?.equipment_required || ['NONE']}
              onChange={(e) =>
                setNewExercise({
                  ...newExercise,
                  equipment_required: e.target.value as string[],
                  name: newExercise?.name || '',
                  calories_per_hour: newExercise?.calories_per_hour || 1,
                  category_id: newExercise?.category_id || '',
                  training_muscle: newExercise?.training_muscle || 'Fullbody',
                  id: '',
                  alternative_exercise_ids: newExercise?.alternative_exercise_ids || [],
                })
              }
              label="Equipment Required"
              renderValue={(selected) => (selected as string[]).join(', ')}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxWidth: 300,
                    backgroundColor: '#444',
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                    '& .MuiSvgIcon-root': { color: '#fff' },
                  },
                },
              }}
              sx={{
                marginBottom: 1,
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                '& .MuiSvgIcon-root': { color: '#fff' },
              }}
            >
              {EQUIPMENT_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel id="alternatives-label">Alternative Exercises</InputLabel>
            <Select
              labelId="alternatives-label"
              id="alternatives"
              multiple
              value={newExercise?.alternative_exercise_ids || []}
              onChange={(e) =>
                setNewExercise({
                  ...newExercise,
                  alternative_exercise_ids: e.target.value as string[],
                  name: newExercise?.name || '',
                  calories_per_hour: newExercise?.calories_per_hour || 1,
                  category_id: newExercise?.category_id || '',
                  training_muscle: newExercise?.training_muscle || 'Fullbody',
                  id: '',
                  equipment_required: newExercise?.equipment_required || ['NONE'],
                })
              }
              label="Alternative Exercises"
              renderValue={(selected) =>
                (selected as string[])
                  .map((id) => allExercises.find((ex) => ex.id === id)?.name || id)
                  .join(', ')
              }
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxWidth: 320,
                    backgroundColor: '#444',
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                    '& .MuiSvgIcon-root': { color: '#fff' },
                  },
                },
              }}
              sx={{
                marginBottom: 1,
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                '& .MuiSvgIcon-root': { color: '#fff' },
              }}
            >
              {allExercises.map((exercise) => (
                <MenuItem key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.category_name})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <InputLabel htmlFor="upload-image" sx={{ mt: 2, color: '#fff' }}>Upload Exercise Image</InputLabel>
          <label htmlFor="upload-image" style={{ display: 'block', marginTop: '8px' }}>
            <Button
              variant="contained"
              component="span"
              sx={{
                backgroundColor: grey[800],
                color: '#fff',
                textTransform: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
              }}
            >
              Choose File
            </Button>
            <span style={{ marginLeft: '10px', color: '#fff' }}>
              {imageFile ? imageFile.name : 'No file selected'}
            </span>
            <input
              accept="image/*"
              id="upload-image"
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }} // Hide the default input button
            />
          </label>
        </DialogContent >
        <DialogActions>
          <LoadingButton
            isLoading={false}
            onClick={handleCloseAddExerciseDialog}
            label="CANCEL"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
          <LoadingButton
            isLoading={loadingButton}
            onClick={handleAddExercise}
            label="ADD EXERCISE"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
        </DialogActions>
      </Dialog >

      {/* Edit Category Dialog */}
      < Dialog open={editCategoryDialogOpen} onClose={handleCloseEditCategoryDialog} fullWidth={true} maxWidth={'xs'}
        PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff',
            borderRadius: '8px',
            padding: 2,
          },
        }}>
        <DialogTitle>Edit Category</DialogTitle>
        {editingCategory && (
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="edit-category-name"
              label="Name"
              type="text"
              fullWidth
              variant="standard"
              value={editingCategory.name}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              sx={{ mb: 3 }}
              InputLabelProps={{
                style: { color: '#fff' }, // Color del label (Duration)
              }}
              InputProps={{
                style: { color: '#fff' }, // Color del texto dentro del input
              }}
              slotProps={{
                htmlInput: { min: 1, max: 1000 }
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="icon-label">Icon</InputLabel>
              <Select
                labelId="icon-label"
                id="icon"
                label="Icon"
                value={editingCategory.icon}
                onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#444',
                      color: '#fff',
                    },
                  },
                }}
              >
                <MenuItem value="Dumbbell">{handleCategoryIcon('Dumbbell')}</MenuItem>
                <MenuItem value="Ball">{handleCategoryIcon('Ball')}</MenuItem>
                <MenuItem value="Heart">{handleCategoryIcon('Heart')}</MenuItem>
                <MenuItem value="Basketball">{handleCategoryIcon('Basketball')}</MenuItem>
                <MenuItem value="Tennis">{handleCategoryIcon('Tennis')}</MenuItem>
                <MenuItem value="Fight">{handleCategoryIcon('Fight')}</MenuItem>
                <MenuItem value="Martial">{handleCategoryIcon('Martial')}</MenuItem>
                <MenuItem value="Mma">{handleCategoryIcon('Mma')}</MenuItem>
                <MenuItem value="Motorsports">{handleCategoryIcon('Motorsports')}</MenuItem>
                <MenuItem value="Hiking">{handleCategoryIcon('Hiking')}</MenuItem>
                <MenuItem value="Sailing">{handleCategoryIcon('Sailing')}</MenuItem>
                <MenuItem value="Skiing">{handleCategoryIcon('Skiing')}</MenuItem>
                <MenuItem value="Pool">{handleCategoryIcon('Pool')}</MenuItem>
                <MenuItem value="Skate">{handleCategoryIcon('Skate')}</MenuItem>
                <MenuItem value="Rugby">{handleCategoryIcon('Rugby')}</MenuItem>
                <MenuItem value="Volleyball">{handleCategoryIcon('Volleyball')}</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={handleCloseEditCategoryDialog} sx={{ color: '#fff' }}>Cancel</Button>
          <Button onClick={handleEditCategory} sx={{ color: '#fff' }}>Save Changes</Button>
        </DialogActions>
      </Dialog >

      {/* Edit Exercise Dialog */}
      < Dialog open={editExerciseDialogOpen} onClose={handleCloseEditExerciseDialog} fullWidth={true} maxWidth={'xs'}
        PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff',
            borderRadius: '8px',
            padding: 2,
          },
        }}>
        <DialogTitle>Edit Exercise</DialogTitle>
        {
          editingExercise && (
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="edit-exercise-name"
                label="Name"
                type="text"
                fullWidth
                variant="standard"
                value={editingExercise.name}
                onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
              />
              <FormControl fullWidth sx={{ marginTop: 2 }}>
                <InputLabel id="muscle-label">Muscular Group</InputLabel>
                <Select
                  labelId="muscle-label"
                  id="muscle"
                  value={editingExercise.training_muscle}
                  onChange={(e) => setEditingExercise({ ...editingExercise, training_muscle: e.target.value })}
                  label="Muscular Group"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxWidth: 300,
                        backgroundColor: '#444',
                        color: '#fff',
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select a muscle</em>
                  </MenuItem>
                  {muscularGroups.map((muscle) => (
                    <MenuItem key={muscle} value={muscle}>
                      {muscle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ marginTop: 2 }}>
                <InputLabel id="edit-equipment-required-label">Equipment Required</InputLabel>
                <Select
                  labelId="edit-equipment-required-label"
                  id="edit-equipment-required"
                  multiple
                  value={editingExercise.equipment_required || ['NONE']}
                  onChange={(e) =>
                    setEditingExercise({
                      ...editingExercise,
                      equipment_required: e.target.value as string[],
                    })
                  }
                  label="Equipment Required"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxWidth: 300,
                        backgroundColor: '#444',
                        color: '#fff',
                      },
                    },
                  }}
                >
                  {EQUIPMENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ marginTop: 2 }}>
                <InputLabel id="edit-alternatives-label">Alternative Exercises</InputLabel>
                <Select
                  labelId="edit-alternatives-label"
                  id="edit-alternatives"
                  multiple
                  value={editingExercise.alternative_exercise_ids || []}
                  onChange={(e) =>
                    setEditingExercise({
                      ...editingExercise,
                      alternative_exercise_ids: e.target.value as string[],
                    })
                  }
                  label="Alternative Exercises"
                  renderValue={(selected) =>
                    (selected as string[])
                      .map((id) => allExercises.find((ex) => ex.id === id)?.name || id)
                      .join(', ')
                  }
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxWidth: 320,
                        backgroundColor: '#444',
                        color: '#fff',
                      },
                    },
                  }}
                >
                  {allExercises
                    .filter((exercise) => exercise.id !== editingExercise.id)
                    .map((exercise) => (
                      <MenuItem key={exercise.id} value={exercise.id}>
                        {exercise.name} ({exercise.category_name})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                id="edit-exercise-calories"
                label="KCal Per Hour"
                type="number"
                fullWidth
                variant="standard"
                value={editingExercise.calories_per_hour ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setEditingExercise({
                      ...editingExercise,
                      calories_per_hour: ""
                    });
                  } else {
                    const numericValue = parseInt(value, 10);
                    if (numericValue >= 1 && numericValue <= 4000) {
                      setEditingExercise({
                        ...editingExercise,
                        calories_per_hour: numericValue
                      });
                    } else if (numericValue < 1) {
                      setEditingExercise({
                        ...editingExercise,
                        calories_per_hour: 1
                      });
                    } else if (numericValue > 4000) {
                      setEditingExercise({
                        ...editingExercise,
                        calories_per_hour: 4000
                      });
                    }
                  }
                }}
                placeholder="KCal Per Hour"
                slotProps={{
                  htmlInput: { min: 1, max: 4000 }
                }}
              />
              <InputLabel htmlFor="upload-image" sx={{ mt: 2, color: '#fff' }}>Edit Exercise Image</InputLabel>
              <label htmlFor="upload-image" style={{ display: 'block', marginTop: '8px' }}>
                <Button
                  variant="contained"
                  component="span"
                  sx={{
                    backgroundColor: grey[800],
                    color: '#fff',
                    textTransform: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                  }}
                >
                  Choose File
                </Button>
                <span style={{ marginLeft: '10px', color: '#fff' }}>
                  {imageFile ? imageFile.name : 'No file selected'}
                </span>
                <input
                  accept="image/*"
                  id="upload-image"
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }} // Hide the default input button
                />
              </label>
            </DialogContent>
          )
        }
        <DialogActions>
          <LoadingButton
            isLoading={false}
            onClick={handleCloseEditExerciseDialog}
            label="CANCEL"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
          <LoadingButton
            isLoading={loadingButton}
            onClick={handleEditExercise}
            label="SAVE CHANGES"
            icon={<></>}
            borderColor="border-transparent"
            borderWidth="border"
            bgColor="bg-transparent"
            color="text-white"
          />
        </DialogActions>
      </Dialog >

      {/* Create Training Dialog */}
      < CreateTrainingDialog createNewTraining={createNewTraining} handleCloseAddTrainingDialog={handleCloseAddTrainingDialog} categoryWithExercises={categoryWithExercises} setTrainings={setTrainings} setAlertTrainingAddedOpen={setAlertTrainingAddedOpen} />
    </Box >
  );
}
