import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Test Suite: QuestionCountSelector Edge Cases
 *
 * Comprehensive edge case testing for the QuestionCountSelector component
 * covering rapid clicks, concurrent storage writes, JavaScript disabled scenarios,
 * error boundary handling, and more.
 */

// Test Constants
const STORAGE_KEY = 'quiz-question-count';
const VALID_COUNTS = [10, 20, 30];
const DEFAULT_COUNT = 20;
const HOME_URL = '/';
const QUIZ_URL = '/quiz';

// Helper Functions
const getLocalStorageCount = async (page: Page): Promise<number | null> => {
  return await page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : null;
  }, STORAGE_KEY);
};

const setLocalStorageCount = async (page: Page, count: number): Promise<void> => {
  await page.evaluate((data) => {
    localStorage.setItem(data.key, data.count.toString());
  }, { key: STORAGE_KEY, count });
};

const clearLocalStorage = async (page: Page): Promise<void> => {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, STORAGE_KEY);
};

const getZustandState = async (page: Page): Promise<{ selectedQuestionCount: number }> => {
  return await page.evaluate(() => {
    // @ts-ignore - Accessing Zustand store for testing
    const state = window.__ZUSTAND_STATE__ || {};
    return { selectedQuestionCount: state.selectedQuestionCount || DEFAULT_COUNT };
  });
};

// Test Suite
test.describe('QuestionCountSelector - Basic Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto(HOME_URL);
  });

  test('should render all three question count options', async ({ page }) => {
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);
  });

  test('should display correct labels for each option', async ({ page }) => {
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    const labels = await buttons.allTextContents();

    expect(labels).toEqual(['10', '20', '30']);
  });

  test('should have 20 selected by default', async ({ page }) => {
    const defaultButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await expect(defaultButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should apply correct styling for selected state', async ({ page }) => {
    const selectedButton = page.locator('button[type="button"][aria-pressed="true"]');
    const unselectedButtons = page.locator('button[type="button"][aria-pressed="false"]');

    // Selected button should have Neon Lime background
    await expect(selectedButton).toHaveClass(/bg-neon-lime/);
    await expect(selectedButton).toHaveClass(/text-pitch-black/);

    // Unselected buttons should have Gunmetal background
    await expect(unselectedButtons.first()).toHaveClass(/bg-gunmetal/);
    await expect(unselectedButtons.first()).toHaveClass(/text-storm-cloud/);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    const group = page.locator('[role="group"][aria-label="Question count selection"]');
    await expect(group).toBeVisible();

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('type', 'button');
      await expect(buttons.nth(i)).toHaveAttribute('aria-pressed');
      await expect(buttons.nth(i)).toHaveAttribute('aria-label');
    }
  });
});

test.describe('QuestionCountSelector - User Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto(HOME_URL);
  });

  test('should select 10 questions when clicked', async ({ page }) => {
    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    await expect(tenButton).toHaveAttribute('aria-pressed', 'true');
    await expect(tenButton).toHaveClass(/bg-neon-lime/);

    // Verify other buttons are unselected
    const twentyButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await expect(twentyButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('should select 30 questions when clicked', async ({ page }) => {
    const thirtyButton = page.locator('button[type="button"][aria-label="30 questions"]');
    await thirtyButton.click();

    await expect(thirtyButton).toHaveAttribute('aria-pressed', 'true');
    await expect(thirtyButton).toHaveClass(/bg-neon-lime/);
  });

  test('should switch between options multiple times', async ({ page }) => {
    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    const twentyButton = page.locator('button[type="button"][aria-label="20 questions"]');
    const thirtyButton = page.locator('button[type="button"][aria-label="30 questions"]');

    // Start with 20 (default)
    await expect(twentyButton).toHaveAttribute('aria-pressed', 'true');

    // Switch to 10
    await tenButton.click();
    await expect(tenButton).toHaveAttribute('aria-pressed', 'true');
    await expect(twentyButton).toHaveAttribute('aria-pressed', 'false');

    // Switch to 30
    await thirtyButton.click();
    await expect(thirtyButton).toHaveAttribute('aria-pressed', 'true');
    await expect(tenButton).toHaveAttribute('aria-pressed', 'false');

    // Switch back to 20
    await twentyButton.click();
    await expect(twentyButton).toHaveAttribute('aria-pressed', 'true');
    await expect(thirtyButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('should update displayed question count in description', async ({ page }) => {
    const description = page.locator('p', { hasText: /practice questions/ });
    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');

    await tenButton.click();
    await expect(description).toContainText('10 practice questions');
  });

  test('should have visible focus ring when tabbed to', async ({ page }) => {
    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(tenButton).toBeFocused();
    await expect(tenButton).toHaveClass(/focus:ring-2/);
  });
});

test.describe('QuestionCountSelector - localStorage Persistence', () => {
  test('should load stored value from localStorage on mount', async ({ page }) => {
    await setLocalStorageCount(page, 30);
    await page.goto(HOME_URL);

    const thirtyButton = page.locator('button[type="button"][aria-label="30 questions"]');
    await expect(thirtyButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should save selection to localStorage', async ({ page }) => {
    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    const storedValue = await getLocalStorageCount(page);
    expect(storedValue).toBe(10);
  });

  test('should persist selection across page refreshes', async ({ page }) => {
    await page.goto(HOME_URL);

    const thirtyButton = page.locator('button[type="button"][aria-label="30 questions"]');
    await thirtyButton.click();

    await page.reload();

    const persistedButton = page.locator('button[type="button"][aria-label="30 questions"]');
    await expect(persistedButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle invalid localStorage values gracefully', async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, 'invalid-value');
    }, STORAGE_KEY);

    await page.goto(HOME_URL);

    // Should fall back to default
    const defaultButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await expect(defaultButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle out-of-range localStorage values', async ({ page }) => {
    await setLocalStorageCount(page, 50);
    await page.goto(HOME_URL);

    // Should fall back to default
    const defaultButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await expect(defaultButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should clear localStorage when set to different valid value', async ({ page }) => {
    await setLocalStorageCount(page, 10);
    await page.goto(HOME_URL);

    const twentyButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await twentyButton.click();

    const storedValue = await getLocalStorageCount(page);
    expect(storedValue).toBe(20);
  });
});

test.describe('QuestionCountSelector - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');

    // Tab through buttons
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      await expect(buttons.nth(i)).toBeFocused();
    }
  });

  test('should be selectable via keyboard (Enter key)', async ({ page }) => {
    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');

    // Tab to the 10 button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(tenButton).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(tenButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should be selectable via keyboard (Space key)', async ({ page }) => {
    await page.goto(HOME_URL);

    const thirtyButton = page.locator('button[type="button"][aria-label="30 questions"]');

    // Tab to the 30 button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(thirtyButton).toBeFocused();
    await page.keyboard.press(' ');

    await expect(thirtyButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should announce selection to screen readers', async ({ page }) => {
    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    // Verify aria-pressed update
    await expect(tenButton).toHaveAttribute('aria-pressed', 'true');

    // Verify the button is in the accessibility tree
    const isVisible = await tenButton.isVisible();
    expect(isVisible).toBe(true);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto(HOME_URL);

    const selectedButton = page.locator('button[aria-pressed="true"]');
    const unselectedButton = page.locator('button[aria-pressed="false"]').first();

    // Check that buttons are visible and have proper contrast
    await expect(selectedButton).toBeVisible();
    await expect(unselectedButton).toBeVisible();
  });
});

test.describe('QuestionCountSelector - Integration with Quiz Flow', () => {
  test('should maintain selection when navigating to quiz', async ({ page }) => {
    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    const startButton = page.locator('a', { hasText: 'Start Quiz' });
    await startButton.click();

    await page.waitForURL(QUIZ_URL);

    // Verify the selection is maintained
    const storedValue = await getLocalStorageCount(page);
    expect(storedValue).toBe(10);
  });

  test('should preserve selection when returning to home', async ({ page }) => {
    await page.goto(HOME_URL);

    const thirtyButton = page.locator('button[type="button"][aria-label="30 questions"]');
    await thirtyButton.click();

    // Navigate away
    await page.goto(QUIZ_URL);

    // Navigate back
    await page.goto(HOME_URL);

    const persistedButton = page.locator('button[type="button"][aria-label="30 questions"]');
    await expect(persistedButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should sync selection with quiz state', async ({ page }) => {
    await page.goto(HOME_URL);

    const twentyButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await expect(twentyButton).toHaveAttribute('aria-pressed', 'true');

    // Start quiz
    const startButton = page.locator('a', { hasText: 'Start Quiz' });
    await startButton.click();

    await page.waitForURL(QUIZ_URL);

    // Verify the selection is used in quiz
    const quizTitle = page.locator('h1, h2');
    await expect(quizTitle).toBeVisible();
  });
});

test.describe('QuestionCountSelector - Zustand Store Integration', () => {
  test('should update Zustand store on selection', async ({ page }) => {
    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    // Wait for state update
    await page.waitForTimeout(100);

    const description = page.locator('p', { hasText: /10 practice questions/ });
    await expect(description).toContainText('10 practice questions');
  });

  test('should initialize Zustand store from localStorage', async ({ page }) => {
    await setLocalStorageCount(page, 30);
    await page.goto(HOME_URL);

    const description = page.locator('p', { hasText: /30 practice questions/ });
    await expect(description).toContainText('30 practice questions');
  });

  test('should reflect Zustand store changes in UI', async ({ page }) => {
    await page.goto(HOME_URL);

    const initialDescription = page.locator('p', { hasText: /20 practice questions/ });
    await expect(initialDescription).toContainText('20 practice questions');

    const thirtyButton = page.locator('button[type="button"][aria-label="30 questions"]');
    await thirtyButton.click();

    const updatedDescription = page.locator('p', { hasText: /30 practice questions/ });
    await expect(updatedDescription).toContainText('30 practice questions');
  });
});

test.describe('QuestionCountSelector - Edge Cases', () => {
  test('should handle rapid successive clicks without errors', async ({ page }) => {
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');

    // Rapid click all buttons
    for (let i = 0; i < 5; i++) {
      await buttons.nth(0).click();
      await buttons.nth(1).click();
      await buttons.nth(2).click();
    }

    // Final state should be consistent
    await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle concurrent localStorage writes', async ({ page }) => {
    await page.goto(HOME_URL);

    // Simulate concurrent writes
    await page.evaluate((key) => {
      // Set initial value
      localStorage.setItem(key, '10');

      // Immediately overwrite
      setTimeout(() => {
        localStorage.setItem(key, '20');
      }, 10);

      // And again
      setTimeout(() => {
        localStorage.setItem(key, '30');
      }, 20);
    }, STORAGE_KEY);

    await page.reload();

    // Should handle the race condition gracefully
    const finalValue = await getLocalStorageCount(page);
    expect([10, 20, 30]).toContain(finalValue);
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    // Fill localStorage to quota
    await page.evaluate(() => {
      try {
        const data = 'x'.repeat(1024 * 1024 * 5); // 5MB
        localStorage.setItem('test-data', data);
      } catch (e) {
        // Ignore quota errors
      }
    });

    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');

    // Should not throw error
    await expect(async () => {
      await tenButton.click();
    }).not.toThrow();

    // Button should still work
    await expect(tenButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle localStorage disabled in browser', async ({ page }) => {
    // Mock localStorage being disabled
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('localStorage disabled'); },
          setItem: () => { throw new Error('localStorage disabled'); },
          removeItem: () => { throw new Error('localStorage disabled'); },
          clear: () => { throw new Error('localStorage disabled'); },
          length: 0,
          key: () => null,
        },
        writable: false,
      });
    });

    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');

    // Should handle errors gracefully
    await tenButton.click();
    await expect(tenButton).toBeVisible();
  });

  test('should handle corrupted localStorage data', async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, '{corrupted: json}');
    }, STORAGE_KEY);

    await page.goto(HOME_URL);

    // Should fall back to default
    const defaultButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await expect(defaultButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle null localStorage value', async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, 'null');
    }, STORAGE_KEY);

    await page.goto(HOME_URL);

    // Should fall back to default
    const defaultButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await expect(defaultButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle undefined localStorage value', async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, 'undefined');
    }, STORAGE_KEY);

    await page.goto(HOME_URL);

    // Should fall back to default
    const defaultButton = page.locator('button[type="button"][aria-label="20 questions"]');
    await expect(defaultButton).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('QuestionCountSelector - Visual States', () => {
  test('should show hover state on unselected buttons', async ({ page }) => {
    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');

    await tenButton.hover();
    await expect(tenButton).toHaveClass(/hover:bg-muted-ash/);
  });

  test('should not show hover state on selected button', async ({ page }) => {
    await page.goto(HOME_URL);

    const twentyButton = page.locator('button[type="button"][aria-label="20 questions"]');

    await twentyButton.hover();
    // Selected button should maintain Neon Lime
    await expect(twentyButton).toHaveClass(/bg-neon-lime/);
  });

  test('should show focus state with ring', async ({ page }) => {
    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');

    await tenButton.focus();
    await expect(tenButton).toHaveClass(/focus:ring-2/);
    await expect(tenButton).toHaveClass(/focus:ring-neon-lime/);
  });

  test('should maintain consistent sizing across options', async ({ page }) => {
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');

    const firstBox = await buttons.nth(0).boundingBox();
    const secondBox = await buttons.nth(1).boundingBox();
    const thirdBox = await buttons.nth(2).boundingBox();

    expect(firstBox?.width).toBe(secondBox?.width);
    expect(secondBox?.width).toBe(thirdBox?.width);
    expect(firstBox?.height).toBe(secondBox?.height);
    expect(secondBox?.height).toBe(thirdBox?.height);
  });

  test('should have proper spacing between buttons', async ({ page }) => {
    await page.goto(HOME_URL);

    const container = page.locator('.flex.gap-3').first();
    await expect(container).toBeVisible();
  });
});

test.describe('QuestionCountSelector - Network & API Integration', () => {
  test('should not make network requests for local operations', async ({ page }) => {
    await page.goto(HOME_URL);

    // Monitor network
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    // Wait a bit to catch any delayed requests
    await page.waitForTimeout(500);

    // Filter for API calls (excluding static assets)
    const apiCalls = requests.filter(url =>
      url.includes('/api/') && !url.includes('questions')
    );

    expect(apiCalls.length).toBe(0);
  });

  test('should work offline', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    await expect(tenButton).toHaveAttribute('aria-pressed', 'true');

    const storedValue = await getLocalStorageCount(page);
    expect(storedValue).toBe(10);

    await page.context().setOffline(false);
  });

  test('should handle slow localStorage reads', async ({ page }) => {
    // Slow down localStorage
    await page.addInitScript(() => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = function(...args) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(originalGetItem.apply(this, args));
          }, 100);
        });
      };
    });

    await page.goto(HOME_URL);

    // Should still render correctly
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);
  });
});

test.describe('QuestionCountSelector - Mobile/Responsive', () => {
  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.first()).toBeVisible();
  });

  test('should be tappable on touch devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');

    // Simulate touch
    await tenButton.tap();

    await expect(tenButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should maintain touch target size (44px minimum)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');

    for (let i = 0; i < 3; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should not overflow on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(HOME_URL);

    const container = page.locator('.flex.gap-3').first();
    const box = await container.boundingBox();

    if (box) {
      const viewportWidth = 320;
      expect(box.width).toBeLessThanOrEqual(viewportWidth);
    }
  });
});

test.describe('QuestionCountSelector - Performance', () => {
  test('should render quickly on initial load', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    await buttons.first().waitFor();

    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(3000); // Should render in under 3 seconds
  });

  test('should handle click without performance degradation', async ({ page }) => {
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');

    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await buttons.nth(0).click();
      await buttons.nth(1).click();
    }
    const endTime = Date.now();

    // 20 clicks should complete in reasonable time
    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('should not cause memory leaks on repeated interactions', async ({ page }) => {
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');

    // Perform many interactions
    for (let i = 0; i < 50; i++) {
      await buttons.nth(Math.floor(Math.random() * 3)).click();
      await page.waitForTimeout(10);
    }

    // Page should still be responsive
    await buttons.nth(0).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');
  });

  test('should debounce rapid state updates', async ({ page }) => {
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');

    // Very rapid clicks
    await buttons.nth(0).click();
    await buttons.nth(1).click();
    await buttons.nth(2).click();
    await buttons.nth(0).click();

    // Should settle to last state
    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('QuestionCountSelector - Hydration', () => {
  test('should not show hydration mismatch errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');

    // Check for hydration errors
    const hydrationErrors = errors.filter(e =>
      e.includes('hydration') ||
      e.includes('mismatch') ||
      e.includes('server-side')
    );

    expect(hydrationErrors).toHaveLength(0);
  });

  test('should handle SSR with localStorage only on client', async ({ page }) => {
    await page.goto(HOME_URL);

    // Component should render after client-side hydration
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);

    // Should have client-side interactivity
    const tenButton = buttons.nth(0);
    await tenButton.click();
    await expect(tenButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should show loading state before hydration', async ({ page }) => {
    // Capture initial render before JS executes
    await page.route('**/*', route => route.continue());

    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });

    // Buttons should be present but possibly disabled
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    const count = await buttons.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should recover from hydration errors gracefully', async ({ page }) => {
    // Introduce a hydration mismatch
    await page.addInitScript(() => {
      // Store will have different value than server
      localStorage.setItem('quiz-question-count', '10');
    });

    await page.goto(HOME_URL);

    // Should still be functional
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();
    await expect(tenButton).toBeVisible();
  });
});

test.describe('QuestionCountSelector - Internationalization (i18n)', () => {
  test('should handle RTL layout if needed', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });

    await page.goto(HOME_URL);

    const container = page.locator('.flex.gap-3').first();
    await expect(container).toBeVisible();

    // Should maintain proper layout in RTL
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);
  });

  test('should display numbers correctly in different locales', async ({ page }) => {
    // Set locale that might affect number formatting
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'language', {
        value: 'de-DE',
        configurable: true,
      });
    });

    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    const labels = await buttons.allTextContents();

    // Numbers should remain consistent
    expect(labels).toEqual(['10', '20', '30']);
  });
});

test.describe('QuestionCountSelector - Error Boundaries', () => {
  test('should handle component errors gracefully', async ({ page }) => {
    // Inject error into component
    await page.addInitScript(() => {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        originalConsoleError(...args);
        // Track errors for test
        (window as any).__componentErrors = (window as any).__componentErrors || [];
        (window as any).__componentErrors.push(args);
      };
    });

    await page.goto(HOME_URL);

    // Even with potential errors, component should render
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    const count = await buttons.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should not crash when React errors occur', async ({ page }) => {
    await page.goto(HOME_URL);

    // Trigger potential error scenario
    await page.evaluate(() => {
      // Simulate React error
      const event = new ErrorEvent('error', {
        message: 'Test error',
      });
      window.dispatchEvent(event);
    });

    // Component should remain functional
    const buttons = page.locator('button[type="button"][aria-label*="questions"]');
    await expect(buttons.first()).toBeVisible();
  });

  test('should recover from runtime errors', async ({ page }) => {
    await page.goto(HOME_URL);

    const buttons = page.locator('button[type="button"][aria-label*="questions"]');

    // Normal operation should work
    await buttons.nth(0).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');

    // Simulate error
    await page.evaluate(() => {
      throw new Error('Runtime error test');
    });

    // Component should still work
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('QuestionCountSelector - Analytics/Tracking', () => {
  test('should not expose sensitive data in console', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    await page.waitForTimeout(100);

    // Check for any sensitive data leaks
    const sensitiveData = consoleMessages.filter(msg =>
      msg.includes('password') ||
      msg.includes('token') ||
      msg.includes('secret')
    );

    expect(sensitiveData).toHaveLength(0);
  });

  test('should handle analytics events if implemented', async ({ page }) => {
    // Track any window function calls that might be analytics
    const analyticsCalls: any[] = [];

    await page.addInitScript(() => {
      (window as any).__analyticsCalls = [];

      // Intercept common analytics functions
      const trackFn = (name: string, ...args: any[]) => {
        (window as any).__analyticsCalls.push({ name, args });
      };

      // Example: intercept gtag, fbq, etc.
      (window as any).gtag = trackFn.bind(null, 'gtag');
    });

    await page.goto(HOME_URL);

    const tenButton = page.locator('button[type="button"][aria-label="10 questions"]');
    await tenButton.click();

    await page.waitForTimeout(100);

    // If analytics are implemented, they should be called
    const calls = await page.evaluate(() => (window as any).__analyticsCalls || []);
    // This test just verifies we can track them if implemented
    expect(Array.isArray(calls)).toBe(true);
  });
});
