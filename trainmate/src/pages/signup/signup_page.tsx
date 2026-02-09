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
import { saveUserInfo } from '../../api/UserAPI';
import { Input } from '@mui/material';
import { FIELD_LIMITS } from '../../constants';

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
    const { id, name, value } = e.target;
    const key = name || id;
    let nextValue = value;

    if (key === 'name') nextValue = String(value).slice(0, FIELD_LIMITS.fullName);
    if (key === 'email') nextValue = String(value).slice(0, FIELD_LIMITS.email);
    if (key === 'password') nextValue = String(value).slice(0, FIELD_LIMITS.password);

    setFormData((prevState) => ({
      ...prevState,
      [key]: nextValue,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const formDataWithIntegers = {
      ...formData,
      weight: parseInt(formData.weight, 10),
      height: parseInt(formData.height, 10),
    };

    try {
      await createUserWithEmailAndPassword(auth, formDataWithIntegers.email, formDataWithIntegers.password);
      const data: any = await signInWithEmailAndPassword(auth, formDataWithIntegers.email, formDataWithIntegers.password);
      localStorage.setItem("token", data.user.accessToken);
      await saveUserInfo(formDataWithIntegers)
      navigate('/homepage');
      window.location.reload();
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
        window.location.href = '/profile';
      } else {
        window.location.href = '/homepage';
      }


    } catch (error) {
      console.error('Error en el inicio de sesión con Google:', error);
    }
  };
  return (
    <div className="min-h-screen bg-black from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-black shadow-lg rounded-lg overflow-hidden border border-gray-600">
          <div className="bg-black p-4 flex items-center justify-center">
            <Dumbbell className="h-8 w-8 text-white mr-2" />
            <h1 className="text-2xl font-bold text-white">TrainMate</h1>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-center text-white mb-6">Sign Up</h2>
            <Button variant="outlined" className="w-full mb-4 flex items-center justify-center border-gray-300 text-white hover:bg-gray-100" type="button" onClick={handleGoogleSignIn}>
              <img src={require('../../images/google_logo.png')} alt="Google logo" className="w-5 h-5 mr-2" />
              Sign up with Google
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-500">Or continue with</span>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-2 border border-gray-600 rounded">
                <Input
                  id="name"
                  type="text"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="rounded-md p-2 text-white placeholder-white text-sm"  // Rounded borders, smaller size
                  style={{ borderRadius: '8px', color: 'white' }}  // Optional inline styles
                  placeholder="Full Name"  // White placeholder
                />
              </div>

              {/* Email */}
              <div className="space-y-2 border border-gray-600 rounded">
                <Input
                  id="email"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="rounded-md p-2 text-white placeholder-white text-sm"  // Rounded borders, smaller size
                  style={{ borderRadius: '8px', color: 'white' }}  // Optional inline styles
                  placeholder="you@example.com"  // White placeholder
                />
              </div>

              {/* Password */}
              <div className="space-y-2 border border-gray-600 rounded">
                <Input
                  id="password"
                  type="password"
                  fullWidth
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="rounded-md p-2 text-white placeholder-white text-sm"  // Rounded borders, smaller size
                  style={{ borderRadius: '8px', color: 'white' }}  // Optional inline styles
                  placeholder="Password"  // White placeholder
                />
              </div>

              {/* Sex */}
              <div className="space-y-2 border border-gray-600 rounded">
                <select
                  id="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="rounded-md p-2 text-white bg-black placeholder-white text-sm w-full"
                  style={{ borderRadius: '8px', color: 'white' }}
                >
                  <option value="" disabled>Select Sex</option> {/* Disabled default option */}
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Birthday */}
              <div className="space-y-2 border border-gray-600 rounded">
                <Input
                  id="birthday"
                  type="date"
                  fullWidth
                  required
                  value={formData.birthday}
                  onChange={handleChange}
                  className="rounded-md p-2 text-white placeholder-white text-sm"
                  style={{ borderRadius: '8px', color: 'white' }}
                />
              </div>

              {/* Weight and Height */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 border border-gray-600 rounded">
                  <Input
                    id="weight"
                    type="number"
                    fullWidth
                    required
                    value={formData.weight}
                    onChange={handleChange}
                    className="rounded-md p-2 text-white placeholder-white text-sm"
                    style={{ borderRadius: '8px', color: 'white' }}
                    placeholder="Weight (kg)"
                  />
                </div>
                <div className="space-y-2 border border-gray-600 rounded">
                  <Input
                    id="height"
                    type="number"
                    fullWidth
                    required
                    value={formData.height}
                    onChange={handleChange}
                    className="rounded-md p-2 text-white placeholder-white text-sm"
                    style={{ borderRadius: '8px', color: 'white' }}
                    placeholder="Height (cm)"
                  />
                </div>
              </div>
              {/* Submit Button */}
              <Button fullWidth variant="contained" type="submit">
                Sign Up
              </Button>
            </form>
            <div className="mt-6 border-t pt-4">
              <p className="text-center text-sm text-white">
                Already have an account?{" "}
                <Link to="/login" className="text-white hover:underline">Log In</Link>
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
