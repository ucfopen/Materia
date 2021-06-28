import { useState, useEffect } from 'react'

// Wait for delay then sets value
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Updates the debounce after the user stops typing
    return () => {
      clearTimeout(handler)
    }
  }, [value])

  return debouncedValue
}
