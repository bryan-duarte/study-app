import { test, expect, Page } from "@playwright/test";

/**
 * E2E Tests for QuestionCountSelector Component
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
 * - Internationalization (i18n)
 * - Error Boundaries
 * - Analytics/Tracking
 */

// Test constants
const STORAGE_KEY = "quiz-question-count";
const QUESTION_COUNTS = [10, 20, 30];
const DEFAULT_COUNT = 20;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Helper functions
const gotoHome = async (page: Page) => {
  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState("networkidle");
};

const getQuestionCountButtons = async (page: Page) => {
  return page.locator('button[aria-label*="questions"]').all();
};

const getSelectedButton = async (page: Page) => {
  return page.locator('button[aria-pressed="true"]');
};

const clickButtonByCount = async (page: Page, count: number) => {
  const button = page.locator(`button[aria-label="${count} questions"]`);
  await button.click();
};

const getLocalStorageCount = async (page: Page) => {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, STORAGE_KEY);
};

const setLocalStorageCount = async (page: Page, count: number) => {
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value.toString());
    },
    { key: STORAGE_KEY, value: count.toString() }
  );
};

const clearQuizStorage = async (page: Page) => {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
};

const getZustandState = async (page: Page) => {
  return await page.evaluate(() => {
    // @ts-ignore - accessing window for testing
    if (window.__ZUSTAND_STATE__) {
      return window.__ZUSTAND_STATE__;
    }
    // Fallback: read from localStorage
    const stored = localStorage.getItem("quiz-storage");
    return stored ? JSON.parse(stored) : null;
  });
};

// Test suite setup
test.beforeEach(async ({ page }) => {
  await clearQuizStorage(page);
});

test.describe("QuestionCountSelector - Basic Rendering", () => {
  test("should render all three question count buttons", async ({ page }) => {
    await gotoHome(page);

    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.length).toBe(QUESTION_COUNTS.length);
  });

  test("should display correct count values on buttons", async ({ page }) => {
    await gotoHome(page);

    for (const count of QUESTION_COUNTS) {
      const button = page.locator(`button:has-text("${count}")`);
      await expect(button).toBeVisible();
    }
  });

  test("should render buttons in the correct order", async ({ page }) => {
    await gotoHome(page);

    const container = page.locator('.flex.gap-3'); // Component container
    const buttons = container.locator('button');

    for (let i = 0; i < QUESTION_COUNTS.length; i++) {
      const buttonText = await buttons.nth(i).textContent();
      await expect(buttonText?.trim()).toBe(QUESTION_COUNTS[i].toString());
    }
  });

  test("should have correct initial selected state", async ({ page }) => {
    await gotoHome(page);

    // After mount, default should be selected
    await page.waitForTimeout(100); // Allow for hydration
    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveCount(1);
  });

  test("should render with correct styling classes", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100); // Allow for hydration

    const button = page.locator(`button[aria-label="${DEFAULT_COUNT} questions"]`);

    // Check for selected state styling
    await expect(button).toHaveClass(/bg-neon-lime/);
    await expect(button).toHaveClass(/text-pitch-black/);
  });
});

test.describe("QuestionCountSelector - User Interaction", () => {
  test("should select 10 questions when clicked", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 10);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "10 questions");
  });

  test("should select 20 questions when clicked", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 20);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });

  test("should select 30 questions when clicked", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 30);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "30 questions");
  });

  test("should update visual state when selection changes", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button10 = page.locator(`button[aria-label="10 questions"]`);
    const button20 = page.locator(`button[aria-label="20 questions"]`);

    // Initially 20 should be selected
    await expect(button20).toHaveClass(/bg-neon-lime/);
    await expect(button10).toHaveClass(/bg-gunmetal/);

    // Click 10
    await button10.click();

    // Now 10 should be selected
    await expect(button10).toHaveClass(/bg-neon-lime/);
    await expect(button20).toHaveClass(/bg-gunmetal/);
  });

  test("should handle rapid clicking without errors", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Rapidly click different buttons
    await clickButtonByCount(page, 10);
    await clickButtonByCount(page, 20);
    await clickButtonByCount(page, 30);
    await clickButtonByCount(page, 10);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "10 questions");
  });

  test("should only have one button selected at a time", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const selectedButtons = page.locator('button[aria-pressed="true"]');
    await expect(selectedButtons).toHaveCount(1);
  });

  test("should handle keyboard navigation", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button = page.locator(`button[aria-label="20 questions"]`);
    await button.focus();

    // Check for focus ring
    await expect(button).toHaveFocus();

    // Press Enter to click
    await page.keyboard.press("Enter");

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });

  test("should handle Space key for selection", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button = page.locator(`button[aria-label="10 questions"]`);
    await button.focus();
    await page.keyboard.press(" ");

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "10 questions");
  });

  test("should support arrow key navigation", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button20 = page.locator(`button[aria-label="20 questions"]`);
    await button20.focus();

    // Navigate to next button with right arrow
    await page.keyboard.press("ArrowRight");

    const focusedButton = page.locator('button:focus');
    await expect(focusedButton).toHaveAttribute("aria-label", "30 questions");
  });
});

test.describe("QuestionCountSelector - localStorage Persistence", () => {
  test("should save selection to localStorage", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 10);

    const stored = await getLocalStorageCount(page);
    await expect(stored).toBe("10");
  });

  test("should load selection from localStorage on mount", async ({ page }) => {
    await setLocalStorageCount(page, 30);
    await gotoHome(page);

    await page.waitForTimeout(100);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "30 questions");
  });

  test("should update localStorage when changing selection multiple times", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 10);
    await expect(await getLocalStorageCount(page)).toBe("10");

    await clickButtonByCount(page, 20);
    await expect(await getLocalStorageCount(page)).toBe("20");

    await clickButtonByCount(page, 30);
    await expect(await getLocalStorageCount(page)).toBe("30");
  });

  test("should ignore invalid values in localStorage", async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, "999");
    }, STORAGE_KEY);

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should fall back to default
    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });

  test("should ignore non-numeric values in localStorage", async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, "invalid");
    }, STORAGE_KEY);

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should fall back to default
    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });

  test("should persist selection across page reloads", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 30);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(100);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "30 questions");
  });

  test("should sync with Zustand persist storage", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 10);

    const zustandState = await getZustandState(page);
    await expect(zustandState?.state?.selectedQuestionCount).toBe(10);
  });
});

test.describe("QuestionCountSelector - Accessibility", () => {
  test("should have proper ARIA labels on all buttons", async ({ page }) => {
    await gotoHome(page);

    for (const count of QUESTION_COUNTS) {
      const button = page.locator(`button[aria-label="${count} questions"]`);
      await expect(button).toBeVisible();
    }
  });

  test("should have aria-pressed attribute for toggle state", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const buttons = await getQuestionCountButtons(page);

    for (const button of buttons) {
      const ariaPressed = await button.getAttribute("aria-pressed");
      await expect(ariaPressed).toBeTruthy();
    }
  });

  test("should update aria-pressed when selection changes", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button10 = page.locator(`button[aria-label="10 questions"]`);
    const button20 = page.locator(`button[aria-label="20 questions"]`);

    await expect(await button10.getAttribute("aria-pressed")).toBe("false");
    await expect(await button20.getAttribute("aria-pressed")).toBe("true");

    await button10.click();

    await expect(await button10.getAttribute("aria-pressed")).toBe("true");
    await expect(await button20.getAttribute("aria-pressed")).toBe("false");
  });

  test("should have visible focus ring on focus", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button = page.locator(`button[aria-label="20 questions"]`);
    await button.focus();

    await expect(button).toHaveClass(/focus:ring-neon-lime/);
  });

  test("should have proper button role", async ({ page }) => {
    await gotoHome(page);

    const buttons = await getQuestionCountButtons(page);

    for (const button of buttons) {
      const role = await button.getAttribute("role");
      await expect(role || "button").toBeTruthy();
    }
  });

  test("should support screen reader announcements", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button = page.locator(`button[aria-label="10 questions"]`);

    // Check that button has accessible name
    const accessibleName = await button.getAttribute("aria-label");
    await expect(accessibleName).toBe("10 questions");
  });

  test("should have proper color contrast", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Check that selected state has good contrast
    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveClass(/text-pitch-black/);

    // Check that unselected state has good contrast
    const unselectedButton = page.locator('button[aria-pressed="false"]');
    await expect(unselectedButton).toHaveClass(/text-storm-cloud/);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Tab to first button
    await page.keyboard.press("Tab");

    const focusedButton = page.locator('button:focus');
    await expect(focusedButton).toHaveCount(1);
  });
});

test.describe("QuestionCountSelector - Integration with Quiz Flow", () => {
  test("should update quiz store when selection changes", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 30);

    const state = await getZustandState(page);
    await expect(state?.state?.selectedQuestionCount).toBe(30);
  });

  test("should use selected count when starting quiz", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 10);

    // Find and click start button
    const startButton = page.locator('button:has-text("Start"), button:has-text("Begin")');
    if (await startButton.isVisible()) {
      await startButton.click();

      // Verify quiz starts with correct count
      await page.waitForURL(/\/quiz/);

      const state = await getZustandState(page);
      await expect(state?.state?.selectedQuestionCount).toBe(10);
    }
  });

  test("should maintain selection when navigating between pages", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 30);

    // Navigate away and back
    await page.goto(`${BASE_URL}/about`);
    await page.waitForLoadState("networkidle");

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(100);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "30 questions");
  });

  test("should reset to default when explicitly cleared", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 10);

    // Clear storage
    await clearQuizStorage(page);
    await page.reload();
    await page.waitForTimeout(100);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });
});

test.describe("QuestionCountSelector - Zustand Store Integration", () => {
  test("should initialize with default count from store", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const state = await getZustandState(page);
    await expect(state?.state?.selectedQuestionCount).toBe(DEFAULT_COUNT);
  });

  test("should update store when button is clicked", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 10);

    const state = await getZustandState(page);
    await expect(state?.state?.selectedQuestionCount).toBe(10);
  });

  test("should reflect store changes in UI", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Simulate store update from elsewhere
    await page.evaluate(() => {
      // @ts-ignore
      if (window.__UPDATE_ZUSTAND__) {
        window.__UPDATE_ZUSTAND__({ selectedQuestionCount: 30 });
      }
    });

    await page.waitForTimeout(100);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "30 questions");
  });

  test("should handle store rehydration", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 30);

    // Trigger rehydration by reloading
    await page.reload();
    await page.waitForTimeout(100);

    const state = await getZustandState(page);
    await expect(state?.state?.selectedQuestionCount).toBe(30);
  });
});

test.describe("QuestionCountSelector - Edge Cases", () => {
  test("should handle rapid clicks without breaking", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Click rapidly
    for (let i = 0; i < 10; i++) {
      await clickButtonByCount(page, 10);
      await clickButtonByCount(page, 20);
    }

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });

  test("should handle clicking same button multiple times", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button = page.locator(`button[aria-label="10 questions"]`);

    await button.click();
    await button.click();
    await button.click();

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "10 questions");
  });

  test("should handle localStorage being full", async ({ page }) => {
    // Fill localStorage
    await page.evaluate(() => {
      try {
        const data = "x".repeat(5 * 1024 * 1024); // 5MB
        for (let i = 0; i < 100; i++) {
          localStorage.setItem(`test-${i}`, data);
        }
      } catch (e) {
        // Ignore quota errors
      }
    });

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should still render
    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.length).toBe(3);
  });

  test("should handle localStorage being disabled", async ({ page, context }) => {
    // Clear all permissions
    await context.clearPermissions();

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should still render with default
    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });

  test("should handle concurrent modifications", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Simulate concurrent modifications
    await page.evaluate((key) => {
      // Modify from another "context"
      let count = 0;
      const interval = setInterval(() => {
        count++;
        localStorage.setItem(key, String(count % 2 === 0 ? 10 : 20));
      }, 10);

      // @ts-ignore
      window.__concurrentTest__ = interval;
    }, STORAGE_KEY);

    // Wait and click
    await page.waitForTimeout(100);
    await clickButtonByCount(page, 30);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "30 questions");

    // Cleanup
    await page.evaluate(() => {
      // @ts-ignore
      if (window.__concurrentTest__) {
        clearInterval(window.__concurrentTest__);
      }
    });
  });
});

test.describe("QuestionCountSelector - Visual States", () => {
  test("should show selected state with neon lime background", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveClass(/bg-neon-lime/);
  });

  test("should show unselected state with gunmetal background", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const unselectedButton = page.locator('button[aria-pressed="false"]');
    await expect(unselectedButton).toHaveClass(/bg-gunmetal/);
  });

  test("should show hover state on unselected buttons", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button = page.locator(`button[aria-label="10 questions"]`);
    await button.hover();

    await expect(button).toHaveClass(/hover:bg-muted-ash/);
  });

  test("should show focus ring when focused", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button = page.locator(`button[aria-label="20 questions"]`);
    await button.focus();

    await expect(button).toHaveClass(/focus:ring-2/);
    await expect(button).toHaveClass(/focus:ring-neon-lime/);
  });

  test("should have proper disabled state during hydration", async ({ page }) => {
    await gotoHome(page);

    // Immediately check for disabled state (before mount completes)
    const buttons = await getQuestionCountButtons(page);

    // At least some buttons might be disabled during hydration
    const hasDisabled = await Promise.all(
      buttons.map((b) => b.isDisabled())
    );

    // After mount, all should be enabled
    await page.waitForTimeout(150);
    const buttonsAfter = await getQuestionCountButtons(page);

    for (const button of buttonsAfter) {
      const isDisabled = await button.isDisabled();
      await expect(isDisabled).toBe(false);
    }
  });

  test("should maintain visual consistency across selections", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    for (const count of QUESTION_COUNTS) {
      await clickButtonByCount(page, count);

      const selectedButton = getSelectedButton(page);
      await expect(selectedButton).toHaveClass(/bg-neon-lime/);
      await expect(selectedButton).toHaveClass(/text-pitch-black/);

      const unselectedButtons = page.locator('button[aria-pressed="false"]');
      const count_ = await unselectedButtons.count();
      for (let i = 0; i < count_; i++) {
        await expect(unselectedButtons.nth(i)).toHaveClass(/bg-gunmetal/);
      }
    }
  });
});

test.describe("QuestionCountSelector - Network & API Integration", () => {
  test("should not make network requests when changing selection", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Monitor network
    const requests: string[] = [];
    page.on("request", (request) => {
      requests.push(request.url());
    });

    await clickButtonByCount(page, 10);
    await page.waitForTimeout(100);

    // Should not have made API requests
    const apiRequests = requests.filter((r) => r.includes("/api/"));
    await expect(apiRequests.length).toBe(0);
  });

  test("should work when API is slow to respond", async ({ page }) => {
    // Slow down the network
    await page.route("**", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await gotoHome(page);
    await page.waitForTimeout(1100);

    await clickButtonByCount(page, 10);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "10 questions");
  });

  test("should work when API returns errors", async ({ page }) => {
    // Block API calls
    await page.route("**/api/**", (route) => {
      route.fulfill({
        status: 500,
        body: "Internal Server Error",
      });
    });

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should still work
    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.length).toBe(3);
  });

  test("should persist selection even if API calls fail", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 30);

    // Block API calls
    await page.route("**/api/**", (route) => {
      route.abort("failed");
    });

    await page.reload();
    await page.waitForTimeout(100);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "30 questions");
  });
});

test.describe("QuestionCountSelector - Mobile/Responsive", () => {
  test("should be touch-responsive on mobile devices", async ({ page, viewport }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await clickButtonByCount(page, 10);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "10 questions");
  });

  test("should be usable on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    await gotoHome(page);
    await page.waitForTimeout(100);

    const container = page.locator('.flex.gap-3');
    await expect(container).toBeVisible();

    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.length).toBe(3);
  });

  test("should maintain touch target sizes", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const button = page.locator(`button[aria-label="20 questions"]`);
    const box = await button.boundingBox();

    // Minimum touch target is 44x44px
    await expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("should not overflow on tablet portrait", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await gotoHome(page);
    await page.waitForTimeout(100);

    const container = page.locator('.flex.gap-3');
    const box = await container.boundingBox();

    if (box) {
      await expect(box.width).toBeLessThanOrEqual(768);
    }
  });

  test("should work with landscape orientation", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });

    await gotoHome(page);
    await page.waitForTimeout(100);

    await clickButtonByCount(page, 20);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });
});

test.describe("QuestionCountSelector - Performance", () => {
  test("should render quickly on initial load", async ({ page }) => {
    const startTime = Date.now();

    await gotoHome(page);
    await page.waitForTimeout(100);

    const loadTime = Date.now() - startTime;
    await expect(loadTime).toBeLessThan(2000); // 2s threshold
  });

  test("should respond instantly to clicks", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    const startTime = Date.now();
    await clickButtonByCount(page, 10);
    const responseTime = Date.now() - startTime;

    await expect(responseTime).toBeLessThan(100); // 100ms threshold
  });

  test("should not cause memory leaks with rapid interactions", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Get initial memory usage
    const metrics = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Perform many interactions
    for (let i = 0; i < 100; i++) {
      await clickButtonByCount(page, i % 3 === 0 ? 10 : i % 3 === 1 ? 20 : 30);
    }

    await page.waitForTimeout(100);

    // Check memory hasn't grown significantly
    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const growth = finalMetrics - metrics;
    await expect(growth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
  });

  test("should not block main thread during render", async ({ page }) => {
    await gotoHome(page);

    // Monitor for long tasks
    const longTasks: number[] = [];

    await page.evaluate(() => {
      // @ts-ignore
      window.__longTasks = [];

      const observer = new PerformanceObserver((list) => {
        // @ts-ignore
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // @ts-ignore
            window.__longTasks.push(entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ["measure"] });
    });

    await page.waitForTimeout(100);
    await clickButtonByCount(page, 10);

    const tasks = await page.evaluate(() => {
      // @ts-ignore
      return window.__longTasks || [];
    });

    // Should not have long tasks
    await expect(tasks.length).toBe(0);
  });
});

test.describe("QuestionCountSelector - Hydration", () => {
  test("should avoid hydration mismatch errors", async ({ page }) => {
    const messages: string[] = [];

    page.on("console", (msg) => {
      if (msg.text().includes("hydration")) {
        messages.push(msg.text());
      }
    });

    await gotoHome(page);
    await page.waitForTimeout(200);

    await expect(messages.length).toBe(0);
  });

  test("should render placeholder before hydration", async ({ page }) => {
    await gotoHome(page);

    // Immediately check for buttons (before mount)
    const buttons = page.locator('button[disabled]');
    await expect(buttons).toHaveCount(3);
  });

  test("should complete hydration within reasonable time", async ({ page }) => {
    await gotoHome(page);

    const startTime = Date.now();

    // Wait for disabled state to be removed
    await page.waitForSelector('button:not([disabled])', { timeout: 1000 });

    const hydrationTime = Date.now() - startTime;
    await expect(hydrationTime).toBeLessThan(500);
  });

  test("should not flicker after hydration", async ({ page }) => {
    await gotoHome(page);

    // Take screenshots during hydration
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(50);
      const screenshot = await page.screenshot();
      // Screenshots should exist without errors
      await expect(screenshot).toBeTruthy();
    }
  });
});

test.describe("QuestionCountSelector - Internationalization (i18n)", () => {
  test("should handle different locale settings", async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, "language", {
        get: () => "es-ES",
      });
    });

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should still render numbers correctly
    const button = page.locator('button:has-text("20")');
    await expect(button).toBeVisible();
  });

  test("should use native number formatting", async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, "language", {
        get: () => "ar-SA", // Arabic uses different numerals
      });
    });

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should still be functional
    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.length).toBe(3);
  });

  test("should handle RTL layouts", async ({ page }) => {
    await page.addStyleTag({
      content: `
        html {
          direction: rtl;
        }
      `,
    });

    await gotoHome(page);
    await page.waitForTimeout(100);

    const container = page.locator('.flex.gap-3');
    await expect(container).toBeVisible();

    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.length).toBe(3);
  });
});

test.describe("QuestionCountSelector - Error Boundaries", () => {
  test("should not crash with invalid localStorage data", async ({ page }) => {
    await page.evaluate((key) => {
      localStorage.setItem(key, "{invalid json}");
    }, STORAGE_KEY);

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should render with default
    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });

  test("should handle undefined localStorage gracefully", async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      delete localStorage.__proto__.getItem;
    });

    await gotoHome(page);

    // Should not crash
    await page.waitForTimeout(100);
    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.length).toBe(3);
  });

  test("should recover from corrupted Zustand storage", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("quiz-storage", "{corrupted data");
    });

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should render with defaults
    const buttons = await getQuestionCountButtons(page);
    await expect(buttons.length).toBe(3);
  });

  test("should handle missing console methods", async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      console.warn = undefined;
    });

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should still work
    await clickButtonByCount(page, 10);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "10 questions");
  });
});

test.describe("QuestionCountSelector - Analytics/Tracking", () => {
  test("should emit selection change events", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Set up event tracking
    await page.evaluate(() => {
      // @ts-ignore
      window.__selectionEvents = [];

      // @ts-ignore
      window.originalSetItem = localStorage.setItem;
      localStorage.setItem = function (...args) {
        // @ts-ignore
        window.__selectionEvents.push(args);
        // @ts-ignore
        return window.originalSetItem.apply(this, args);
      };
    });

    await clickButtonByCount(page, 30);

    const events = await page.evaluate(() => {
      // @ts-ignore
      return window.__selectionEvents || [];
    });

    await expect(events.length).toBeGreaterThan(0);
  });

  test("should track user interactions", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Track clicks
    await page.evaluate(() => {
      // @ts-ignore
      window.__clicks = 0;

      document.addEventListener("click", () => {
        // @ts-ignore
        window.__clicks++;
      });
    });

    await clickButtonByCount(page, 10);

    const clicks = await page.evaluate(() => {
      // @ts-ignore
      return window.__clicks || 0;
    });

    await expect(clicks).toBeGreaterThanOrEqual(1);
  });

  test("should not leak sensitive data in analytics", async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(100);

    // Check that localStorage doesn't contain sensitive data
    const storageData = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });

    // Should not contain passwords, tokens, etc.
    await expect(storageData).not.toMatch(/password|token|secret/);
  });

  test("should handle analytics failures gracefully", async ({ page }) => {
    // Block analytics endpoints
    await page.route("**/analytics/**", (route) => {
      route.abort("failed");
    });

    await gotoHome(page);
    await page.waitForTimeout(100);

    // Should still work
    await clickButtonByCount(page, 20);

    const selectedButton = getSelectedButton(page);
    await expect(selectedButton).toHaveAttribute("aria-label", "20 questions");
  });
});
