import { getAuth, sendPasswordResetEmail, updatePassword } from "firebase/auth";

/**
 * Sends a password reset email to the user's email.
 * 
 * @param email - The email address of the user to send the reset password link to.
 * @returns A promise that resolves when the email is sent.
 */
export const sendResetPasswordEmail = async (email: string): Promise<void> => {
  const auth = getAuth();
  
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Se ha enviado un correo para restablecer la contraseña.");
  } catch (error) {
    console.error("Error al enviar el correo: ", error);
    throw error;
  }
};

/**
 * Updates the password for the currently authenticated user.
 * 
 * @param newPassword - The new password to set for the authenticated user.
 * @returns A promise that resolves when the password has been updated.
 */
export const changeUserPassword = async (newPassword: string): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    try {
      await updatePassword(user, newPassword);
      console.log("Contraseña cambiada exitosamente.");
    } catch (error) {
      console.error("Error al cambiar la contraseña: ", error);
      throw error; // Optionally, rethrow the error if needed for UI handling
    }
  } else {
    console.error("No hay usuario autenticado.");
    throw new Error("No user is currently authenticated.");
  }
};

// Función para renovar el token
export const refreshAuthToken = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // Forzar la renovación del token
      const token = await user.getIdToken(true);
      // Actualizar el token en localStorage
      localStorage.setItem('token', token);
      console.log('Token actualizado:', token);
      return token;
    } else {
      throw new Error('Usuario no autenticado');
    }
  } catch (error) {
    console.error('Error al renovar el token:', error);
  }
};
