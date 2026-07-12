import { z } from 'zod'

export const workoutFormSchema = z.object({
  exercise_id: z.coerce.number().refine(val => val > 0, 'Debe seleccionar un ejercicio'),
  weight: z.string().transform((val) => {
    if (val === '' || val === '0') return undefined
    const num = parseFloat(val)
    return isNaN(num) ? undefined : num
  }).refine((val) => val === undefined || (val > 0 && val <= 1000), ' ').optional(),
  reps: z.coerce.number().int().refine(val => val === 0 || (val > 0 && val <= 100), ' ').optional(),
  set: z.coerce.number().int().min(1, ' '),
  seconds: z.coerce.number().min(0).max(28800).optional(),
  restSeconds: z.coerce.number().min(0).max(3600).optional(),
  observations: z.string().default('')
})

export type WorkoutFormData = z.infer<typeof workoutFormSchema>
