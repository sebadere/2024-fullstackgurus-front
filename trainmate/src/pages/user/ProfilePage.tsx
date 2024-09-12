import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Card, CardContent, CardHeader, IconButton } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';  // Importa useNavigate
import { getUserProfile, updateUserProfile } from '../../api/UserAPI'; // Asegúrate de implementar estas funciones en tu backend

const genders = ['masculino', 'femenino', 'otro'];

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    gender: '',
    weight: '',
    height: ''
  });

  const navigate = useNavigate();  // Inicializa useNavigate

  useEffect(() => {
    // Obtener el perfil del usuario al cargar la página
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token no encontrado');

        const profileData = await getUserProfile();
        setUserProfile(profileData);
      } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setUserProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token no encontrado');

      await updateUserProfile(userProfile);
      setIsEditing(false);
      console.log('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
    }
  };

  const handleBackToHome = () => {
    navigate('/homepage');  // Navega a la página de inicio
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="p-4 flex justify-between items-center">
        <Avatar alt="User" src={require('../../images/profile_pic.png')} />
        <IconButton
          aria-label="edit"
          onClick={() => setIsEditing((prevState) => !prevState)}
        >
          <EditIcon sx={{ color: 'white', fontSize: 30 }} />
        </IconButton>
      </header>

      <main className="p-4 space-y-6">
        <Card sx={{ backgroundColor: '#333', color: '#fff' }}>
          <CardHeader title="Perfil del Usuario" />
          <CardContent>
            <TextField
              fullWidth
              label="Nombre Completo"
              name="fullName"
              value={userProfile.fullName}
              onChange={handleChange}
              disabled={!isEditing}
              margin="normal"
            />
            <Select
              fullWidth
              name="gender"
              value={userProfile.gender}
              onChange={handleChange}
              disabled={!isEditing}
              displayEmpty
            >
              {genders.map((gender) => (
                <MenuItem key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </MenuItem>
              ))}
            </Select>
            <TextField
              fullWidth
              label="Peso"
              name="weight"
              value={userProfile.weight}
              onChange={handleChange}
              disabled={!isEditing}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Altura"
              name="height"
              value={userProfile.height}
              onChange={handleChange}
              disabled={!isEditing}
              margin="normal"
            />
            {isEditing && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ mt: 2, backgroundColor: '#008000' }}
              >
                Guardar Cambios
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Botón para volver a la página de inicio */}
        <Button
          variant="outlined"
          onClick={handleBackToHome}
          sx={{ mt: 2, color: '#fff', borderColor: '#fff' }}
        >
          Volver a Home
        </Button>
      </main>
    </div>
  );
}
