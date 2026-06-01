import { FullConfig } from "@playwright/test";

/**
 * Global E2E Test Setup
 *
 * Runs before all tests. Use for:
 * - Global test configuration
 * - Environment validation
 * - Test data seeding
 * - Browser context defaults
 */
async function globalSetup(config: FullConfig) {
  console.log("Starting E2E test suite...");
  console.log(`Base URL: ${config.projects?.[0]?.use?.baseURL || "http://localhost:3000"}`);

  // Validate environment
  if (!process.env.BASE_URL && !config.projects?.[0]?.use?.baseURL) {
    console.warn("BASE_URL not set, using default: http://localhost:3000");
  }

  // Additional setup can go here
  // - Seed test database
  // - Clear test storage
  // - Configure test utilities
}

export default globalSetup;
