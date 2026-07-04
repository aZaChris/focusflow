import { useEffect, useState } from 'react';
import { currentLocalTime, hasDayChanged, todayLocalDate } from '@/features/timeline/time';

const TICK_MS = 30_000;

// research.md §4: a 30s interval clears SC-003's 1-minute accuracy bar with a wide
// margin — simpler than a reanimated-driven continuous clock.
export function useNowMarker(onDayChange?: () => void) {
  const [today, setToday] = useState(todayLocalDate);
  const [nowTime, setNowTime] = useState(currentLocalTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(currentLocalTime());
      const currentDate = todayLocalDate();
      setToday((previous) => {
        if (hasDayChanged(previous, currentDate)) {
          onDayChange?.();
          return currentDate;
        }
        return previous;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { today, nowTime };
}
