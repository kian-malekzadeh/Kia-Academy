/** True when the process is running as a production deployment. */
export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}
