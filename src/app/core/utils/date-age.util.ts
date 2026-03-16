export function calculateAgeFromBirthDate(birthDate: string): number {
  const birthDateObject = new Date(`${birthDate}T00:00:00`);
  const currentDate = new Date();

  let age = currentDate.getFullYear() - birthDateObject.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDateObject.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDateObject.getDate())) {
    age -= 1;
  }

  return age;
}
