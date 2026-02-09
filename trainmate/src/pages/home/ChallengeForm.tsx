import React, { useState } from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button } from '@mui/material';
import { grey } from '@mui/material/colors';
import { saveGoal } from '../../api/GoalsApi';
import dayjs from 'dayjs';
import TopMiddleAlert from '../../personalizedComponents/TopMiddleAlert';
import { FIELD_LIMITS } from '../../constants';

interface ChallengeFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSave?: (formData: { startDate: string; endDate: string; title: string; description: string }) => void; // Optional callback after saving
}

const ChallengeForm: React.FC<ChallengeFormProps> = ({ isOpen, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    title: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alertSaveGoalErrorOpen, setAlertSaveGoalErrorOpen] = useState(false);
  const [alertSaveGoalErrorMessage, setAlertSaveGoalErrorMessage] = useState('');

  // Handler for TextField changes
  const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'title') {
      setFormData({ ...formData, [name]: value.slice(0, FIELD_LIMITS.goalTitle) });
      return;
    }
    if (name === 'description') {
      setFormData({ ...formData, [name]: value.slice(0, FIELD_LIMITS.goalDescription) });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    const title = formData.title.trim();
    const description = formData.description.trim();

    if (!title || !description || !formData.startDate || !formData.endDate) {
      setAlertSaveGoalErrorMessage('Please complete all fields.');
      setAlertSaveGoalErrorOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const formattedData = {
        ...formData,
        title,
        description,
        startDate: dayjs(formData.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(formData.endDate).format('YYYY-MM-DD'),
      };
      const savedGoal = await saveGoal(formattedData);
      if (onSave) onSave(savedGoal); // Call onSave callback if provided
      onCancel(); // Close the form
      setFormData({ startDate: '', endDate: '', title: '', description: '' }); // Clear form data
    } catch (error) {
      console.error('Error saving goal:', error);
      setAlertSaveGoalErrorMessage('Failed to save goal. ' + error);
      setAlertSaveGoalErrorOpen(true); // Open the alert
    } finally {
      setIsLoading(false);
    }
  };
  


  return (
      <>
        <Dialog open={isOpen} onClose={onCancel} PaperProps={{
          sx: {
            backgroundColor: grey[800],
            color: '#fff',
            padding: 2,
            maxWidth: '600px',
            minWidth: '300px',
          },
        }}>
          <DialogTitle sx={{ color: '#fff', textAlign: 'center', fontSize: '2rem' }}>Add New Goal</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Title"
              name="title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={handleTextFieldChange}
              required
              InputLabelProps={{ style: { color: '#fff' } }}
              InputProps={{ style: { color: '#fff', backgroundColor: grey[800] } }}
              helperText={`${formData.title.length}/${FIELD_LIMITS.goalTitle}`}
              sx={{ mb: 3 }}
            />
            <TextField
              label="Description"
              name="description"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleTextFieldChange}
              required
              InputLabelProps={{ style: { color: '#fff' } }}
              InputProps={{ style: { color: '#fff', backgroundColor: grey[800] } }}
              helperText={`${formData.description.length}/${FIELD_LIMITS.goalDescription}`}
              sx={{ mb: 3 }}
            />
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              fullWidth
              variant="outlined"
              value={formData.startDate}
              onChange={handleTextFieldChange}
              required
              InputLabelProps={{ shrink: true, style: { color: '#fff' } }}
              InputProps={{ style: { color: '#fff', backgroundColor: grey[800] } }}
              sx={{ mb: 3 }}
            />
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              fullWidth
              variant="outlined"
              value={formData.endDate}
              onChange={handleTextFieldChange}
              required
              InputLabelProps={{ shrink: true, style: { color: '#fff' } }}
              InputProps={{ style: { color: '#fff', backgroundColor: grey[800] } }}
              sx={{ mb: 3 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onCancel} sx={{ color: '#fff' }}>Close</Button>
            <Button onClick={handleSave} sx={{ color: '#fff' }} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Goal'}
            </Button>
          </DialogActions>
        </Dialog>
    
        {/* Error Alert */}
        <TopMiddleAlert
          alertText={alertSaveGoalErrorMessage}
          open={alertSaveGoalErrorOpen}
          onClose={() => setAlertSaveGoalErrorOpen(false)}
          severity='error'
        />
      </>
    
  );
};

export default ChallengeForm;
