const LETTERS_AND_SPACES = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g;
const LETTERS_AND_SPACES_VALUE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

export function onlyLettersAndSpaces(value: string): string {
  return value.replace(LETTERS_AND_SPACES, '');
}

export function isLettersAndSpaces(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return LETTERS_AND_SPACES_VALUE.test(trimmed);
}
