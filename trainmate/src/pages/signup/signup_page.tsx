import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Dumbbell } from "lucide-react";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../FirebaseConfig';  // Import Firebase auth
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';


export default function SignUp() {
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    sex: '',
    birthday: '',
    weight: '',
    height: ''
  });

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('User registered successfully');
    } catch (error: any) {
      console.error('Error signing up:', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
  
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      localStorage.setItem("token", idToken);
      // Verificar si es el primer inicio de sesión
      const isFirstLogin = user.metadata.creationTime === user.metadata.lastSignInTime;
  
      if (isFirstLogin) {
        navigate('/profile');
      } else {
        navigate('/homepage');
      }
  
    } catch (error) {
      console.error('Error en el inicio de sesión con Google:', error);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-black p-4 flex items-center justify-center">
            <Dumbbell className="h-8 w-8 text-white mr-2" />
            <h1 className="text-2xl font-bold text-white">TrainMate</h1>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>
            <Button variant="outlined" className="w-full mb-4 flex items-center justify-center border-gray-300 text-gray-700 hover:bg-gray-100" type="button" onClick={handleGoogleSignIn}>
              <img src={require('../../images/google_logo.png')} alt="Google logo" className="w-5 h-5 mr-2" />
              Sign up with Google
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextField fullWidth id="name" label="Full Name" placeholder="John Doe" required value={formData.name} onChange={handleChange} />
              <TextField fullWidth id="email" label="Email" placeholder="you@example.com" type="email" required value={formData.email} onChange={handleChange} />
              <TextField fullWidth id="password" label="Password" type="password" required value={formData.password} onChange={handleChange} />
              <FormControl fullWidth>
                <InputLabel id="sex-label">Sex</InputLabel>
                <Select labelId="sex-label" id="sex" value={formData.sex} onChange={handleChange}>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth id="birthday" label="Birthday" type="date" InputLabelProps={{ shrink: true }} required value={formData.birthday} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <TextField fullWidth id="weight" label="Weight (kg)" type="number" inputProps={{ min: 40, max: 300, step: 0.5 }} placeholder="70.5" required value={formData.weight} onChange={handleChange} />
                <TextField fullWidth id="height" label="Height (cm)" type="number" inputProps={{ min: 130, max: 250 }} placeholder="175" required value={formData.height} onChange={handleChange} />
              </div>
              <Button fullWidth variant="contained" type="submit">
                Sign Up
              </Button>
            </form>
            <div className="mt-6 border-t pt-4">
              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">Log In</Link>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-white text-sm">
          <p>© 2024 TrainMate. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}