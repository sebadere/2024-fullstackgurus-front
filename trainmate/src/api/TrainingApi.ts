import { BASE_URL } from "../constants";
import { refreshAuthToken } from "../utils/AuthUtils";

const getAuthToken = () => {
    const token = localStorage.getItem('token');
    return token ? `Bearer ${token}` : null;
};

export const getTrainings = async () => {
    const token = getAuthToken();
    if (!token) throw new Error('Token no encontrado');
    
    try {
    const response = await fetch(`${BASE_URL}/api/trainings/get-trainings`, {
      method: 'GET',
      headers: {
        'Authorization': token
      }
    });

    // Si la respuesta es 403, intentamos renovar el token
    if (response.status === 403 || response.status === 401) {
        console.log('Token expirado, intentando renovar...');
        const newToken = await refreshAuthToken(); // Renueva el token
        // Intentamos la solicitud de nuevo con el nuevo token
        const retryResponse = await fetch(`${BASE_URL}/api/trainings/get-trainings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
        });
  
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData.error || 'Error al obtener los entrenamientos');
        }
  
        const retryData = await retryResponse.json();
        return retryData.trainings;
      }
  
      // Si no es 401, seguimos con el flujo normal
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener los entrenamientos');
      }
  
      const data = await response.json();
      return data.trainings;
    } catch (error) {
      console.error('Error al obtener los entrenamientos:', error);
      throw error;
    }
  };

export const saveTraining = async (trainingData: { exercises: any, name: string}) => {
    
    const token = getAuthToken();
    if (!token) throw new Error('Token no encontrado');

    const exercisesIds = trainingData.exercises.map((ex: { id: string, calories_per_hour: number }) => ({ id: ex.id, calories_per_hour: ex.calories_per_hour }));
    const modifiedTrainingData = {'exercises': exercisesIds, 'name': trainingData.name}
    console.log(modifiedTrainingData)

    try {
      const response = await fetch(`${BASE_URL}/api/trainings/save-training`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(modifiedTrainingData),
      });
  
      // Si la respuesta es 401, intentamos renovar el token
      if (response.status === 403 || response.status === 401) {
        console.log('Token expirado, intentando renovar...');
        const newToken = await refreshAuthToken(); // Renueva el token
        // Intentamos la solicitud de nuevo con el nuevo token
        const retryResponse = await fetch(`${BASE_URL}/api/trainings/save-training`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
          },
          body: JSON.stringify(modifiedTrainingData),
        });
  
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData.error || 'Error al guardar el entrenamiento');
        }
  
        const retryData = await retryResponse.json();
        return retryData.training;
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el entrenamiento');
      }
  
      const data = await response.json();
      return data.training;
    } catch (error) {
      console.error('Error al guardar el entrenamiento:', error);
      throw error;
    }
  }; 

export const adaptTraining = async (payload: { exercises: string[], available_equipment: string[] }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  try {
    const response = await fetch(`${BASE_URL}/api/trainings/adapt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 403 || response.status === 401) {
      const newToken = await refreshAuthToken();
      const retryResponse = await fetch(`${BASE_URL}/api/trainings/adapt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Error al adaptar el entrenamiento');
      }
      return await retryResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al adaptar el entrenamiento');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al adaptar el entrenamiento:', error);
    throw error;
  }
};
