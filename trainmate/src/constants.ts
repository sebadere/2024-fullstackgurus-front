export const BASE_URL = 'https://two024-fullstackgurus-back-1.onrender.com';
// export const BASE_URL = 'http://127.0.0.1:5000';
export const EXTERNAL_URL = 'https://two024-duplagalactica-li8t.onrender.com';

// UI-level validation limits to prevent excessive payload sizes from form inputs.
export const FIELD_LIMITS = {
  email: 254,
  password: 128,
  fullName: 60,
  categoryName: 40,
  exerciseName: 60,
  trainingName: 60,
  goalTitle: 80,
  goalDescription: 500,
  outdoorNotes: 500,
} as const;
