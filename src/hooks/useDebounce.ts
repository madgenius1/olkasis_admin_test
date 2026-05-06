"use client";

import { useState, useEffect } from "react";

/**
 * Debounce a value — useful for search inputs and API-triggering fields.
 * @param value   The raw value to debounce
 * @param delay   Delay in milliseconds (default: 300)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}