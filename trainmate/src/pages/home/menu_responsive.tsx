import React, { useState } from 'react';
import { IconButton, Drawer, Box, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { grey } from '@mui/material/colors';
import CalendarModal from '../calendar/CalendarPage';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate } from 'react-router-dom';
import GoalsModal from '../goals/Goals';
import ChallengeForm from './ChallengeForm';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';

interface ResponsiveMenuProps {
  handleFilterOpen: () => void;
  handleClickOpen: () => void;
}

const ResponsiveMenu: React.FC<ResponsiveMenuProps> = ({ handleFilterOpen, handleClickOpen }) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [goalsDrawerOpen, setGoalsDrawerOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleDrawerOpen = (): void => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = (): void => {
    setDrawerOpen(false);
  };

  const showDrawer = () => {
    setOpen(true);
  };

  const showGoalsDrawer = () => {
    setGoalsDrawerOpen(true)
  }

  const onCloseGoalsDrawer = () => {
    setGoalsDrawerOpen(false)
  }

  const onClose = () => {
    setOpen(false);
  };

  const handlePhysicalProgressOpen = () => {
    navigate('/physicalprogress');
  }

  const handleOutdoorOpen = () => {
    navigate('/outdoor');
  }

  const openForm = () => {
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  return (
    <>
      {/* Hamburger icon for small screens */}
      {!goalsDrawerOpen && (
        <IconButton
          aria-label="menu"
          onClick={handleDrawerOpen}
          sx={{
            display: { xs: 'block', sm: 'none' },
            position: 'fixed',
            top: 10,
            right: 10,
            zIndex: 9999,
          }}
        >
          <MenuIcon sx={{ color: grey[50], fontSize: 40 }} />
        </IconButton>
      )}

      {/* Small screen drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        <Box
          sx={{ width: 250, backgroundColor: grey[800], height: '100%', color: '#fff' }}
          role="presentation"
          onClick={handleDrawerClose}
          onKeyDown={handleDrawerClose}
        >
          <List sx={{ mt: 5 }}>
            <ListItem onClick={handlePhysicalProgressOpen}>
              <TrendingUpIcon sx={{ color: grey[50], fontSize: 40 }} />
              <ListItemText primary="Physical Progress" sx={{ marginLeft: 2 }} />
            </ListItem>
            <ListItem onClick={handleFilterOpen}>
              <FilterAltIcon sx={{ color: grey[50], fontSize: 40 }} />
              <ListItemText primary="Filter By" sx={{ marginLeft: 2 }} />
            </ListItem>
            <ListItem onClick={handleClickOpen}>
              <AddCircleOutlineIcon sx={{ color: grey[50], fontSize: 40 }} />
              <ListItemText primary="Add New" sx={{ marginLeft: 2 }} />
            </ListItem>
            <ListItem onClick={showGoalsDrawer}>
              <OutlinedFlagIcon sx={{ color: grey[50], fontSize: 40 }} />
              <ListItemText primary="Goals" sx={{ marginLeft: 2 }} />
            </ListItem>
            <ListItem onClick={showDrawer}>
              <CalendarMonthIcon sx={{ color: grey[50], fontSize: 40 }} />
              <ListItemText primary="See Agenda" sx={{ marginLeft: 2 }} />
            </ListItem>
            <ListItem onClick={handleOutdoorOpen}>
              <DirectionsRunIcon sx={{ color: grey[50], fontSize: 40 }} />
              <ListItemText primary="Outdoor" sx={{ marginLeft: 2 }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Normal buttons for large screens */}
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
        <IconButton aria-label="filter" onClick={handlePhysicalProgressOpen}>
          <TrendingUpIcon sx={{ color: grey[50], fontSize: 40 }} />
          <p className='p-3 text-white'>Physical Progress</p>
        </IconButton>
        <IconButton aria-label="filter" onClick={handleFilterOpen}>
          <FilterAltIcon sx={{ color: grey[50], fontSize: 40 }} />
          <p className='p-3 text-white'>Filter By</p>
        </IconButton>
        <IconButton aria-label="add" onClick={handleClickOpen}>
          <AddCircleOutlineIcon sx={{ color: grey[50], fontSize: 40 }} />
          <p className='p-3 text-white'>Add New</p>
        </IconButton>
        <IconButton onClick={showGoalsDrawer}>
          <OutlinedFlagIcon sx={{ color: grey[50], fontSize: 40 }} />
          <p className='p-3 text-white'>Goals</p>
        </IconButton>
        <IconButton aria-label="calendar" onClick={showDrawer}>
          <CalendarMonthIcon sx={{ color: grey[50], fontSize: 40 }} />
          <p className='p-3 text-white'>See Agenda</p>
        </IconButton>
        <IconButton aria-label="outdoor" onClick={handleOutdoorOpen}>
          <DirectionsRunIcon sx={{ color: grey[50], fontSize: 40 }} />
          <p className='p-3 text-white'>Outdoor</p>
        </IconButton>
      </Box>

      <CalendarModal showDrawer={showDrawer} onClose={onClose} open={open} />
      <GoalsModal showDrawer={showGoalsDrawer} onClose={onCloseGoalsDrawer} open={goalsDrawerOpen} openForm={openForm} />
      <ChallengeForm
        isOpen={showForm}
        onSave={() => { }} // Define saveChallenge if needed
        onCancel={closeForm} // Closes form and optionally reopens ChallengeModal
      />
    </>
  );
};

export default ResponsiveMenu;
