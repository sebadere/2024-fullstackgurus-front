import { BASE_URL } from "../constants";
import { refreshAuthToken } from "../utils/AuthUtils";

const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : null;
};

export interface OutdoorWorkoutPayload {
  activity_type: 'RUNNING' | 'CYCLING' | 'HIKING' | 'WALKING';
  date: string;
  duration_minutes: number;
  distance_km?: number;
  elevation_gain_m?: number;
  calories: number;
  notes?: string;
}

export const addOutdoorWorkout = async (payload: OutdoorWorkoutPayload) => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  try {
    const response = await fetch(`${BASE_URL}/api/outdoor-workouts/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 403 || response.status === 401) {
      const newToken = await refreshAuthToken();
      const retryResponse = await fetch(`${BASE_URL}/api/outdoor-workouts/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Error al guardar outdoor workout');
      }
      return await retryResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al guardar outdoor workout');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al guardar outdoor workout:', error);
    throw error;
  }
};

export const getOutdoorWorkouts = async (startDate?: string, endDate?: string, activityType?: string) => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (activityType) params.append('activity_type', activityType);

  try {
    const response = await fetch(`${BASE_URL}/api/outdoor-workouts/list?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': token,
      },
    });

    if (response.status === 403 || response.status === 401) {
      const newToken = await refreshAuthToken();
      const retryResponse = await fetch(`${BASE_URL}/api/outdoor-workouts/list?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newToken}`,
        },
      });
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Error al obtener outdoor workouts');
      }
      const retryData = await retryResponse.json();
      return retryData.outdoor_workouts;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener outdoor workouts');
    }

    const data = await response.json();
    return data.outdoor_workouts;
  } catch (error) {
    console.error('Error al obtener outdoor workouts:', error);
    throw error;
  }
};

export const updateOutdoorWorkout = async (workoutId: string, payload: OutdoorWorkoutPayload) => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  try {
    const response = await fetch(`${BASE_URL}/api/outdoor-workouts/update/${workoutId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 403 || response.status === 401) {
      const newToken = await refreshAuthToken();
      const retryResponse = await fetch(`${BASE_URL}/api/outdoor-workouts/update/${workoutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Error al actualizar outdoor workout');
      }
      return await retryResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar outdoor workout');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al actualizar outdoor workout:', error);
    throw error;
  }
};

export const deleteOutdoorWorkout = async (workoutId: string) => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  try {
    const response = await fetch(`${BASE_URL}/api/outdoor-workouts/delete/${workoutId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
      },
    });

    if (response.status === 403 || response.status === 401) {
      const newToken = await refreshAuthToken();
      const retryResponse = await fetch(`${BASE_URL}/api/outdoor-workouts/delete/${workoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${newToken}`,
        },
      });
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Error al eliminar outdoor workout');
      }
      return await retryResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar outdoor workout');
    }

    return await response.json();
  } catch (error) {
    console.error('Error al eliminar outdoor workout:', error);
    throw error;
  }
};
