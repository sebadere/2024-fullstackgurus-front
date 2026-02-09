import { BASE_URL } from "../constants";
import { refreshAuthToken } from "../utils/AuthUtils";

const getAuthToken = () => {
    const token = localStorage.getItem('token');
    return token ? `Bearer ${token}` : null;
};

export const getExerciseFromCategory = async (category_id: String) => {
    const token = getAuthToken();
    if (!token) throw new Error('Token no encontrado');
    
    try {
    const response = await fetch(`${BASE_URL}/api/exercise/get-exercises-by-category/${category_id}`, {
      method: 'GET',
      headers: {
        'Authorization': token
      }
    });

    // Si la respuesta es 401, intentamos renovar el token
    if (response.status === 403 || response.status === 401) {
        console.log('Token expirado, intentando renovar...');
        const newToken = await refreshAuthToken(); // Renueva el token
        // Intentamos la solicitud de nuevo con el nuevo token
        const retryResponse = await fetch(`${BASE_URL}/api/exercise/get-exercises-by-category/${category_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
        });
  
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData.error || 'Error al obtener los ejercicios');
        }
  
        const retryData = await retryResponse.json();
        return retryData.exercises;
      }
  
      // Si no es 401, seguimos con el flujo normal
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener los ejercicios');
      }
  
      const data = await response.json();
      return data.exercises;
    } catch (error) {
      console.error('Error al obtener los ejercicios:', error);
      throw error;
    }
  }

  export const saveExercise = async (exerciseData: { name: string, calories_per_hour: number | string, category_id: string, training_muscle: string, image_url: string, equipment_required?: string[], alternative_exercise_ids?: string[] }) => {
    
    const token = getAuthToken();
    if (!token) throw new Error('Token no encontrado');
    
    const modifiedCategoryData = { ...exerciseData, public: false };

    try {
      const response = await fetch(`${BASE_URL}/api/exercise/save-exercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(modifiedCategoryData),
      });
  
      // Si la respuesta es 401, intentamos renovar el token
      if (response.status === 403 || response.status === 401) {
        console.log('Token expirado, intentando renovar...');
        const newToken = await refreshAuthToken(); // Renueva el token
        // Intentamos la solicitud de nuevo con el nuevo token
        const retryResponse = await fetch(`${BASE_URL}/api/exercise/save-exercise`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
          },
          body: JSON.stringify(modifiedCategoryData),
        });
  
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData.error || 'Error al guardar la categoría');
        }
  
        const retryData = await retryResponse.json();
        return retryData.exercise;
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la categoría');
      }
  
      const data = await response.json();
      return data.exercise;
    } catch (error) {
      console.error('Error al guardar la categoría:', error);
      throw error;
    }
  };

export const editExercise = async (exerciseData: { name: string, calories_per_hour: number | string, training_muscle: string, image_url: string, equipment_required?: string[], alternative_exercise_ids?: string[] }, exercise_id: string) => {
        
        console.log(exerciseData)
        const token = getAuthToken();
        if (!token) throw new Error('Token no encontrado');
    
        try {
        const response = await fetch(`${BASE_URL}/api/exercise/edit-exercise/${exercise_id}`, {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
            },
            body: JSON.stringify(exerciseData),
        });
    
        // Si la respuesta es 401, intentamos renovar el token
        if (response.status === 403 || response.status === 401) {
            console.log('Token expirado, intentando renovar...');
            const newToken = await refreshAuthToken(); // Renueva el token
            // Intentamos la solicitud de nuevo con el nuevo token
            const retryResponse = await fetch(`${BASE_URL}/api/exercise/edit-exercise/${exercise_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
            },
            body: JSON.stringify(exerciseData),
            });
    
            if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            throw new Error(errorData.error || 'Error al editar ejercicio');
            }
    
            const success = await retryResponse.json();
            return success;
        }
    
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al editar ejercicio');
        }
    
        const success = await response.json();
        return success;
        } catch (error) {
        console.error('Error al editar ejercicio:', error);
        throw error;
        }
    }

export const deleteExercise = async (exercise_id: string, trainings: any) => {
    // Primero hago validacion de que el ejercicio no este en ningun entrenamiento
    const exerciseInTraining = trainings.find((training: any) => training.exercises.find((ex: any) => ex.exercise_id === exercise_id));
    const exerciseInTrainingNew = trainings.find((training: any) => training.exercises.find((ex: any) => ex.id === exercise_id)); // Esto es temporal, pq si se acaba de crear un training, el exercise no tiene el exercise_id sino un id, hay que corrrgir eso
    if (exerciseInTraining || exerciseInTrainingNew) {
        throw new Error('Exercise is in use in a training, it cannot be deleted');
    }
    else {
      const token = getAuthToken();
        if (!token) throw new Error('Token no encontrado');

        try {
        const response = await fetch(`${BASE_URL}/api/exercise/delete-exercise/${exercise_id}`, {
            method: 'DELETE',
            headers: {
            'Authorization': token,
            },
        });

        // Si la respuesta es 401, intentamos renovar el token
        if (response.status === 403 || response.status === 401) {
            console.log('Token expirado, intentando renovar...');
            const newToken = await refreshAuthToken(); // Renueva el token
            // Intentamos la solicitud de nuevo con el nuevo token
            const retryResponse = await fetch(`${BASE_URL}/api/exercise/delete-exercise/${exercise_id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${newToken}`,
            },
            });

            if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            throw new Error(errorData.error || 'Error al eliminar ejercicio');
            }

            const success = await retryResponse.json();
            return success;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar ejercicio');
        }

        const success = await response.json();
        return success;
        } catch (error) {
        console.error('Error al eliminar ejercicio:', error);
        throw error;
        }
      }
}
