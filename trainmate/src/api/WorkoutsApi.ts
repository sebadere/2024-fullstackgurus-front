// WorkoutsAPI.ts

import { BASE_URL } from "../constants";


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
