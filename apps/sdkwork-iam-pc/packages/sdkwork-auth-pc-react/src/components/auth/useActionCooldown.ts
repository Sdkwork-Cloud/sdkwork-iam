import {
  useEffect,
  useState,
} from "react";

export function useSdkworkActionCooldown(durationSeconds = 60) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return undefined;
    }

    const timer = globalThis.setTimeout(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1_000);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [remainingSeconds]);

  return {
    isCoolingDown: remainingSeconds > 0,
    remainingSeconds,
    resetCooldown: () => setRemainingSeconds(0),
    startCooldown: () => setRemainingSeconds(durationSeconds),
  };
}
