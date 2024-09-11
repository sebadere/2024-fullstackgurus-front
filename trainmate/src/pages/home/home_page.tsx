import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { grey } from '@mui/material/colors';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Dumbbell, Timer, Bike, Trophy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import Typography from '@mui/material/Typography';
import ScrollArea from '@mui/material/Box';
import { saveWorkout } from '../../api/WorkoutsApi';

const data = [
  { name: 'Week 1', calories: 420 },
  { name: 'Week 2', calories: 250 },
  { name: 'Week 3', calories: 700 },
  { name: 'Week 4', calories: 590 },
];

const exercises = [
  { id: 1, type: 'Running', duration: '30', date: '2024-08-16', calories: 300 },
  { id: 2, type: 'Weightlifting', duration: '45', date: '2024-08-16', calories: 200 },
  { id: 3, type: 'Cycling', duration: '60', date: '2024-08-20', calories: 450 },
  { id: 4, type: 'Swimming', duration: '40', date: '2024-08-23', calories: 350 },
  { id: 5, type: 'Basketball', duration: '60', date: '2024-09-02', calories: 150 },
];

const exerciseTypes = [
  'Running', 'Weightlifting', 'Cycling', 'Swimming', 'Football', 'Basketball', 'Tennis', 'Gymnastics',
];

export default function HomePage() {
  const [timeRange, setTimeRange] = useState('month');
  const [exerciseList, setExerciseList] = useState(exercises);
  const [open, setOpen] = useState(false);

  const [newExercise, setNewExercise] = useState({
    type: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddExercise = async () => {
    if (newExercise.type && newExercise.duration && newExercise.date) {
      const exercise = {
        id: exerciseList.length + 1,
        ...newExercise,
        calories: Math.floor(Math.random() * 300) + 100, // Generating a random calorie value
      };
  
      setExerciseList([...exerciseList, exercise]);
  
      setNewExercise({
        type: '',
        duration: '',
        date: new Date().toISOString().split('T')[0],
      });

      try {
        const token = localStorage.getItem('token');
        if (token) {
          await saveWorkout(token, {
            exercise: newExercise.type,
            duration: parseInt(newExercise.duration, 10),
            date: newExercise.date,
          });
          console.log('Workout saved successfully');
        } else {
          console.error('No token found, unable to save workout');
        }
      } catch (error) {
        console.error('Error saving workout:', error);
      }
  
      handleClose();
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="p-4 flex justify-between items-center">
        <Avatar alt="User" src={require('../../images/profile_pic.png')} />
        <IconButton aria-label="add" onClick={handleClickOpen}>
          <AddCircleOutlineIcon sx={{ color: grey[50], fontSize: 40 }} className="h-24 w-24" />
        </IconButton>
      </header>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Exercise</DialogTitle>
        <DialogContent>
          <Select
            fullWidth
            value={newExercise.type}
            onChange={(e) => setNewExercise({ ...newExercise, type: e.target.value })}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select Exercise Type
            </MenuItem>
            {exerciseTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
          <TextField
            fullWidth
            margin="dense"
            label="Duration"
            value={newExercise.duration}
            onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })}
            placeholder="In minutes"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Date"
            type="date"
            value={newExercise.date}
            onChange={(e) => setNewExercise({ ...newExercise, date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddExercise}>Add Exercise</Button>
        </DialogActions>
      </Dialog>

      <main className="p-4 space-y-6">
        <Card sx={{ backgroundColor: '#333', color: '#fff' }}>
          <CardHeader
            title="Progress"
            action={
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ color: 'white' }}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            }
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#fff" tick={{ dy: 13 }} />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Line type="monotone" dataKey="calories" stroke="#008000" activeDot={{ r: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card sx={{ backgroundColor: '#333', color: '#fff' }}>
          <CardHeader title="Recent Exercises" />
          <CardContent>
            <ScrollArea sx={{ maxHeight: 300, overflow: 'auto' }}>
              {exerciseList.map((exercise) => (
                <div key={exercise.id} className="flex items-center space-x-4 mb-4">
                  <div className="bg-primary rounded-full p-2">
                    {exercise.type === 'Running' && <Timer className="h-6 w-6" />}
                    {exercise.type === 'Weightlifting' && <Dumbbell className="h-6 w-6" />}
                    {exercise.type === 'Cycling' && <Bike className="h-6 w-6" />}
                    {(exercise.type !== 'Running' && exercise.type !== 'Weightlifting' && exercise.type !== 'Cycling') && <Trophy className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <Typography variant="h6">{exercise.type}</Typography>
                    <Typography variant="body2" color="gray">
                      {exercise.duration} min | {exercise.date}
                    </Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="h6">{exercise.calories} kcal</Typography>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}