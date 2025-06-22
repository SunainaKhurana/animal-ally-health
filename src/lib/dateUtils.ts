
import { differenceInYears, differenceInMonths } from 'date-fns';

export const calculateAge = (dateOfBirth: Date): string => {
  const now = new Date();
  const years = differenceInYears(now, dateOfBirth);
  
  if (years >= 1) {
    return years === 1 ? "1 year" : `${years} years`;
  }
  
  const months = differenceInMonths(now, dateOfBirth);
  if (months >= 1) {
    return months === 1 ? "1 month" : `${months} months`;
  }
  
  return "Less than 1 month";
};

export const calculateAgeInYears = (dateOfBirth: Date): number => {
  return differenceInYears(new Date(), dateOfBirth);
};
