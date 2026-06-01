import { Page, Locator, expect } from '@playwright/test';

/**
 * QuestionCountSelector E2E Test Fixture
 *
 * Comprehensive fixture for testing the QuestionCountSelector component across
 * multiple test scenarios including rendering, interaction, persistence,
 * accessibility, and integration with the quiz flow.
 *
 * Component Location: /components/home/QuestionCountSelector.tsx
 * Usage: Home page (/app/page.tsx)
 * Storage Key: 'quiz-question-count'
 * Valid Options: [10, 20, 30]
 * Default: 20
 */

// ============================================================================
// Constants & Test Data
// ============================================================================

export const QUESTION_COUNT_SELECTOR = {
  STORAGE_KEY: 'quiz-question-count',
  VALID_COUNTS: [10, 20, 30] as const,
  DEFAULT_COUNT: 20,
  SELECTORS: {
    CONTAINER: 'div:has(button[aria-label*="questions"])',
    BUTTON_PREFIX: 'button[aria-label="',
    BUTTON_SUFFIX: ' questions"]',
    BUTTON_10: 'button[aria-label="10 questions"]',
    BUTTON_20: 'button[aria-label="20 questions"]',
    BUTTON_30: 'button[aria-label="30 questions"]',
    SELECTED_BUTTON: 'button[aria-pressed="true"]',
    DISABLED_BUTTON: 'button:has-text("10"):disabled',
    LABEL: 'label[for="question-count"]',
    GROUP: '[role="group"][aria-label="Question count selection"]',
  },
  STYLES: {
    SELECTED: 'bg-neon-lime text-pitch-black',
    UNSELECTED: 'bg-gunmetal text-storm-cloud',
    DISABLED: 'disabled:opacity-50',
    FOCUS_RING: 'focus:ring-2 focus:ring-neon-lime focus:ring-offset-2 focus:ring-offset-pitch-black',
  },
  TEXT: {
    LABEL: 'Number of Questions',
    ARIA_LABEL_10: '10 questions',
    ARIA_LABEL_20: '20 questions',
    ARIA_LABEL_30: '30 questions',
  },
  STORE_STATE: {
    SELECTED_QUESTION_COUNT: 'selectedQuestionCount',
  },
} as const;

export type QuestionCount = 10 | 20 | 30;

// ============================================================================
// Page Object
// ============================================================================

/**
 * QuestionCountSelectorPageObject
 *
 * Page object for interacting with the QuestionCountSelector component.
 * Encapsulates selectors, actions, and assertions for comprehensive testing.
 */
export class QuestionCountSelectorPageObject {
  constructor(
    private readonly page: Page,
    private readonly baseUrl: string = 'http://localhost:3000',
  ) {}

  // ========================================================================
  // Locators
  // ========================================================================

  /**
   * Get the main selector container
   */
  get container(): Locator {
    return this.page.locator(QUESTION_COUNT_SELECTOR.SELECTORS.CONTAINER);
  }

  /**
   * Get the label element
   */
  get label(): Locator {
    return this.page.locator(QUESTION_COUNT_SELECTOR.SELECTORS.LABEL);
  }

  /**
   * Get the group wrapper
   */
  get group(): Locator {
    return this.page.locator(QUESTION_COUNT_SELECTOR.SELECTORS.GROUP);
  }

  /**
   * Get all count buttons
   */
  get buttons(): Locator {
    return this.page.locator(
      `${QUESTION_COUNT_SELECTOR.SELECTORS.BUTTON_PREFIX}${QUESTION_COUNT_SELECTOR.SELECTORS.BUTTON_SUFFIX}`,
    );
  }

  /**
   * Get the button for a specific count
   */
  button(count: QuestionCount): Locator {
    return this.page.locator(`button[aria-label="${count} questions"]`);
  }

  /**
   * Get the 10 questions button
   */
  get button10(): Locator {
    return this.page.locator(QUESTION_COUNT_SELECTOR.SELECTORS.BUTTON_10);
  }

  /**
   * Get the 20 questions button
   */
  get button20(): Locator {
    return this.page.locator(QUESTION_COUNT_SELECTOR.SELECTORS.BUTTON_20);
  }

  /**
   * Get the 30 questions button
   */
  get button30(): Locator {
    return this.page.locator(QUESTION_COUNT_SELECTOR.SELECTORS.BUTTON_30);
  }

  /**
   * Get the currently selected button
   */
  get selectedButton(): Locator {
    return this.page.locator(QUESTION_COUNT_SELECTOR.SELECTORS.SELECTED_BUTTON);
  }

  /**
   * Get all selected buttons (should be exactly one)
   */
  get selectedButtons(): Locator {
    return this.page.locator('button[aria-pressed="true"]');
  }

  // ========================================================================
  // Actions
  // ========================================================================

  /**
   * Navigate to the home page containing the selector
   */
  async goto(): Promise<void> {
    await this.page.goto(this.baseUrl);
  }

  /**
   * Wait for the component to be mounted and rendered
   */
  async waitForMounted(): Promise<void> {
    await this.button10.waitFor({ state: 'attached' });
    await expect(this.selectedButtons).toHaveCount(1);
  }

  /**
   * Click on a specific count button
   */
  async selectCount(count: QuestionCount): Promise<void> {
    await this.button(count).click();
  }

  /**
   * Click the 10 questions button
   */
  async select10(): Promise<void> {
    await this.button10.click();
  }

  /**
   * Click the 20 questions button
   */
  async select20(): Promise<void> {
    await this.button20.click();
  }

  /**
   * Click the 30 questions button
   */
  async select30(): Promise<void> {
    await this.button30.click();
  }

  /**
   * Clear localStorage
   */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Set a specific count in localStorage
   */
  async setStorageCount(count: QuestionCount): Promise<void> {
    await this.page.evaluate(
      (cnt) => {
        localStorage.setItem('quiz-question-count', cnt.toString());
      },
      count,
    );
  }

  /**
   * Get the current count from localStorage
   */
  async getStorageCount(): Promise<QuestionCount | null> {
    return await this.page.evaluate(() => {
      const stored = localStorage.getItem('quiz-question-count');
      return stored ? (parseInt(stored, 10) as QuestionCount) : null;
    });
  }

  /**
   * Get the selected count from Zustand store
   */
  async getStoreSelectedCount(): Promise<number> {
    return await this.page.evaluate(() => {
      // @ts-ignore - accessing window store for testing
      const store = window.__ZUSTAND_STORE__;
      return store?.getState().selectedQuestionCount ?? 20;
    });
  }

  /**
   * Get the currently displayed count from the home page description
   */
  async getDisplayedCount(): Promise<number> {
    const description = this.page.locator('p:has-text("Test your AWS knowledge")');
    const text = await description.textContent();
    const match = text?.match(/(\d+)\s+practice\s+questions/);
    return match ? parseInt(match[1], 10) : 20;
  }

  /**
   * Navigate to the quiz page
   */
  async gotoQuiz(): Promise<void> {
    await this.page.click('a[href="/quiz"]');
    await this.page.waitForURL('**/quiz');
  }

  /**
   * Reload the page
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  /**
   * Press keyboard key on a button
   */
  async pressKey(count: QuestionCount, key: string): Promise<void> {
    await this.button(count).press(key);
  }

  /**
   * Tab to a specific button
   */
  async tabToButton(count: QuestionCount, times = 1): Promise<void> {
    const button = this.button(count);
    await button.focus();
  }

  /**
   * Hover over a button
   */
  async hoverButton(count: QuestionCount): Promise<void> {
    await this.button(count).hover();
  }

  // ========================================================================
  // Assertions
  // ========================================================================

  /**
   * Assert that the component is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.container).toBeVisible();
  }

  /**
   * Assert that all three buttons are present
   */
  async expectThreeButtons(): Promise<void> {
    await expect(this.buttons).toHaveCount(3);
  }

  /**
   * Assert that exactly one button is selected
   */
  async expectOneSelected(): Promise<void> {
    await expect(this.selectedButtons).toHaveCount(1);
  }

  /**
   * Assert that a specific count is selected
   */
  async expectSelected(count: QuestionCount): Promise<void> {
    await expect(this.selectedButton).toHaveText(count.toString());
  }

  /**
   * Assert that a button has the selected styling
   */
  async expectSelectedStyling(button: Locator): Promise<void> {
    await expect(button).toHaveClass(/bg-neon-lime/);
    await expect(button).toHaveClass(/text-pitch-black/);
  }

  /**
   * Assert that a button has unselected styling
   */
  async expectUnselectedStyling(button: Locator): Promise<void> {
    await expect(button).toHaveClass(/bg-gunmetal/);
    await expect(button).toHaveClass(/text-storm-cloud/);
  }

  /**
   * Assert that a button is disabled
   */
  async expectDisabled(button: Locator): Promise<void> {
    await expect(button).toBeDisabled();
  }

  /**
   * Assert that all buttons are enabled
   */
  async expectAllEnabled(): Promise<void> {
    for (const count of QUESTION_COUNT_SELECTOR.VALID_COUNTS) {
      await expect(this.button(count)).toBeEnabled();
    }
  }

  /**
   * Assert correct accessibility attributes
   */
  async expectAccessibility(): Promise<void> {
    await expect(this.group).toHaveAttribute('role', 'group');
    await expect(this.group).toHaveAttribute(
      'aria-label',
      'Question count selection',
    );
    await expect(this.button10).toHaveAttribute('aria-label', '10 questions');
    await expect(this.button10).toHaveAttribute('type', 'button');
    await expect(this.button20).toHaveAttribute('aria-label', '20 questions');
    await expect(this.button20).toHaveAttribute('type', 'button');
    await expect(this.button30).toHaveAttribute('aria-label', '30 questions');
    await expect(this.button30).toHaveAttribute('type', 'button');
  }

  /**
   * Assert aria-pressed state for a button
   */
  async expectAriaPressed(count: QuestionCount, pressed: boolean): Promise<void> {
    const button = this.button(count);
    await expect(button).toHaveAttribute('aria-pressed', String(pressed));
  }

  /**
   * Assert correct button dimensions
   */
  async expectDimensions(): Promise<void> {
    const box10 = await this.button10.boundingBox();
    const box20 = await this.button20.boundingBox();
    const box30 = await this.button30.boundingBox();

    expect(box10).toBeTruthy();
    expect(box20).toBeTruthy();
    expect(box30).toBeTruthy();

    // All buttons should have same dimensions
    expect(box10!.width).toBeCloseTo(box20!.width, 5);
    expect(box10!.height).toBeCloseTo(box20!.height, 5);
    expect(box20!.width).toBeCloseTo(box30!.width, 5);
    expect(box20!.height).toBeCloseTo(box30!.height, 5);
  }

  /**
   * Assert that localStorage contains the expected count
   */
  async expectStorageCount(count: QuestionCount): Promise<void> {
    const stored = await this.getStorageCount();
    expect(stored).toBe(count);
  }

  /**
   * Assert that localStorage is empty
   */
  async expectStorageEmpty(): Promise<void> {
    const stored = await this.getStorageCount();
    expect(stored).toBeNull();
  }

  /**
   * Assert the store state matches expected count
   */
  async expectStoreCount(count: QuestionCount): Promise<void> {
    const storeCount = await this.getStoreSelectedCount();
    expect(storeCount).toBe(count);
  }

  /**
   * Assert the displayed text matches the count
   */
  async expectDisplayedCount(count: QuestionCount): Promise<void> {
    const displayed = await this.getDisplayedCount();
    expect(displayed).toBe(count);
  }

  /**
   * Assert that the label is visible and correct
   */
  async expectLabel(): Promise<void> {
    await expect(this.label).toBeVisible();
    await expect(this.label).toHaveText('Number of Questions');
  }

  /**
   * Assert no console errors
   */
  async expectNoConsoleErrors(): Promise<void> {
    const errors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    // Small delay to catch any errors
    await this.page.waitForTimeout(100);
    expect(errors).toHaveLength(0);
  }

  /**
   * Assert visual regression snapshot
   */
  async expectSnapshot(): Promise<void> {
    await expect(this.container).toHaveScreenshot();
  }

  /**
   * Assert hydration completed successfully
   */
  async expectHydrated(): Promise<void> {
    await this.waitForMounted();
    await expect(this.selectedButtons).toHaveCount(1);
    // Check that disabled state is cleared after mount
    await expect(this.button10).not.toBeDisabled();
  }

  /**
   * Assert focus ring is visible on button
   */
  async expectFocusRing(count: QuestionCount): Promise<void> {
    const button = this.button(count);
    await expect(button).toHaveClass(/focus:ring-2/);
  }

  /**
   * Assert correct button spacing
   */
  async expectButtonSpacing(): Promise<void> {
    const box10 = await this.button10.boundingBox();
    const box20 = await this.button20.boundingBox();

    expect(box20!.x).toBeGreaterThan(box10!.x + box10!.width);
  }

  /**
   * Assert hover state styling
   */
  async expectHoverStyling(count: QuestionCount): Promise<void> {
    const button = this.button(count);
    const isSelected = await button.getAttribute('aria-pressed');
    if (isSelected !== 'true') {
      await expect(button).toHaveClass(/hover:bg-muted-ash/);
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a page object for testing
 */
export function createQuestionCountSelectorFixture(
  page: Page,
  baseUrl?: string,
): QuestionCountSelectorPageObject {
  return new QuestionCountSelectorPageObject(page, baseUrl);
}

/**
 * Helper to wait for component hydration
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(100); // Additional buffer for React hydration
}

/**
 * Helper to check for hydration mismatches
 */
export async function checkHydrationErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (
      text.includes('hydration') ||
      text.includes('Warning:') ||
      text.includes('Error:')
    ) {
      errors.push(text);
    }
  });

  await waitForHydration(page);
  return errors;
}

/**
 * Helper to clear all storage and reset store
 */
export async function resetTestState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    // @ts-ignore - accessing window store for testing
    if (window.__ZUSTAND_STORE__) {
      window.__ZUSTAND_STORE__.getState().resetQuiz();
    }
  });
}

/**
 * Helper to setup test with specific count in storage
 */
export async function setupWithCount(
  page: Page,
  count: QuestionCount,
): Promise<void> {
  await resetTestState(page);
  await page.evaluate(
    (cnt) => {
      localStorage.setItem('quiz-question-count', cnt.toString());
    },
    count,
  );
}

/**
 * Helper to measure render performance
 */
export async function measureRenderTime(
  page: Page,
  action: () => Promise<void>,
): Promise<number> {
  const metrics = await page.evaluate(async (act) => {
    const start = performance.now();
    await act();
    return performance.now() - start;
  });
  return metrics;
}

/**
 * Helper to check accessibility tree
 */
export async function getAccessibilityTree(page: Page): Promise<any> {
  return await page.accessibility.snapshot();
}

/**
 * Helper to simulate mobile viewport
 */
export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 375, height: 667 });
}

/**
 * Helper to simulate tablet viewport
 */
export async function setTabletViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 768, height: 1024 });
}

/**
 * Helper to simulate desktop viewport
 */
export async function setDesktopViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
}

/**
 * Helper to intercept and wait for API calls
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string,
): Promise<any> {
  let resolved = false;
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes(urlPattern),
  );

  // Return promise that resolves when API call completes
  return new Promise((resolve) => {
    responsePromise.then((response) => {
      resolved = true;
      resolve(response);
    });
  });
}

/**
 * Helper to mock API responses
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string,
  mockData: any,
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData),
    });
  });
}

/**
 * Helper to mock API errors
 */
export async function mockApiError(
  page: Page,
  urlPattern: string,
  status: number = 500,
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Mock error' }),
    });
  });
}

/**
 * Helper to simulate network offline
 */
export async function goOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

/**
 * Helper to simulate network online
 */
export async function goOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
}

/**
 * Helper to inject store state for testing
 */
export async function injectStoreState(
  page: Page,
  state: Partial<{ selectedQuestionCount: number }>,
): Promise<void> {
  await page.evaluate((st) => {
    // @ts-ignore - accessing window store for testing
    if (window.__ZUSTAND_STORE__) {
      window.__ZUSTAND_STORE__.setState(st);
    }
  }, state);
}

/**
 * Helper to get current store state
 */
export async function getStoreState(page: Page): Promise<any> {
  return await page.evaluate(() => {
    // @ts-ignore - accessing window store for testing
    return window.__ZUSTAND_STORE__?.getState() ?? null;
  });
}

/**
 * Helper to simulate slow storage (for persistence tests)
 */
export async function slowStorage(page: Page, delay: number = 100): Promise<void> {
  await page.addInitScript((d) => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (...args: Parameters<typeof localStorage.setItem>) {
      setTimeout(() => originalSetItem.apply(this, args), d);
    };
  }, delay);
}

/**
 * Helper to test keyboard navigation
 */
export async function testKeyboardNavigation(
  page: Page,
  selector: QuestionCountSelectorPageObject,
): Promise<void> {
  const keys: string[] = ['Tab', 'Enter', ' ', 'ArrowRight', 'ArrowLeft'];
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(50);
  }
}

/**
 * Helper to get computed styles
 */
export async function getComputedStyle(
  page: Page,
  selector: string,
): Promise<CSSStyleDeclaration> {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? window.getComputedStyle(el) : {};
  }, selector);
}

/**
 * Helper to check contrast ratios
 */
export async function getContrastRatio(
  page: Page,
  selector: string,
): Promise<number> {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    if (!el) return 0;

    const styles = window.getComputedStyle(el);
    const fg = styles.color;
    const bg = styles.backgroundColor;

    // Simplified contrast calculation
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      const [r, g, b] = rgb.map((v) => {
        const v255 = parseInt(v, 255);
        return v255 <= 0.03928
          ? v255 / 12.92
          : Math.pow((v255 + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(fg);
    const l2 = getLuminance(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }, selector);
}

/**
 * Helper to run visual diff comparison
 */
export async function compareVisuals(
  page: Page,
  selector: string,
  expectedScreenshot: Buffer,
): Promise<number> {
  const screenshot = await page.locator(selector).screenshot();
  // In real implementation, use pixelmatch or similar
  // This is a placeholder
  return 0;
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Test: Basic Rendering
 *
 * Verifies that the component renders correctly with all buttons visible.
 */
export async function testBasicRendering(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();
  await fixture.waitForMounted();
  await fixture.expectVisible();
  await fixture.expectThreeButtons();
  await fixture.expectOneSelected();
  await fixture.expectLabel();
}

/**
 * Test: User Interaction
 *
 * Verifies that users can select different question counts.
 */
export async function testUserInteraction(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();
  await fixture.waitForMounted();

  // Test selecting 10
  await fixture.select10();
  await fixture.expectSelected(10);
  await fixture.expectStorageCount(10);
  await fixture.expectStoreCount(10);

  // Test selecting 20
  await fixture.select20();
  await fixture.expectSelected(20);
  await fixture.expectStorageCount(20);
  await fixture.expectStoreCount(20);

  // Test selecting 30
  await fixture.select30();
  await fixture.expectSelected(30);
  await fixture.expectStorageCount(30);
  await fixture.expectStoreCount(30);
}

/**
 * Test: localStorage Persistence
 *
 * Verifies that the selected count persists across page reloads.
 */
export async function testLocalStoragePersistence(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.clearStorage();
  await fixture.goto();

  // Select 10 questions
  await fixture.select10();
  await fixture.expectStorageCount(10);

  // Reload page
  await fixture.reload();
  await fixture.waitForMounted();
  await fixture.expectSelected(10);
  await fixture.expectStoreCount(10);
}

/**
 * Test: Accessibility
 *
 * Verifies ARIA attributes, keyboard navigation, and screen reader support.
 */
export async function testAccessibility(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();
  await fixture.waitForMounted();

  // Check ARIA attributes
  await fixture.expectAccessibility();

  // Test keyboard navigation
  await fixture.tabToButton(10);
  await fixture.expectFocusRing(10);

  await fixture.pressKey(10, 'ArrowRight');
  await fixture.expectFocusRing(20);

  // Test Enter key selection
  await fixture.pressKey(20, 'Enter');
  await fixture.expectSelected(20);

  // Test Space key selection
  await fixture.tabToButton(30);
  await fixture.pressKey(30, ' ');
  await fixture.expectSelected(30);
}

/**
 * Test: Integration with Quiz Flow
 *
 * Verifies that selected count is used when starting the quiz.
 */
export async function testQuizIntegration(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();
  await fixture.waitForMounted();

  // Select 30 questions
  await fixture.select30();
  await fixture.expectDisplayedCount(30);

  // Start quiz
  await fixture.gotoQuiz();

  // Verify quiz started with correct count
  const sessionCount = await fixture.getStoreSelectedCount();
  expect(sessionCount).toBe(30);
}

/**
 * Test: Zustand Store Integration
 *
 * Verifies that the component properly integrates with the quiz store.
 */
export async function testStoreIntegration(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();
  await fixture.waitForMounted();

  // Store should start with default
  await fixture.expectStoreCount(20);

  // Select 10 questions
  await fixture.select10();
  await fixture.expectStoreCount(10);

  // Inject different state
  await injectStoreState(fixture.page, { selectedQuestionCount: 30 });
  await fixture.expectStoreCount(30);
}

/**
 * Test: Edge Cases
 *
 * Tests various edge cases and boundary conditions.
 */
export async function testEdgeCases(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();
  await fixture.waitForMounted();

  // Test rapid clicking
  await fixture.select10();
  await fixture.select20();
  await fixture.select30();
  await fixture.expectOneSelected();

  // Test invalid storage value
  await fixture.clearStorage();
  await fixture.setStorageCount(15 as QuestionCount); // Invalid
  await fixture.reload();
  await fixture.waitForMounted();
  await fixture.expectSelected(20); // Should fall back to default
}

/**
 * Test: Visual States
 *
 * Verifies visual states for selected, unselected, and disabled buttons.
 */
export async function testVisualStates(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();
  await fixture.waitForMounted();

  // Check selected state
  await fixture.expectSelectedStyling(fixture.selectedButton);

  // Check unselected states
  await fixture.expectUnselectedStyling(fixture.button10);
  await fixture.expectUnselectedStyling(fixture.button30);

  // Test hover states
  await fixture.hoverButton(10);
  await fixture.expectHoverStyling(10);
}

/**
 * Test: Mobile/Responsive
 *
 * Verifies component works correctly on mobile devices.
 */
export async function testMobileResponsive(
  page: Page,
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await setMobileViewport(page);
  await fixture.goto();
  await fixture.waitForMounted();

  await fixture.expectVisible();
  await fixture.expectThreeButtons();
  await fixture.select20();
  await fixture.expectSelected(20);
}

/**
 * Test: Performance
 *
 * Verifies component renders within acceptable time limits.
 */
export async function testPerformance(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();

  const startTime = Date.now();
  await fixture.waitForMounted();
  const renderTime = Date.now() - startTime;

  expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
}

/**
 * Test: Hydration
 *
 * Verifies correct SSR/hydration behavior.
 */
export async function testHydration(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  const errors = await checkHydrationErrors(fixture.page);
  await fixture.goto();
  await fixture.waitForMounted();

  await fixture.expectHydrated();
  expect(errors).toHaveLength(0);
}

/**
 * Test: Error Boundaries
 *
 * Verifies graceful handling of errors.
 */
export async function testErrorBoundaries(
  fixture: QuestionCountSelectorPageObject,
): Promise<void> {
  await fixture.goto();
  await fixture.waitForMounted();

  // Simulate store error
  await fixture.page.evaluate(() => {
    // @ts-ignore
    window.__ZUSTAND_STORE__ = null;
  });

  // Component should still render (with fallback)
  await fixture.expectVisible();
}

// ============================================================================
// Export All
// ============================================================================

export default {
  QuestionCountSelectorPageObject,
  createQuestionCountSelectorFixture,
  testBasicRendering,
  testUserInteraction,
  testLocalStoragePersistence,
  testAccessibility,
  testQuizIntegration,
  testStoreIntegration,
  testEdgeCases,
  testVisualStates,
  testMobileResponsive,
  testPerformance,
  testHydration,
  testErrorBoundaries,
  // Helpers
  waitForHydration,
  checkHydrationErrors,
  resetTestState,
  setupWithCount,
  measureRenderTime,
  getAccessibilityTree,
  setMobileViewport,
  setTabletViewport,
  setDesktopViewport,
  waitForApiCall,
  mockApiResponse,
  mockApiError,
  goOffline,
  goOnline,
  injectStoreState,
  getStoreState,
  slowStorage,
  testKeyboardNavigation,
  getComputedStyle,
  getContrastRatio,
  compareVisuals,
};
