export interface Clock {
  now(): Date;
}

export class RealClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class MockClock implements Clock {
  private currentTime: number;

  constructor(initialTime: Date | string | number = new Date()) {
    this.currentTime = new Date(initialTime).getTime();
  }

  now(): Date {
    return new Date(this.currentTime);
  }

  advanceMinutes(minutes: number): Date {
    this.currentTime += minutes * 60_000;
    return this.now();
  }

  set(value: Date | string | number): Date {
    this.currentTime = new Date(value).getTime();
    return this.now();
  }
}

export const realClock = new RealClock();

export function minutesBetween(start: string, end: string): number {
  return Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
}
