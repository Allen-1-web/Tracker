import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import {
  foodDatabase,
  mealEntriesSeed,
  nutritionGoalsDefault,
} from './mock'

const NutritionCtx = createContext(null)

export function NutritionProvider({ children }) {
  const [entries, setEntries] = useState(() => mealEntriesSeed.map((e) => ({ ...e })))
  const [goals, setGoals] = useState(() => ({ ...nutritionGoalsDefault }))

  const addMealEntry = useCallback((partial) => {
    const food = foodDatabase.find((f) => f.id === partial.foodId)
    if (!food) return
    const amountG = partial.amount
    const k = amountG / 100
    const id = `me-${Date.now()}`
    setEntries((prev) => [
      ...prev,
      {
        id,
        foodId: food.id,
        date: partial.date,
        mealType: partial.mealType,
        amount: amountG,
        calories: Math.round(food.calories * k),
        protein: Math.round(food.protein * k * 10) / 10,
        fat: Math.round(food.fat * k * 10) / 10,
        carbs: Math.round(food.carbs * k * 10) / 10,
      },
    ])
  }, [])

  const deleteMealEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateNutritionGoals = useCallback((updates) => {
    setGoals((prev) => ({ ...prev, ...updates }))
  }, [])

  const value = useMemo(
    () => ({
      foodDatabase,
      entries,
      goals,
      addMealEntry,
      deleteMealEntry,
      updateNutritionGoals,
    }),
    [entries, goals, addMealEntry, deleteMealEntry, updateNutritionGoals]
  )

  return <NutritionCtx.Provider value={value}>{children}</NutritionCtx.Provider>
}

export function useNutrition() {
  const v = useContext(NutritionCtx)
  if (!v) throw new Error('useNutrition must be used inside NutritionProvider')
  return v
}
