import { BASE_URL } from "../constants";
import { refreshAuthToken } from "../utils/AuthUtils";

export const saveWorkout = async (token: string, workoutData: { exercise: string, duration: number, date: string }) => {
  try {
    const response = await fetch(`${BASE_URL}/save-workout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(workoutData),
    });

    // Si la respuesta es 401, intentamos renovar el token
    if (response.status === 401) {
      console.log('Token expirado, intentando renovar...');
      const newToken = await refreshAuthToken(); // Renueva el token
      // Intentamos la solicitud de nuevo con el nuevo token
      const retryResponse = await fetch(`${BASE_URL}/save-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
        },
        body: JSON.stringify(workoutData),
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Error al guardar el entrenamiento');
      }

      const retryData = await retryResponse.json();
      return retryData;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al guardar el entrenamiento');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al guardar el entrenamiento:', error);
    throw error;
  }
};



export const getWorkouts = async (token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/workouts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Si la respuesta es 401, intentamos renovar el token
    if (response.status === 401) {
      console.log('Token expirado, intentando renovar...');
      const newToken = await refreshAuthToken(); // Renueva el token
      // Intentamos la solicitud de nuevo con el nuevo token
      const retryResponse = await fetch(`${BASE_URL}/workouts`, {
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
      return retryData.workouts;
    }

    // Si no es 401, seguimos con el flujo normal
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener los entrenamientos');
    }

    const data = await response.json();
    return data.workouts;
  } catch (error) {
    console.error('Error al obtener los entrenamientos:', error);
    throw error;
  }
};


export const getWorkoutsCalories = async (token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/get-workouts-calories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Si la respuesta es 401, intentamos renovar el token
    if (response.status === 401) {
      console.log('Token expirado, intentando renovar...');
      const newToken = await refreshAuthToken(); // Renueva el token
      // Intentamos la solicitud de nuevo con el nuevo token
      const retryResponse = await fetch(`${BASE_URL}/workouts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newToken}`,
        },
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Error al obtener las calorias de los entrenamientos');
      }

      const retryData = await retryResponse.json();
      return retryData.workouts;
    }

    // Si no es 401, seguimos con el flujo normal
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener las calorias de los entrenamientos');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener las calorias de los entrenamientos', error);
    throw error;
  }
};
