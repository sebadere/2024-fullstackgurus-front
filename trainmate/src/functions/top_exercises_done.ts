interface Workout {
    id: number | string;
    duration: number;
    date: string;
    total_calories: number;
    coach?: string;
    training: Training;
}

interface Training {
    calories_per_hour_mean: number;
    exercises: Exercise[];
    name: string;
    owner: string;
}

interface Exercise {
    id: string;
    calories_per_hour: number;
    category_id: string;
    name: string;
    owner: string;
    public: boolean;
    training_muscle: string;
}

interface CategoryWithExercises {
    id: string;
    icon: string;
    name: string;
    owner: string;
    isCustom: boolean;
    exercises: Exercise[];
}

export const top_exercises_done = (workouts: Workout[], categories_with_exercises: CategoryWithExercises[]) => {
    const exerciseCount: { [exerciseId: string]: number } = {};
    const categoryCount: { [categoryId: string]: number } = {};
    const categoryWithExercisesCount: { [categoryId: string]: { [exerciseId: string]: number } } = {};

    // Recorrer todos los workouts
    workouts.forEach(workout => {
        workout.training.exercises.forEach(exercise => {
            // Contar la aparición de cada ejercicio
            if (!exerciseCount[exercise.id]) {
                exerciseCount[exercise.id] = 0;
            }
            exerciseCount[exercise.id] += 1;

            // Contar la aparición de ejercicios por categoría
            if (!categoryCount[exercise.category_id]) {
                categoryCount[exercise.category_id] = 0;
            }
            categoryCount[exercise.category_id] += 1;

            // Contar la aparición de ejercicios dentro de cada categoría
            if (!categoryWithExercisesCount[exercise.category_id]) {
                categoryWithExercisesCount[exercise.category_id] = {};
            }
            if (!categoryWithExercisesCount[exercise.category_id][exercise.id]) {
                categoryWithExercisesCount[exercise.category_id][exercise.id] = 0;
            }
            categoryWithExercisesCount[exercise.category_id][exercise.id] += 1;
        });
    });

    // Crear una lista de ejercicios más realizados
    const exerciseList = Object.entries(exerciseCount).map(([exerciseId, count]) => {
        // Buscar el ejercicio en las categorías
        const exercise = categories_with_exercises
            .flatMap(category => category.exercises)
            .find(ex => ex.id === exerciseId);
        
        return {
            exerciseId,
            name: exercise?.name || "Unknown",
            count
        };
    });

    // Crear una lista de categorías con la suma de ejercicios
    const categoryList = Object.entries(categoryCount).map(([categoryId, count]) => {
        const category = categories_with_exercises.find(cat => cat.id === categoryId);
        return {
            categoryId,
            categoryName: category?.name || "Unknown",
            count
        };
    });

    // Crear una lista de categorías con ejercicios y conteo
    const categoryWithExercisesList = Object.entries(categoryWithExercisesCount).map(([categoryId, exercises]) => {
        const category = categories_with_exercises.find(cat => cat.id === categoryId);
        const exercisesList = Object.entries(exercises).map(([exerciseId, count]) => {
            const exercise = categories_with_exercises
                .flatMap(category => category.exercises)
                .find(ex => ex.id === exerciseId);

            return {
                exerciseId,
                name: exercise?.name || "Unknown",
                count
            };
        });

        return {
            categoryId,
            categoryName: category?.name || "Unknown",
            totalCount: categoryCount[categoryId],
            exercises: exercisesList // Lista de ejercicios con sus respectivos conteos
        };
    });

    // Ordenar las listas de mayor a menor según la cantidad
    exerciseList.sort((a, b) => b.count - a.count);
    categoryList.sort((a, b) => b.count - a.count);
    categoryWithExercisesList.sort((a, b) => b.totalCount - a.totalCount);

    return {topCategoriesWithExercises: categoryWithExercisesList};
};