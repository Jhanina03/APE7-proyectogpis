export function isValidEcuadorianId(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provinceCode = parseInt(cedula.substring(0, 2), 10);
  const thirdDigit = parseInt(cedula[2], 10);

  if (provinceCode < 1 || (provinceCode > 24 && provinceCode !== 30)) return false;
  if (thirdDigit >= 6) return false;

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digits = cedula.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let value = digits[i] * coefficients[i];
    if (value >= 10) value -= 9;
    sum += value;
  }

  const verifier = (10 - (sum % 10)) % 10;
  return verifier === digits[9];
}
