/**
 * Get the default user ID from environment variables for testing purposes
 * @returns The default user ID
 * @throws Error if DEFAULT_USER_ID is not configured
 */
export function getDefaultUserId(): string {
  const userId = import.meta.env.DEFAULT_USER_ID;

  if (!userId) {
    throw new Error("DEFAULT_USER_ID is not configured. Please set it in your .env file.");
  }

  return userId;
}
