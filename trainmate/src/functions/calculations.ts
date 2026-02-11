interface Workout {
    id: number | string;
    duration: number;
    date: string;
    total_calories: number;
    coach?: string;
    training_id?: string;
  }
  
const normalizeDate = (dateStr: string): string => {
    // Extract YYYY-MM-DD directly from the string to avoid timezone shifts
    const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    // Fallback for non-ISO formats: use local date components
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const calculate_calories_and_duration_per_day = (workouts: Workout[]) => {
    const calories_and_duration_per_day: { [date: string]: [number, number] } = {};

    workouts.forEach((workout) => {
        const { total_calories, duration } = workout;
        const date = normalizeDate(workout.date);

        if (calories_and_duration_per_day[date]) {
            calories_and_duration_per_day[date][0] += total_calories;
            calories_and_duration_per_day[date][1] += duration;
        } else {
            calories_and_duration_per_day[date] = [total_calories, duration];
        }
    });

    return calories_and_duration_per_day;
};