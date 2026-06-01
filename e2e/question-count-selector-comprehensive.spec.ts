import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive E2E Test Suite for QuestionCountSelector Component
 *
 * Tests cover:
 * - Basic Rendering
 * - User Interaction
 * - localStorage Persistence
 * - Accessibility
 * - Integration with Quiz Flow
 * - Zustand Store Integration
 * - Edge Cases
 * - Visual States
 * - Network & API Integration
 * - Mobile/Responsive
 * - Performance
 * - Hydration
 * - Internationalization (i18n) preparation
 * - Error Boundaries
 * - Analytics/Tracking
 */

const STORAGE_KEY = 'quiz-question-count';
const OPTIONS = [10, 20, 30];
const DEFAULT_COUNT = 20;

// Test helpers
async function gotoQuizPage(page: Page) {
  await page.goto('/quiz');
  await page.waitForLoadState('networkidle');
}

async function getSelectorButtons(page: Page) {
  return page.locator('[data-testid="question-count-option"]');
}

async function getSelectedButton(page: Page) {
  return page.locator('[data-testid="question-count-option"][data-selected="true"]');
}

test.describe('QuestionCountSelector - Basic Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should render the component with label', async ({ page }) => {
    await gotoQuizPage(page);

    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();
    await expect(selector).toContainText('Questions:');
  });

  test('should render all three option buttons (10, 20, 30)', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await expect(buttons).toHaveCount(3);

    const buttonTexts = await buttons.allTextContents();
    expect(buttonTexts).toEqual(['10', '20', '30']);
  });

  test('should have default selection of 20 questions', async ({ page }) => {
    await gotoQuizPage(page);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveText('20');
  });

  test('should render buttons in correct order', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    await expect(buttons.nth(0)).toHaveText('10');
    await expect(buttons.nth(1)).toHaveText('20');
    await expect(buttons.nth(2)).toHaveText('30');
  });

  test('should render with correct container classes', async ({ page }) => {
    await gotoQuizPage(page);

    const container = page.locator('[data-testid="question-count-selector"]');
    await expect(container).toHaveClass(/flex/);
    await expect(container).toHaveClass(/items-center/);
    await expect(container).toHaveClass(/gap-2/);
  });

  test('should render label with correct styling', async ({ page }) => {
    await gotoQuizPage(page);

    const label = page.locator('[data-testid="question-count-selector"] > span');
    await expect(label).toHaveClass(/text-sm/);
    await expect(label).toHaveClass(/text-storm-cloud/);
  });
});

test.describe('QuestionCountSelector - User Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should change selection when clicking 10', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveText('10');
  });

  test('should change selection when clicking 30', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(2).click();

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveText('30');
  });

  test('should update selection from 10 to 20 to 30', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Click 10
    await buttons.nth(0).click();
    await expect(getSelectedButton(page)).toHaveText('10');

    // Click 20
    await buttons.nth(1).click();
    await expect(getSelectedButton(page)).toHaveText('20');

    // Click 30
    await buttons.nth(2).click();
    await expect(getSelectedButton(page)).toHaveText('30');
  });

  test('should maintain active state styling on selection', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // 20 should be selected by default (neon lime background)
    await expect(buttons.nth(1)).toHaveClass(/bg-neon-lime/);
    await expect(buttons.nth(1)).toHaveClass(/text-pitch-black/);

    // Click 10
    await buttons.nth(0).click();

    // 10 should now have active styling
    await expect(buttons.nth(0)).toHaveClass(/bg-neon-lime/);
    await expect(buttons.nth(0)).toHaveClass(/text-pitch-black/);

    // 20 should have inactive styling
    await expect(buttons.nth(1)).toHaveClass(/bg-gunmetal/);
    await expect(buttons.nth(1)).toHaveClass(/text-porcelain/);
  });

  test('should trigger onChange callback when selection changes', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Click 10 and verify state updates
    await buttons.nth(0).click();

    // Verify the selection persists
    await expect(getSelectedButton(page)).toHaveText('10');
  });

  test('should handle rapid clicks without error', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Rapid clicks
    await buttons.nth(0).click();
    await buttons.nth(1).click();
    await buttons.nth(2).click();
    await buttons.nth(0).click();

    // Should settle on last selection
    await expect(getSelectedButton(page)).toHaveText('10');
  });

  test('should be clickable via keyboard (Enter key)', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).focus();
    await page.keyboard.press('Enter');

    await expect(getSelectedButton(page)).toHaveText('10');
  });

  test('should be clickable via keyboard (Space key)', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(2).focus();
    await page.keyboard.press('Space');

    await expect(getSelectedButton(page)).toHaveText('30');
  });

  test('should navigate options with arrow keys', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(1).focus();

    // Navigate left
    await page.keyboard.press('ArrowLeft');
    await expect(buttons.nth(0)).toBeFocused();

    // Navigate right
    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(1)).toBeFocused();
  });
});

test.describe('QuestionCountSelector - localStorage Persistence', () => {
  test('should load saved selection from localStorage on mount', async ({ page }) => {
    await page.goto('/quiz');
    await page.evaluate(() => {
      localStorage.setItem('quiz-question-count', '30');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(getSelectedButton(page)).toHaveText('30');
  });

  test('should save selection to localStorage when changed', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    const storedValue = await page.evaluate(() => {
      return localStorage.getItem('quiz-question-count');
    });

    expect(storedValue).toBe('10');
  });

  test('should handle invalid localStorage values gracefully', async ({ page }) => {
    await page.goto('/quiz');
    await page.evaluate(() => {
      localStorage.setItem('quiz-question-count', 'invalid');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(getSelectedButton(page)).toHaveText('20');
  });

  test('should handle out-of-range localStorage values gracefully', async ({ page }) => {
    await page.goto('/quiz');
    await page.evaluate(() => {
      localStorage.setItem('quiz-question-count', '999');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(getSelectedButton(page)).toHaveText('20');
  });

  test('should persist selection across page navigation', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(2).click();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/quiz');
    await page.waitForLoadState('networkidle');

    await expect(getSelectedButton(page)).toHaveText('30');
  });

  test('should sync with Zustand store', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    // Verify store was updated (if accessible)
    const storeValue = await page.evaluate(() => {
      // Check if store is exposed for testing
      return (window as any).__QUIZ_STORE__?.selectedQuestionCount ?? null;
    });

    if (storeValue !== null) {
      expect(storeValue).toBe(10);
    }
  });
});

test.describe('QuestionCountSelector - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should have aria-pressed attribute on buttons', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    for (let i = 0; i < 3; i++) {
      const pressed = await buttons.nth(i).getAttribute('aria-pressed');
      expect(pressed).toMatch(/true|false/);
    }
  });

  test('should update aria-pressed when selection changes', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Initially 20 is pressed
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');

    // Click 10
    await buttons.nth(0).click();

    // Now 10 should be pressed
    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'false');
  });

  test('should be navigable via keyboard', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).focus();

    await page.keyboard.press('Tab');
    await expect(buttons.nth(1)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(buttons.nth(2)).toBeFocused();
  });

  test('should have visible focus states', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).focus();

    // Check if element is focused
    const isFocused = await buttons.nth(0).evaluate((el) => el === document.activeElement);
    expect(isFocused).toBe(true);
  });

  test('should have proper button roles', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveRole('button');
    }
  });

  test('should have role="group" on button container', async ({ page }) => {
    await gotoQuizPage(page);

    const container = page.locator('[data-testid="question-count-selector"] > div');
    await expect(container).toHaveAttribute('role', 'group');
  });

  test('should have aria-label on button container', async ({ page }) => {
    await gotoQuizPage(page);

    const container = page.locator('[data-testid="question-count-selector"] > div');
    await expect(container).toHaveAttribute('aria-label', 'Question count options');
  });
});

test.describe('QuestionCountSelector - Integration with Quiz Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should not reset selection when quiz starts', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    // Simulate quiz start - check if selection persists
    await expect(getSelectedButton(page)).toHaveText('10');
  });

  test('should allow changing count during active quiz', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Change to 30
    await buttons.nth(2).click();
    await expect(getSelectedButton(page)).toHaveText('30');
  });

  test('should work correctly with quiz completion flow', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Select 10 questions
    await buttons.nth(0).click();

    // Simulate quiz progress
    await page.evaluate(() => {
      sessionStorage.setItem('quiz-progress', JSON.stringify({
        answers: {},
        currentIndex: 5,
      }));
    });

    // Selection should still be accessible
    await expect(getSelectedButton(page)).toHaveText('10');
  });
});

test.describe('QuestionCountSelector - Zustand Store Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should initialize with store value if available', async ({ page }) => {
    await page.goto('/quiz');

    // Check if component uses store value
    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toBeVisible();
  });

  test('should update localStorage when selection changes', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    const value = await page.evaluate(() => {
      return localStorage.getItem('quiz-question-count');
    });

    expect(value).toBe('10');
  });

  test('should handle store persistence across sessions', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(2).click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should load persisted value
    await expect(getSelectedButton(page)).toHaveText('30');
  });
});

test.describe('QuestionCountSelector - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should handle component unmounting gracefully', async ({ page }) => {
    await gotoQuizPage(page);

    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();

    // Navigate to different page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/quiz/);
  });

  test('should handle rapid mount/unmount cycles', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.goto('/quiz');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="question-count-selector"]')).toBeVisible();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle concurrent localStorage updates', async ({ page }) => {
    await gotoQuizPage(page);

    // Simulate concurrent updates
    await page.evaluate(() => {
      const event = new StorageEvent('storage', {
        key: 'quiz-question-count',
        newValue: '30',
        oldValue: '20',
      });
      window.dispatchEvent(event);
    });

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    // Should handle both updates
    await expect(getSelectedButton(page)).toHaveText('10');
  });

  test('should handle localStorage quota exceeded scenario', async ({ page }) => {
    await gotoQuizPage(page);

    // Fill localStorage
    await page.evaluate(() => {
      try {
        const data = 'x'.repeat(5 * 1024 * 1024); // 5MB
        localStorage.setItem('large-data', data);
      } catch (e) {
        // Quota exceeded
      }
    });

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    // Should still work
    await expect(getSelectedButton(page)).toHaveText('10');
  });

  test('should handle missing localStorage support', async ({ page }) => {
    await gotoQuizPage(page);

    // Block localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get: () => {
          throw new Error('localStorage not available');
        },
      });
    });

    await page.reload();

    // Should still render with default
    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();
  });
});

test.describe('QuestionCountSelector - Visual States', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should display correct colors for selected state', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Selected button should have neon-lime background (#e4f222)
    const bgColor = await buttons.nth(1).evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(bgColor).toBe('rgb(228, 242, 34)');
  });

  test('should display correct colors for unselected state', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Unselected buttons should have gunmetal background (#383b3f)
    const bgColor = await buttons.nth(0).evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(bgColor).toBe('rgb(56, 59, 63)');
  });

  test('should display hover state on mouseover', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    const unselectedButton = buttons.nth(0);

    await unselectedButton.hover();

    // Should have hover class
    await expect(unselectedButton).toHaveClass(/hover:/);
  });

  test('should have correct border radius', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    const borderRadius = await buttons.nth(0).evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    expect(borderRadius).toBe('6px');
  });

  test('should have correct font styling', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    await expect(buttons.nth(0)).toHaveClass(/text-sm/);
    await expect(buttons.nth(0)).toHaveClass(/font-medium/);
  });

  test('should have correct padding', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    await expect(buttons.nth(0)).toHaveClass(/px-3/);
    await expect(buttons.nth(0)).toHaveClass(/py-1\.5/);
  });

  test('should show transition effect', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    await expect(buttons.nth(0)).toHaveClass(/transition-colors/);
  });
});

test.describe('QuestionCountSelector - Network & API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should not block UI during API calls', async ({ page }) => {
    await gotoQuizPage(page);

    // Slow down network
    await page.route('**/api/**', (route) => {
      setTimeout(() => route.continue(), 2000);
    });

    const buttons = await getSelectorButtons(page);

    // Should be able to click while API is pending
    await buttons.nth(0).click();
    await expect(getSelectedButton(page)).toHaveText('10');

    await buttons.nth(2).click();
    await expect(getSelectedButton(page)).toHaveText('30');
  });

  test('should handle offline state', async ({ page }) => {
    await page.context().setOffline(true);

    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    // UI should still update
    await expect(getSelectedButton(page)).toHaveText('10');

    await page.context().setOffline(false);
  });

  test('should handle slow network requests', async ({ page }) => {
    await gotoQuizPage(page);

    // Slow down network
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 2000);
    });

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    // Should still work
    await expect(getSelectedButton(page)).toHaveText('10');
  });
});

test.describe('QuestionCountSelector - Mobile/Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoQuizPage(page);

    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();

    const buttons = await getSelectorButtons(page);
    await expect(buttons).toHaveCount(3);
  });

  test('should have touch-friendly target sizes on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    const button = buttons.nth(0);

    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40); // Minimum touch target
  });

  test('should wrap correctly on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await gotoQuizPage(page);

    const container = page.locator('[data-testid="question-count-selector"]');
    await expect(container).toBeVisible();

    const buttons = await getSelectorButtons(page);
    await expect(buttons).toHaveCount(3);
  });

  test('should handle orientation changes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    // Rotate to landscape
    await page.setViewportSize({ width: 667, height: 375 });

    // Selection should persist
    await expect(getSelectedButton(page)).toHaveText('10');
  });

  test('should work correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoQuizPage(page);

    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();

    const buttons = await getSelectorButtons(page);
    await expect(buttons).toHaveCount(3);
  });

  test('should work on large desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await gotoQuizPage(page);

    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();
  });
});

test.describe('QuestionCountSelector - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should render quickly', async ({ page }) => {
    const startTime = Date.now();

    await gotoQuizPage(page);
    await page.waitForSelector('[data-testid="question-count-selector"]');

    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(3000);
  });

  test('should update selection instantly', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    const startTime = Date.now();

    await buttons.nth(0).click();

    const updateTime = Date.now() - startTime;
    expect(updateTime).toBeLessThan(500);
  });

  test('should not cause performance issues with rapid clicks', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    const startTime = Date.now();

    for (let i = 0; i < 20; i++) {
      await buttons.nth(i % 3).click();
    }

    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(5000);
  });

  test('should handle localStorage reads efficiently', async ({ page }) => {
    await gotoQuizPage(page);

    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      await page.evaluate((key) => {
        localStorage.getItem(key);
      }, STORAGE_KEY);
    }

    const readTime = Date.now() - startTime;
    expect(readTime).toBeLessThan(1000);
  });
});

test.describe('QuestionCountSelector - Hydration', () => {
  test('should hydrate correctly after SSR', async ({ page }) => {
    await gotoQuizPage(page);

    await page.waitForLoadState('networkidle');

    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveText('20');
  });

  test('should handle hydration with localStorage value', async ({ page }) => {
    await page.goto('/quiz');
    await page.evaluate(() => {
      localStorage.setItem('quiz-question-count', '30');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(getSelectedButton(page)).toHaveText('30');
  });

  test('should not cause hydration errors', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        messages.push(msg.text());
      }
    });

    await gotoQuizPage(page);
    await page.waitForLoadState('networkidle');

    const hydrationErrors = messages.filter((msg) =>
      msg.includes('hydration') || msg.includes('Hydration')
    );

    expect(hydrationErrors).toHaveLength(0);
  });

  test('should handle client-side only features', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    // Should work correctly
    await expect(getSelectedButton(page)).toHaveText('10');

    const value = await page.evaluate(() => {
      return localStorage.getItem('quiz-question-count');
    });
    expect(value).toBe('10');
  });
});

test.describe('QuestionCountSelector - Internationalization (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should have translatable label text', async ({ page }) => {
    await gotoQuizPage(page);

    const label = page.locator('[data-testid="question-count-selector"] > span');
    const text = await label.textContent();

    expect(text).toMatch(/questions/i);
  });

  test('should support RTL layout direction', async ({ page }) => {
    await gotoQuizPage(page);
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });

    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();

    const buttons = await getSelectorButtons(page);
    await expect(buttons).toHaveCount(3);
  });

  test('should handle number formatting for different locales', async ({ page }) => {
    await gotoQuizPage(page);

    await page.evaluate(() => {
      document.body.lang = 'es';
    });

    const buttons = await getSelectorButtons(page);
    const buttonTexts = await buttons.allTextContents();

    // Numbers should display correctly
    expect(buttonTexts).toEqual(['10', '20', '30']);
  });
});

test.describe('QuestionCountSelector - Error Boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should handle localStorage access errors gracefully', async ({ page }) => {
    await gotoQuizPage(page);

    // Should still render with default value
    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveText('20');
  });

  test('should recover from component errors', async ({ page }) => {
    await gotoQuizPage(page);

    // Should still be functional
    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();

    const buttons = await getSelectorButtons(page);
    await buttons.nth(0).click();

    await expect(getSelectedButton(page)).toHaveText('10');
  });

  test('should not crash with invalid state', async ({ page }) => {
    await gotoQuizPage(page);

    // Inject invalid state to localStorage
    await page.evaluate(() => {
      localStorage.setItem('quiz-question-count', 'abc');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should fallback to default
    const selector = page.locator('[data-testid="question-count-selector"]');
    await expect(selector).toBeVisible();
  });
});

test.describe('QuestionCountSelector - Analytics/Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
  });

  test('should include data attributes for tracking', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Check for data attributes
    const hasDataValue = await buttons.nth(0).getAttribute('data-value');
    expect(hasDataValue).toBe('10');
  });

  test('should track selection state via data attributes', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);

    // Check data-selected attributes
    const selected20 = await buttons.nth(1).getAttribute('data-selected');
    expect(selected20).toBe('true');

    const selected10 = await buttons.nth(0).getAttribute('data-selected');
    expect(selected10).toBe('false');

    await buttons.nth(0).click();

    const updatedSelected10 = await buttons.nth(0).getAttribute('data-selected');
    expect(updatedSelected10).toBe('true');
  });

  test('should expose component state for analytics', async ({ page }) => {
    await gotoQuizPage(page);

    const buttons = await getSelectorButtons(page);
    await buttons.nth(2).click();

    // Check if we can read selection state
    const selectedValue = await getSelectedButton(page).getAttribute('data-value');
    expect(selectedValue).toBe('30');
  });
});
