const categoryPrompts = {
  'full-body': 'full body workout at home',
  'cardio-hiit': 'high intensity interval training at home',
  'stretching': 'stretching and flexibility yoga session',
}

const fitnessTail =
  'fitness photography, athletic person exercising, bright modern home interior, natural daylight, energetic, high detail, clean minimal background'

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getWorkoutCoverUrl(workout, categories) {
  const catId = categories?.find((cat) =>
    cat.workouts.some((w) => w.id === workout.id)
  )?.id

  const base = categoryPrompts[catId] || 'home workout'
  const prompt = `${base}, ${fitnessTail}`
  const seed = hashString(workout.id)

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true&seed=${seed}`
}

export function getExerciseImageUrl(exerciseId, exerciseName) {
  const prompt = `person doing ${exerciseName} exercise, fitness form demonstration, fitness photography, athletic person, bright modern home interior, natural daylight, high detail, clean minimal background`
  const seed = hashString(exerciseId) + 10000
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=720&height=720&nologo=true&seed=${seed}`
}
