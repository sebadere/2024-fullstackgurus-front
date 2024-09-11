import { BASE_URL } from "../constants";

// Obtener el token del usuario autenticado desde el localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : null;
};

// Manejo de errores
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error desconocido en la solicitud');
  }
  return response.json();
};

/**
 * Función para guardar la información del usuario
 * @param userInfo Objeto que contiene la información del usuario
 */
export const saveUserInfo = async (userInfo: { full_name: string; gender: string; weight: string; height: string }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  const response = await fetch(`${BASE_URL}/save-user-info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify(userInfo)
  });

  return handleResponse(response);
};

/**
 * Función para obtener la información del usuario
 */
export const getUserProfile = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  const response = await fetch(`${BASE_URL}/get-user-info`, {
    method: 'GET',
    headers: {
      'Authorization': token
    }
  });

  return handleResponse(response);
};

/**
 * Función para actualizar la información del usuario
 * @param userInfo Objeto que contiene la información actualizada del usuario
 */
export const updateUserProfile = async (userInfo: { full_name?: string; gender?: string; weight?: string; height?: string }) => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  const response = await fetch(`${BASE_URL}/update-user-info`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify(userInfo)
  });

  return handleResponse(response);
};

/**
 * Función para eliminar la cuenta del usuario
 */
export const deleteUser = async () => {
  const token = getAuthToken();
  if (!token) throw new Error('Token no encontrado');

  const response = await fetch(`${BASE_URL}/delete-user`, {
    method: 'DELETE',
    headers: {
      'Authorization': token
    }
  });

  return handleResponse(response);
};
