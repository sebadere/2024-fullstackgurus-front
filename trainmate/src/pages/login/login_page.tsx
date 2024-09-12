import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import FormLabel from '@mui/material/FormLabel';
import { Dumbbell } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../FirebaseConfig';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { sendResetPasswordEmail } from '../../utils/AuthUtils';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("token", data.user.accessToken);
      navigate('/homepage');
      window.location.reload();
    } catch (error: any) {
      console.error('Error logging in:', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      localStorage.setItem("token", idToken);

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

  const handleForgotPasswordClick = () => {
    setIsModalOpen(true);
  };

  const handleSendResetPassword = () => {
    if (forgotEmail) {
      sendResetPasswordEmail(forgotEmail)
        .then(() => {
          console.log(`Password reset email sent to ${forgotEmail}`);
          setIsModalOpen(false);
        })
        .catch((error) => {
          console.error('Error sending password reset email:', error);
        });
    } else {
      console.error('Please enter an email address.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
            <h2 className="text-2xl font-semibold text-center mb-6">Log In</h2>
            <Button
              variant="outlined"
              className="w-full mb-4 flex items-center justify-center"
              type="button"
              onClick={handleGoogleSignIn}
            >
              <img src={require('../../images/google_logo.png')} alt="Google logo" className="w-5 h-5 mr-2" />
              Log In with Google
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
              <div className="space-y-2">
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input id="email" type="email" fullWidth required value={email} onChange={handleEmailChange} />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="password">Password</FormLabel>
                <Input id="password" type="password" fullWidth required value={password} onChange={handlePasswordChange} />
              </div>
              <Button className="w-full" variant="contained" color="primary" type="submit">
                Log In
              </Button>
            </form>
            <div className="mt-4 text-center">
              <a href="#" className="text-sm text-primary hover:underline" onClick={handleForgotPasswordClick}>
                Forgot password?
              </a>
            </div>
            <div className="mt-6 border-t pt-4">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-white text-sm">
          <p>© 2024 TrainMate. All rights reserved.</p>
        </div>
      </div>

      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter your email address to receive a password reset link.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSendResetPassword} color="primary">
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}