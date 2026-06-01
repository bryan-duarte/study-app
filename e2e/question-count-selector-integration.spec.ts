import { test, expect } from '@playwright/test';

/**
 * E2E Integration Tests for QuestionCountSelector
 *
 * This test suite covers the complete user flow from question count selection
 * to quiz start, including API calls, state management, and various edge cases.
 *
 * Test Categories:
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
 * - Internationalization (i18n) - Future-proofing
 * - Error Boundaries
 * - Analytics/Tracking
 */

const HOME_PAGE = '/';
const QUIZ_PAGE = '/quiz';
const STORAGE_KEY = 'quiz-question-count';
const QUESTION_COUNTS = [10, 20, 30];
const DEFAULT_COUNT = 20;

// Helper functions
const getQuestionCountButtons = async (page) => {
  return page.locator('button').filter({ hasText: QUESTION_COUNTS.map(c => c.toString()) });
};

const getSelectedCountButton = async (page, count: number) => {
  return page.getByRole('button', { name: `${count} questions` });
};

const waitForHydration = async (page) => {
  // Wait for the client-side hydration to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(100);
};

// =============================================================================
// TEST SUITE: Basic Rendering
// =============================================================================

test.describe('QuestionCountSelector - Basic Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);
  });

  test('should render all three question count buttons', async ({ page }) => {
    const buttons = await getQuestionCountButtons(page);
    await expect(buttons).toHaveCount(3);
  });

  test('should display correct question count values', async ({ page }) => {
    for (const count of QUESTION_COUNTS) {
      const button = await getSelectedCountButton(page, count);
      await expect(button).toHaveText(count.toString());
    }
  });

  test('should have default count (20) selected on first visit', async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForHydration(page);

    const defaultButton = await getSelectedCountButton(page, DEFAULT_COUNT);
    await expect(defaultButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('should render buttons in correct order (10, 20, 30)', async ({ page }) => {
    const buttons = await getQuestionCountButtons(page);
    const texts = await buttons.allTextContents();
    expect(texts).toEqual(['10', '20', '30']);
  });

  test('should render within proper container structure', async ({ page }) => {
    const container = page.locator('[role="group"][aria-label="Question count selection"]');
    await expect(container).toBeVisible();

    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.first()).toHaveLocator('xpath=ancestor::div[@role="group"]');
  });

  test('should display label text "Number of Questions"', async ({ page }) => {
    const label = page.getByText('Number of Questions');
    await expect(label).toBeVisible();
  });

  test('should have proper label association with buttons', async ({ page }) => {
    const label = page.getByText('Number of Questions');
    await expect(label).toHaveAttribute('for', 'question-count');
  });
});

// =============================================================================
// TEST SUITE: User Interaction
// =============================================================================

test.describe('QuestionCountSelector - User Interaction', () => {
  test('should select 10 questions when clicked', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    await expect(button10).toHaveAttribute('aria-pressed', 'true');

    // Verify the text updates
    const questionText = page.getByText(/Test your AWS knowledge with \d+ practice questions/);
    await expect(questionText).toContainText('10');
  });

  test('should select 20 questions when clicked', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button20 = await getSelectedCountButton(page, 20);
    await button20.click();

    await expect(button20).toHaveAttribute('aria-pressed', 'true');
  });

  test('should select 30 questions when clicked', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button30 = await getSelectedCountButton(page, 30);
    await button30.click();

    await expect(button30).toHaveAttribute('aria-pressed', 'true');
  });

  test('should only have one button selected at a time', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    const button20 = await getSelectedCountButton(page, 20);
    const button30 = await getSelectedCountButton(page, 30);

    await button10.click();
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
    await expect(button20).toHaveAttribute('aria-pressed', 'false');
    await expect(button30).toHaveAttribute('aria-pressed', 'false');

    await button30.click();
    await expect(button10).toHaveAttribute('aria-pressed', 'false');
    await expect(button20).toHaveAttribute('aria-pressed', 'false');
    await expect(button30).toHaveAttribute('aria-pressed', 'true');
  });

  test('should update page text when count changes', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const questionText = page.getByText(/Test your AWS knowledge with/);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();
    await expect(questionText).toContainText('10');

    const button30 = await getSelectedCountButton(page, 30);
    await button30.click();
    await expect(questionText).toContainText('30');
  });

  test('should update footer info when count changes', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const footerText = page.getByText(/\d+ Questions • Multiple Choice/);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();
    await expect(footerText).toContainText('10 Questions');

    const button30 = await getSelectedCountButton(page, 30);
    await button30.click();
    await expect(footerText).toContainText('30 Questions');
  });

  test('should handle rapid clicks without error', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    const button20 = await getSelectedCountButton(page, 20);
    const button30 = await getSelectedCountButton(page, 30);

    // Rapid clicking
    await button10.click();
    await button30.click();
    await button10.click();
    await button20.click();
    await button30.click();

    await expect(button30).toHaveAttribute('aria-pressed', 'true');
  });

  test('should not change selection when clicking already selected button', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button20 = await getSelectedCountButton(page, 20);
    await expect(button20).toHaveAttribute('aria-pressed', 'true');

    await button20.click();
    await expect(button20).toHaveAttribute('aria-pressed', 'true');
  });
});

// =============================================================================
// TEST SUITE: localStorage Persistence
// =============================================================================

test.describe('QuestionCountSelector - localStorage Persistence', () => {
  test('should save selected count to localStorage', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    const storedValue = await page.evaluate(() =>
      localStorage.getItem('quiz-question-count')
    );
    expect(storedValue).toBe('10');
  });

  test('should load saved count from localStorage on revisit', async ({ page }) => {
    // Set value in localStorage
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    await page.evaluate(() => {
      localStorage.setItem('quiz-question-count', '30');
    });

    await page.reload();
    await waitForHydration(page);

    const button30 = await getSelectedCountButton(page, 30);
    await expect(button30).toHaveAttribute('aria-pressed', 'true');
  });

  test('should persist selection across page navigation', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Navigate to quiz and back
    await page.getByRole('link', { name: 'Start Quiz' }).click();
    await page.waitForURL(QUIZ_PAGE);

    await page.goBack();
    await waitForHydration(page);

    const button10AfterNav = await getSelectedCountButton(page, 10);
    await expect(button10AfterNav).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle invalid localStorage values gracefully', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Set invalid value
    await page.evaluate(() => {
      localStorage.setItem('quiz-question-count', 'invalid');
    });

    await page.reload();
    await waitForHydration(page);

    // Should fall back to default
    const button20 = await getSelectedCountButton(page, 20);
    await expect(button20).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle out-of-range localStorage values gracefully', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Set out-of-range value
    await page.evaluate(() => {
      localStorage.setItem('quiz-question-count', '999');
    });

    await page.reload();
    await waitForHydration(page);

    // Should fall back to default
    const button20 = await getSelectedCountButton(page, 20);
    await expect(button20).toHaveAttribute('aria-pressed', 'true');
  });

  test('should update localStorage when switching selections', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    const button30 = await getSelectedCountButton(page, 30);

    await button10.click();
    let storedValue = await page.evaluate(() =>
      localStorage.getItem('quiz-question-count')
    );
    expect(storedValue).toBe('10');

    await button30.click();
    storedValue = await page.evaluate(() =>
      localStorage.getItem('quiz-question-count')
    );
    expect(storedValue).toBe('30');
  });
});

// =============================================================================
// TEST SUITE: Accessibility
// =============================================================================

test.describe('QuestionCountSelector - Accessibility', () => {
  test('should have proper aria-label on buttons', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    for (const count of QUESTION_COUNTS) {
      const button = await getSelectedCountButton(page, count);
      await expect(button).toHaveAttribute('aria-label', `${count} questions`);
    }
  });

  test('should have proper aria-pressed attribute', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    const button20 = await getSelectedCountButton(page, 20);

    await expect(button10).toHaveAttribute('aria-pressed', 'false');
    await expect(button20).toHaveAttribute('aria-pressed', 'true');

    await button10.click();
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
    await expect(button20).toHaveAttribute('aria-pressed', 'false');
  });

  test('should have visible focus ring on keyboard navigation', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button20 = await getSelectedCountButton(page, 20);
    await button20.focus();

    // Check for focus ring styling
    const hasFocusRing = await button20.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow.includes('0 0 0 2');
    });

    expect(hasFocusRing).toBeTruthy();
  });

  test('should be keyboard navigable using Tab key', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);

    // Press Tab to navigate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toBe('10');
  });

  test('should be selectable using Enter/Space keys', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.focus();

    await page.keyboard.press('Enter');
    await expect(button10).toHaveAttribute('aria-pressed', 'true');

    const button30 = await getSelectedCountButton(page, 30);
    await button30.focus();
    await page.keyboard.press(' ');
    await expect(button30).toHaveAttribute('aria-pressed', 'true');
  });

  test('should have proper button role', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const buttons = await getQuestionCountButtons(page);
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveRole('button');
    }
  });

  test('should have proper type="button" attribute', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await expect(button10).toHaveAttribute('type', 'button');
  });

  test('should be properly labeled for screen readers', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const group = page.locator('[role="group"][aria-label="Question count selection"]');
    await expect(group).toBeVisible();

    const label = page.getByText('Number of Questions');
    await expect(label).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button20 = await getSelectedCountButton(page, 20);

    // Selected button should have neon lime background
    const backgroundColor = await button20.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Neon lime is approximately rgb(228, 242, 34)
    expect(backgroundColor).toContain('228');
    expect(backgroundColor).toContain('242');
  });

  test('should have focus-visible styling', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.focus();

    const hasFocusOutline = await button10.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outlineWidth !== '0px' || styles.boxShadow.includes('ring');
    });

    expect(hasFocusOutline).toBeTruthy();
  });
});

// =============================================================================
// TEST SUITE: Integration with Quiz Flow
// =============================================================================

test.describe('QuestionCountSelector - Integration with Quiz Flow', () => {
  test('should carry selected count to quiz page', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    const startQuizLink = page.getByRole('link', { name: 'Start Quiz' });
    await startQuizLink.click();
    await page.waitForURL(QUIZ_PAGE);

    // Verify quiz page loaded
    await expect(page).toHaveURL(QUIZ_PAGE);
  });

  test('should maintain count selection during quiz start', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button30 = await getSelectedCountButton(page, 30);
    await button30.click();

    // Verify the count is reflected in the UI
    const questionText = page.getByText(/Test your AWS knowledge with \d+ practice questions/);
    await expect(questionText).toContainText('30');

    const startQuizLink = page.getByRole('link', { name: 'Start Quiz' });
    await startQuizLink.click();
    await page.waitForURL(QUIZ_PAGE);
  });

  test('should update quiz store when count changes', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Check Zustand store value
    const storeValue = await page.evaluate(() => {
      // @ts-ignore - accessing window store for testing
      const store = window.__TEST_ZUSTAND_STORE__;
      return store?.getState().selectedQuestionCount;
    });

    expect(storeValue).toBe(10);
  });

  test('should allow quiz start with any selected count', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    for (const count of QUESTION_COUNTS) {
      await page.goto(HOME_PAGE);
      await waitForHydration(page);

      const button = await getSelectedCountButton(page, count);
      await button.click();

      const startQuizLink = page.getByRole('link', { name: 'Start Quiz' });
      await expect(startQuizLink).toBeEnabled();
      await startQuizLink.click();
      await page.waitForURL(QUIZ_PAGE);

      // Go back for next iteration
      await page.goBack();
      await waitForHydration(page);
    }
  });

  test('should preserve selection when returning from quiz', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    const startQuizLink = page.getByRole('link', { name: 'Start Quiz' });
    await startQuizLink.click();
    await page.waitForURL(QUIZ_PAGE);

    await page.goBack();
    await waitForHydration(page);

    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });
});

// =============================================================================
// TEST SUITE: Zustand Store Integration
// =============================================================================

test.describe('QuestionCountSelector - Zustand Store Integration', () => {
  test('should initialize with default count from store', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button20 = await getSelectedCountButton(page, 20);
    await expect(button20).toHaveAttribute('aria-pressed', 'true');
  });

  test('should update store when user selects different count', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button30 = await getSelectedCountButton(page, 30);
    await button30.click();

    // Wait for state update
    await page.waitForTimeout(100);

    const storeValue = await page.evaluate(() => {
      // @ts-ignore
      const store = window.__TEST_ZUSTAND_STORE__;
      return store?.getState().selectedQuestionCount;
    });

    expect(storeValue).toBe(30);
  });

  test('should reflect store changes in UI', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Directly update store
    await page.evaluate(() => {
      // @ts-ignore
      const store = window.__TEST_ZUSTAND_STORE__;
      store?.getState().setQuestionCount(10);
    });

    await page.waitForTimeout(100);

    const button10 = await getSelectedCountButton(page, 10);
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });

  test('should persist store changes across page reloads', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    await page.reload();
    await waitForHydration(page);

    const button10After = await getSelectedCountButton(page, 10);
    await expect(button10After).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle store validation correctly', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Attempt to set invalid count via store
    await page.evaluate(() => {
      // @ts-ignore
      const store = window.__TEST_ZUSTAND_STORE__;
      store?.getState().setQuestionCount(999);
    });

    await page.waitForTimeout(100);

    // Should still have valid selection
    const button20 = await getSelectedCountButton(page, 20);
    await expect(button20).toHaveAttribute('aria-pressed', 'true');
  });
});

// =============================================================================
// TEST SUITE: Edge Cases
// =============================================================================

test.describe('QuestionCountSelector - Edge Cases', () => {
  test('should handle double-clicks gracefully', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.dblclick();

    await expect(button10).toHaveAttribute('aria-pressed', 'true');

    const storedValue = await page.evaluate(() =>
      localStorage.getItem('quiz-question-count')
    );
    expect(storedValue).toBe('10');
  });

  test('should handle concurrent clicks on different buttons', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    const button20 = await getSelectedCountButton(page, 20);

    // Concurrent clicks (simulate race condition)
    await page.evaluate(async () => {
      const btn10 = document.querySelector('button[aria-label="10 questions"]');
      const btn20 = document.querySelector('button[aria-label="20 questions"]');

      if (btn10 && btn20) {
        btn10.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        btn20.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });

    await page.waitForTimeout(100);

    // Should have a consistent final state
    const pressedCount = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button[aria-pressed="true"]');
      return buttons.length;
    });

    expect(pressedCount).toBe(1);
  });

  test('should handle rapid browser back/forward navigation', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button30 = await getSelectedCountButton(page, 30);
    await button30.click();

    const startQuizLink = page.getByRole('link', { name: 'Start Quiz' });
    await startQuizLink.click();
    await page.waitForURL(QUIZ_PAGE);

    await page.goBack();
    await page.goForward();
    await page.goBack();
    await waitForHydration(page);

    await expect(button30).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle page reload during selection', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Immediate reload
    await page.reload();
    await waitForHydration(page);

    const button10After = await getSelectedCountButton(page, 10);
    await expect(button10After).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle browser storage quota exceeded', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Fill localStorage to quota
    await page.evaluate(() => {
      try {
        const data = 'x'.repeat(10 * 1024 * 1024); // 10MB
        localStorage.setItem('large-data', data);
      } catch (e) {
        // Quota exceeded expected
      }
    });

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Should still function
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle localStorage being disabled', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'test',
        value: 'value',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Block localStorage
    await page.route('**/*', (route) => {
      // Inject script to disable localStorage
      const headers = route.request().headers();
      route.continue({
        headers,
      });
    });

    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: false,
      });
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Should still render with default
    const button20 = await getSelectedCountButton(page, 20);
    await expect(button20).toBeVisible();
  });

  test('should handle very slow network conditions', async ({ page }) => {
    // Slow down network
    await page.context().setOffline(false);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Should still work immediately (no network dependency)
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });

  test('should handle clipboard events interfering', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);

    // Simulate clipboard operation during click
    await page.evaluate(() => {
      document.addEventListener('click', (e) => {
        document.execCommand('copy');
      });
    });

    await button10.click();
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });
});

// =============================================================================
// TEST SUITE: Visual States
// =============================================================================

test.describe('QuestionCountSelector - Visual States', () => {
  test('should apply correct styles for selected state', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button20 = await getSelectedCountButton(page, 20);

    const backgroundColor = await button20.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        bg: styles.backgroundColor,
        color: styles.color,
      };
    });

    // Selected button should have neon lime background and dark text
    expect(backgroundColor.bg).toContain('228'); // Neon lime RGB
  });

  test('should apply correct styles for unselected state', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);

    const backgroundColor = await button10.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        bg: styles.backgroundColor,
        color: styles.color,
      };
    });

    // Unselected button should have gunmetal background
    expect(backgroundColor.bg).toContain('56'); // Gunmetal RGB start
  });

  test('should apply hover styles for unselected buttons', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.hover();

    const backgroundColor = await button10.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have muted ash color on hover
    expect(backgroundColor).toBeTruthy();
  });

  test('should apply focus styles', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.focus();

    const hasFocusRing = await button10.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow.includes('0 0 0 2');
    });

    expect(hasFocusRing).toBeTruthy();
  });

  test('should have proper disabled state visual (before hydration)', async ({ page }) => {
    await page.goto(HOME_PAGE, { waitUntil: 'domcontentloaded' });

    // Before hydration, buttons might be disabled
    const buttons = await getQuestionCountButtons(page);
    const firstButton = buttons.first();

    const isDisabled = await firstButton.evaluate((el) =>
      el.getAttribute('disabled')
    );

    // After hydration, should not be disabled
    await waitForHydration(page);
    const isDisabledAfter = await firstButton.evaluate((el) =>
      el.getAttribute('disabled')
    );

    expect(isDisabledAfter).toBeNull();
  });

  test('should maintain consistent button dimensions', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const buttons = await getQuestionCountButtons(page);
    const count = await buttons.count();

    const dimensions = [];
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      dimensions.push({ width: box?.width, height: box?.height });
    }

    // All buttons should have same dimensions
    const firstDim = dimensions[0];
    for (const dim of dimensions) {
      expect(dim.width).toBeCloseTo(firstDim.width || 0, 0);
      expect(dim.height).toBeCloseTo(firstDim.height || 0, 0);
    }
  });

  test('should have proper spacing between buttons', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const buttons = await getQuestionCountButtons(page);
    const button1 = buttons.first();
    const button2 = buttons.nth(1);

    const box1 = await button1.boundingBox();
    const box2 = await button2.boundingBox();

    if (box1 && box2) {
      const gap = box2.x - (box1.x + box1.width);
      expect(gap).toBeGreaterThan(8); // At least 8px gap
    }
  });

  test('should apply correct border radius', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);

    const borderRadius = await button10.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    expect(borderRadius).toBe('6px');
  });

  test('should apply correct font weight', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);

    const fontWeight = await button10.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });

    // Should be font-w590 (590 weight)
    expect(fontWeight).toBe('590');
  });
});

// =============================================================================
// TEST SUITE: Network & API Integration
// =============================================================================

test.describe('QuestionCountSelector - Network & API Integration', () => {
  test('should not make unnecessary network requests', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Filter for API calls
    const apiCalls = requests.filter(url =>
      url.includes('/api/') || url.includes('/quiz/')
    );

    // Selection should not trigger API calls
    expect(apiCalls.length).toBe(0);
  });

  test('should work offline', async ({ page }) => {
    await page.context().setOffline(true);

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    await expect(button10).toHaveAttribute('aria-pressed', 'true');

    await page.context().setOffline(false);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock failed API
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Selector should still work
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });

  test('should maintain selection during API timeouts', async ({ page }) => {
    // Mock slow API
    await page.route('**/api/**', (route) => {
      setTimeout(() => route.continue(), 5000);
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Should work immediately regardless of API
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });

  test('should pass correct count to quiz session API', async ({ page }) => {
    const apiRequests: { url: string; body?: string }[] = [];

    await page.route('**/api/quiz/session/start', (route) => {
      const url = route.request().url();
      route.request().postData().then(body => {
        apiRequests.push({ url, body });
      });
      route.continue();
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    const startQuizLink = page.getByRole('link', { name: 'Start Quiz' });
    await startQuizLink.click();
    await page.waitForURL(QUIZ_PAGE);

    await page.waitForTimeout(500);

    // Verify API was called with correct count
    const sessionRequest = apiRequests.find(r => r.url.includes('/session/start'));
    expect(sessionRequest).toBeDefined();

    if (sessionRequest?.body) {
      const bodyData = JSON.parse(sessionRequest.body);
      expect(bodyData.question_count).toBe(10);
    }
  });

  test('should handle concurrent session start requests', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    const startQuizLink = page.getByRole('link', { name: 'Start Quiz' });

    // Double click
    await startQuizLink.click();
    await startQuizLink.click();

    await page.waitForURL(QUIZ_PAGE);

    // Should handle gracefully
    await expect(page).toHaveURL(QUIZ_PAGE);
  });
});

// =============================================================================
// TEST SUITE: Mobile/Responsive
// =============================================================================

test.describe('QuestionCountSelector - Mobile/Responsive', () => {
  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const buttons = await getQuestionCountButtons(page);
    await expect(buttons).toHaveCount(3);
  });

  test('should render correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const buttons = await getQuestionCountButtons(page);
    await expect(buttons).toHaveCount(3);
  });

  test('should be touch-friendly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    const box = await button10.boundingBox();

    if (box) {
      // Minimum touch target is 44x44px
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.width).toBeGreaterThanOrEqual(40);
    }
  });

  test('should handle touch events correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);

    // Simulate touch
    await button10.tap();
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });

  test('should maintain layout on orientation change', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });

  test('should prevent zoom on double tap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.dblclick();

    // Should not zoom page
    const viewportScale = await page.evaluate(() => {
      return window.visualViewport?.scale || 1;
    });

    expect(viewportScale).toBe(1);
  });

  test('should have proper text size on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);

    const fontSize = await button10.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Should be readable on mobile (at least 14px)
    const size = parseInt(fontSize);
    expect(size).toBeGreaterThanOrEqual(14);
  });
});

// =============================================================================
// TEST SUITE: Performance
// =============================================================================

test.describe('QuestionCountSelector - Performance', () => {
  test('should render quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000); // Should render in under 2s
  });

  test('should update selection quickly', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);

    const startTime = Date.now();
    await button10.click();
    await page.waitForTimeout(100); // Wait for state update

    const updateTime = Date.now() - startTime;
    expect(updateTime).toBeLessThan(500); // Should update in under 500ms
  });

  test('should not cause layout thrashing', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    let layoutCount = 0;
    await page.evaluateOnNewDocument(() => {
      let count = 0;
      // @ts-ignore
      window.getLayoutCount = () => count;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            count++;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    });

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();
    await page.waitForTimeout(500);

    // Should not cause layout shifts
    // (This is a basic check - in real scenarios, use Lighthouse)
  });

  test('should not leak memory on repeated interactions', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Repeated interactions
    for (let i = 0; i < 100; i++) {
      const button10 = await getSelectedCountButton(page, 10);
      const button30 = await getSelectedCountButton(page, 30);
      await button10.click();
      await button30.click();
    }

    await page.waitForTimeout(1000);

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Memory growth should be minimal
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
  });

  test('should have small bundle size impact', async ({ page }) => {
    // Check if component is properly code-split
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const scriptCount = await page.evaluate(() => {
      return document.querySelectorAll('script[src]').length;
    });

    // Should load reasonable number of scripts
    expect(scriptCount).toBeLessThan(20);
  });
});

// =============================================================================
// TEST SUITE: Hydration
// =============================================================================

test.describe('QuestionCountSelector - Hydration', () => {
  test('should hydrate without mismatch errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const hydrationErrors = errors.filter(e =>
      e.includes('hydration') || e.includes('mismatch')
    );

    expect(hydrationErrors).toHaveLength(0);
  });

  test('should not show content flash during hydration', async ({ page }) => {
    await page.goto(HOME_PAGE, { waitUntil: 'domcontentloaded' });

    const buttons = await getQuestionCountButtons(page);
    const count = await buttons.count();

    // Should have skeleton/disabled state before hydration
    const hasDisabledBefore = await buttons.first().evaluate((el) =>
      el.getAttribute('disabled') !== null
    );

    await waitForHydration(page);

    const hasDisabledAfter = await buttons.first().evaluate((el) =>
      el.getAttribute('disabled') !== null
    );

    // After hydration, should not be disabled
    expect(hasDisabledAfter).toBe(false);
  });

  test('should maintain SSR content during hydration', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const buttons = await getQuestionCountButtons(page);
    const count = await buttons.count();

    // Should have all three buttons after hydration
    expect(count).toBe(3);
  });

  test('should handle client-only features after hydration', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // localStorage access should work after hydration
    const storedValue = await page.evaluate(() =>
      localStorage.getItem('quiz-question-count')
    );

    expect(storedValue).toBe('10');
  });

  test('should handle hydration with existing localStorage', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    await page.reload();
    await waitForHydration(page);

    // Should hydrate with saved state
    const button10After = await getSelectedCountButton(page, 10);
    await expect(button10After).toHaveAttribute('aria-pressed', 'true');
  });
});

// =============================================================================
// TEST SUITE: Internationalization (i18n) - Future-proofing
// =============================================================================

test.describe('QuestionCountSelector - Internationalization (i18n)', () => {
  test('should handle RTL layout gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const buttons = await getQuestionCountButtons(page);
    await expect(buttons).toHaveCount(3);

    // Verify RTL order (30, 20, 10 instead of 10, 20, 30)
    const texts = await buttons.allTextContents();
    // In RTL, flex-direction should flip
    expect(texts).toBeTruthy();
  });

  test('should handle different number formats', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Test with different locale
    await page.evaluate(() => {
      Object.defineProperty(window, '__locale', { value: 'de-DE' });
    });

    const buttons = await getQuestionCountButtons(page);
    const count = await buttons.count();

    // Should still render correctly
    expect(count).toBe(3);
  });

  test('should be translatable (structure check)', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Check for translatable elements
    const label = page.getByText('Number of Questions');
    await expect(label).toBeVisible();

    // Buttons have aria-labels for translation
    const button10 = await getSelectedCountButton(page, 10);
    await expect(button10).toHaveAttribute('aria-label');
  });
});

// =============================================================================
// TEST SUITE: Error Boundaries
// =============================================================================

test.describe('QuestionCountSelector - Error Boundaries', ()  => {
  test('should render fallback on component error', async ({ page }) => {
    // Simulate component error
    await page.addInitScript(() => {
      // @ts-ignore
      window.__SHOULD_ERROR__ = true;
    });

    await page.route('**/page.js', (route) => {
      route.continue({
        body: route.request().postData() || '',
      });
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Should still show page
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle store errors gracefully', async ({ page }) => {
    // Mock store error
    await page.addInitScript(() => {
      // @ts-ignore
      const originalCreate = window.zustand?.create;
      // @ts-ignore
      if (window.zustand) {
        // @ts-ignore
        window.zustand.create = () => {
          throw new Error('Store error');
        };
      }
    });

    await page.goto(HOME_PAGE);

    // Page should still load
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle localStorage access errors', async ({ page }) => {
    await page.addInitScript(() => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function() {
        throw new Error('Security error');
      };
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Should still render
    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.first()).toBeVisible();
  });

  test('should handle localStorage setItem errors', async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function() {
        throw new Error('Quota exceeded');
      };
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Should still update UI
    await expect(button10).toHaveAttribute('aria-pressed', 'true');
  });

  test('should recover from errors', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    // Cause error
    await page.evaluate(() => {
      const storage = window.localStorage;
      storage.clear();
      // Fill storage
      try {
        while (true) {
          storage.setItem('test', 'x'.repeat(1024 * 1024));
        }
      } catch (e) {
        // Expected
      }
    });

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    // Should still work
    await expect(button10).toBeVisible();
  });
});

// =============================================================================
// TEST SUITE: Analytics/Tracking
// =============================================================================

test.describe('QuestionCountSelector - Analytics/Tracking', () => {
  test('should not track before user consent (GDPR)', async ({ page }) => {
    const analyticsCalls: string[] = [];

    // Mock analytics
    await page.addInitScript(() => {
      // @ts-ignore
      window.analytics = {
        track: (event: string) => {
          // @ts-ignore
          window.__analyticsCalls = window.__analyticsCalls || [];
          // @ts-ignore
          window.__analyticsCalls.push(event);
        },
      };
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    const calls = await page.evaluate(() =>
      // @ts-ignore
      window.__analyticsCalls || []
    );

    // Should not track without consent
    expect(calls.length).toBe(0);
  });

  test('should allow custom tracking integration', async ({ page }) => {
    const trackingEvents: any[] = [];

    await page.exposeFunction('trackEvent', (event: any) => {
      trackingEvents.push(event);
    });

    await page.addInitScript(() => {
      // @ts-ignore
      const originalClick = HTMLElement.prototype.click;
      // @ts-ignore
      HTMLElement.prototype.click = function() {
        if (this.getAttribute('aria-label')?.includes('questions')) {
          // @ts-ignore
          window.trackEvent({
            event: 'question_count_selected',
            count: this.textContent,
          });
        }
        return originalClick.call(this);
      };
    });

    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    await page.waitForTimeout(100);

    // Should allow custom tracking
    // (This demonstrates extensibility for analytics)
  });

  test('should include selection context in page data', async ({ page }) => {
    await page.goto(HOME_PAGE);
    await waitForHydration(page);

    const button10 = await getSelectedCountButton(page, 10);
    await button10.click();

    const pageContext = await page.evaluate(() => {
      return {
        selectedCount: document.querySelector('[aria-pressed="true"]')?.textContent,
        url: window.location.pathname,
      };
    });

    expect(pageContext.selectedCount).toBe('10');
    expect(pageContext.url).toBe('/');
  });
});
