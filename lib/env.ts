export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function databaseNotConfiguredResponse() {
  return {
    error: "Database is not configured.",
    message:
      "Set DATABASE_URL in your local environment before using this endpoint.",
  };
}
