import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { SelectChangeEvent } from '@mui/material/Select';
import { Card, CardContent, CardHeader, IconButton } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../api/UserAPI';
import { grey } from '@mui/material/colors';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    full_name: '', 
    gender: '',
    weight: '',
    height: '',
    email: '',
    birthday: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token no encontrado');
        
        const profileData = await getUserProfile();

        const formattedData = {
          full_name: profileData.fullName,
          gender: profileData.gender,
          weight: profileData.weight,
          height: profileData.height,
          email: profileData.email,
          birthday: profileData.birthday,
        };
        console.log('formattedData:', formattedData);
        setUserProfile(formattedData);
      } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
      }
    };
  
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    const parsedValue = (name === 'weight' || name === 'height') ? parseInt(value) : value;
  
    setUserProfile((prevProfile) => ({
      ...prevProfile,
      [name]: parsedValue,
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
    navigate('/homepage');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="p-4 flex justify-between items-center">
        <Avatar alt="User" src={require('../../images/profile_pic_2.jpg')} />
        <IconButton
          aria-label="edit"
          onClick={() => setIsEditing((prevState) => !prevState)}
        >
          <EditIcon sx={{ color: 'white', fontSize: 30 }} />
        </IconButton>
      </header>

      <main className="p-4 space-y-6">
        <Card sx={{ backgroundColor: grey[100], color: '#fff' }}>
          <CardHeader title="User Profile" sx={{color: 'black'}}/>
          <CardContent>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TextField
              label="Email"
              value={userProfile.email}
              disabled
            />
            <TextField
              fullWidth
              label="Full Name"
              name="full_name"
              value={userProfile.full_name}
              onChange={handleChange}
              disabled={!isEditing}
              margin="normal"
              slotProps={{
                input: {
                  sx: {
                    color: 'black',
                  },
                },
                inputLabel: {
                sx: {
                    color: 'black',
                    },
                }
              }}
              // sx = {{
              //       '&.Mui-disabled': {
              //   backgroundColor: 'white',
              // },
              // }}
            />
            {/* <Select
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
            </Select> */}
            <TextField
              label="Birthday"
              value={userProfile.birthday}
              disabled
            />
            <TextField
              fullWidth
              label="Weight"
              name="weight"
              value={userProfile.weight}
              onChange={handleChange}
              disabled={!isEditing}
              margin="normal"
              slotProps={{
                input: {
                  sx: {
                    color: 'black',
                  },
                },
                inputLabel: {
                sx: {
                    color: 'black',
                    },
                }
              }}
            />
            <TextField
              fullWidth
              label="Height"
              name="height"
              value={userProfile.height}
              onChange={handleChange}
              disabled={!isEditing}
              margin="normal"
              slotProps={{
                input: {
                  sx: {
                    color: 'black',
                  },
                },
                inputLabel: {
                sx: {
                    color: 'black',
                    },
                }
              }}
            />
            {isEditing && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ mt: 2, backgroundColor: '#008000' }}
              >
                Save changes
              </Button>
            )}
          </form>
          </CardContent>
        </Card>

        <Button
          variant="outlined"
          onClick={handleBackToHome}
          sx={{ mt: 2, color: '#fff', borderColor: '#fff' }}
        >
          Back to Home
        </Button>
      </main>
    </div>
  );
}
