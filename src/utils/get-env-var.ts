export function getEnvVar(varValue: string | undefined, varName: string): string {
  if (!varValue) { // Changed from varValue === undefined to !varValue
    throw new ReferenceError(`Reference to undefined or empty env var: ${varName}`);
  }
  return varValue;
}