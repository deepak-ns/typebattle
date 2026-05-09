import { useState, useEffect, useRef, useCallback } from "react";

export function useTypingEngine(passage, onProgress) {
  const [typed, setTyped] = useState(""); // Everything the user has typed
  const [errors, setErrors] = useState(new Set()); // Indices of wrong characters
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const startTimeRef = useRef(null);
  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);

  // Reset when passage changes (rematch)
  useEffect(() => {
    setTyped("");
    setErrors(new Set());
    setStarted(false);
    setFinished(false);
    setWpm(0);
    setAccuracy(100);
    startTimeRef.current = null;
    totalKeystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
  }, [passage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (finished || !passage) return;

      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Shift" || e.key === "CapsLock" || e.key === "Tab") return;

      if (!started) {
        setStarted(true);
        startTimeRef.current = Date.now();
      }

      if (e.key === "Backspace") {
        setTyped((prev) => {
          const next = prev.slice(0, -1);
          return next;
        });
        setErrors((prev) => {
          const next = new Set(prev);
          next.delete(typed.length - 1);
          return next;
        });
        return;
      }

      if (e.key.length !== 1) return; // Ignore arrows, F-keys, etc.

      const currentIndex = typed.length;
      const expected = passage[currentIndex];
      const isCorrect = e.key === expected;

      totalKeystrokesRef.current += 1;
      if (isCorrect) correctKeystrokesRef.current += 1;

      const newTyped = typed + e.key;
      setTyped(newTyped);

      if (!isCorrect) {
        setErrors((prev) => new Set([...prev, currentIndex]));
      }

      // Recalculate live WPM
      // Recalculate live WPM — only correct characters count
      const elapsed = (Date.now() - startTimeRef.current) / 60000;
      const liveWpm =
        elapsed > 0
          ? Math.round(correctKeystrokesRef.current / 5 / elapsed)
          : 0;
      const liveAccuracy =
        totalKeystrokesRef.current > 0
          ? Math.round(
              (correctKeystrokesRef.current / totalKeystrokesRef.current) * 100,
            )
          : 100;

      setWpm(liveWpm);
      setAccuracy(liveAccuracy);

      // Send progress to server
      if (onProgress) {
        onProgress({
          typedLength: newTyped.length,
          correctChars: correctKeystrokesRef.current,
          totalChars: totalKeystrokesRef.current,
        });
      }

      // Check completion
      if (newTyped.length >= passage.length) {
        setFinished(true);
      }
    },
    [typed, passage, started, finished, onProgress],
  );

  // Render the passage as an array of character objects with state
  const chars = passage
    ? passage.split("").map((char, i) => ({
        char,
        state:
          i < typed.length ? (errors.has(i) ? "wrong" : "correct") : "pending",
        isCursor: i === typed.length,
      }))
    : [];

  return {
    typed,
    chars,
    wpm,
    accuracy,
    started,
    finished,
    handleKeyDown,
  };
}
