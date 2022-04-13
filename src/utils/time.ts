export const epoch = () => Math.floor(Date.now() / 1000);

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

type Unit = 'd' | 'h' | 'm' | 's';

type SecondsInput = `${number}${Unit}`;

const SECONDS_REGEX = /^(\d+)([smhd])$/;

export const seconds = (input: SecondsInput) => {
  const match = SECONDS_REGEX.exec(input);

  if (!match) {
    throw new Error(`invalid time period format "${input}"`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * MINUTE;
    case 'h':
      return value * HOUR;
    default:
      return value * DAY;
  }
};
