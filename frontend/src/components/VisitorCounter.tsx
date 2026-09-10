import { useEffect, useState } from "react";
import { api } from "../services/api";

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sessionKey = "pf_visit_counted";
    const alreadyVisited = sessionStorage.getItem(sessionKey);

    if (!alreadyVisited) {
      sessionStorage.setItem(sessionKey, "1");
      api
        .post<{ count: number }>("/api/stats/visit")
        .then((data) => setCount(data.count))
        .catch(() => {
          api
            .get<{ count: number }>("/api/stats/visitors")
            .then((data) => setCount(data.count))
            .catch(() => setCount(null));
        });
    } else {
      api
        .get<{ count: number }>("/api/stats/visitors")
        .then((data) => setCount(data.count))
        .catch(() => setCount(null));
    }
  }, []);

  // Pad to 6 digits, e.g. "000042"
  const digits =
    count !== null
      ? String(count).padStart(6, "0").split("")
      : ["-", "-", "-", "-", "-", "-"];

  return (
    <div className="retro-counter" title={`Total archive visitors: ${count ?? "connecting…"}`}>
      <span className="retro-counter__led" aria-hidden="true"></span>
      <span className="retro-counter__label">VISITORS</span>
      <div className="retro-counter__odometer" aria-label={`Visitor count ${count ?? "…"}`}>
        {digits.map((digit, idx) => (
          <span key={idx} className="retro-counter__digit">
            {digit}
          </span>
        ))}
      </div>
    </div>
  );
}
