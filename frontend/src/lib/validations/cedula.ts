export function validateCedula(cedula: string): boolean {
  if (cedula === null || cedula === undefined) {
    throw new Error('Cedula cannot be null');
  }

  if (cedula.length !== 10) return false;
  if (!/^\d+$/.test(cedula)) return false;

  const firstTwoDigits = parseInt(cedula.substring(0, 2), 10);
  const thirdDigit = parseInt(cedula.substring(2, 3), 10);
  const lastDigit = parseInt(cedula.substring(9, 10), 10);

  if (firstTwoDigits < 1 || firstTwoDigits > 24) return false;
  if (thirdDigit > 5) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const coefficient = i % 2 === 0 ? 2 : 1;
    const digit = parseInt(cedula.substring(i, i + 1), 10);
    let multiplication = coefficient * digit;
    
    if (multiplication >= 10) multiplication -= 9;
    sum += multiplication;
  }

  const module = sum % 10;
  const verifierDigit = module === 0 ? 0 : 10 - module;

  return verifierDigit === lastDigit;
}