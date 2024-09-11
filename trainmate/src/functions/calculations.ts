interface WorkoutData {
    date: string;
    calories: number;
}
  
export const calculate_calories_per_day = (calories_and_dates: WorkoutData[]) => {
const calories_per_day: { [date: string]: number } = {};

calories_and_dates.forEach((workout) => {
    const { date, calories } = workout;

    if (calories_per_day[date]) {
    calories_per_day[date] += calories;
    } else {
    calories_per_day[date] = calories;
    }
});

return calories_per_day;
};