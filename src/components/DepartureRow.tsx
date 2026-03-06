import type { Departure } from '../types';
import { getCountdown, getAbsoluteTime, getDelayMinutes } from '../services/sl-departures';

const MODE_LABELS: Record<string, string> = {
  METRO: 'T',
  BUS: 'B',
  TRAIN: 'J',
  TRAM: 'S',
};

interface DepartureRowProps {
  departure: Departure;
  tick: number;
}

export function DepartureRow({ departure, tick: _tick }: DepartureRowProps) {
  const countdown = getCountdown(departure);
  const absoluteTime = getAbsoluteTime(departure);
  const delayMinutes = getDelayMinutes(departure);
  const isCancelled = departure.state === 'CANCELLED';
  const mode = departure.line.transport_mode;
  const modeLabel = MODE_LABELS[mode] ?? '?';

  // Hide past departures (countdown "Now" means <= 0 min) unless ATSTOP
  if (countdown === 'Now' && departure.state !== 'ATSTOP') {
    return null;
  }

  // Compute scheduled time for delay display
  const scheduledTime = (() => {
    const scheduled = departure.scheduled;
    const timePart = scheduled.split('T')[1];
    const [hh, mm] = timePart.split(':');
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
  })();

  return (
    <div className={`departure-row${isCancelled ? ' cancelled' : ''}`}>
      <span className={`mode-badge mode-${mode.toLowerCase()}`}>{modeLabel}</span>
      <span className="line-designation">{departure.line.designation}</span>
      <span className="departure-destination">
        {isCancelled ? <s>{departure.destination}</s> : departure.destination}
      </span>
      <span className="departure-time">
        {isCancelled ? (
          <span className="cancelled-label">Cancelled</span>
        ) : (
          <>
            <span className="countdown">{countdown}</span>
            {delayMinutes > 0 ? (
              <>
                <s className="scheduled-time">{scheduledTime}</s>
                <span className="delay-indicator">+{delayMinutes} min</span>
              </>
            ) : (
              <span className="absolute-time">{absoluteTime}</span>
            )}
          </>
        )}
      </span>
    </div>
  );
}
