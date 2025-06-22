
import { differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';

export const calculateAge = (dateOfBirth: Date): string => {
  const now = new Date();
  const years = differenceInYears(now, dateOfBirth);
  
  // Calculate remaining months after years
  const afterYears = new Date(dateOfBirth);
  afterYears.setFullYear(afterYears.getFullYear() + years);
  const months = differenceInMonths(now, afterYears);
  
  // Calculate remaining days after years and months
  const afterMonths = new Date(afterYears);
  afterMonths.setMonth(afterMonths.getMonth() + months);
  const days = differenceInDays(now, afterMonths);
  
  const parts = [];
  if (years > 0) parts.push(years === 1 ? "1 year" : `${years} years`);
  if (months > 0) parts.push(months === 1 ? "1 month" : `${months} months`);
  if (days > 0) parts.push(days === 1 ? "1 day" : `${days} days`);
  
  if (parts.length === 0) return "Less than 1 day";
  
  return parts.join(", ");
};

export const calculateAgeInYears = (dateOfBirth: Date): number => {
  return differenceInYears(new Date(), dateOfBirth);
};
