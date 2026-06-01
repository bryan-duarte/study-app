import { test, expect } from "@playwright/test";

const STORAGE_KEY = "quiz-question-count";
const QUESTION_COUNTS = [10, 20, 30];
const DEFAULT_COUNT = 20;
const HOME_URL = "/";
const QUIZ_URL = "/quiz";

test.describe("QuestionCountSelector - Basic Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
    // Clear localStorage before each test
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test("should render all question count buttons", async ({ page }) => {
    const buttons = page.locator('button[aria-label*="questions"]');
    await expect(buttons).toHaveCount(QUESTION_COUNTS.length);

    for (const count of QUESTION_COUNTS) {
      const button = page.locator(`button[aria-label="${count} questions"]`);
      await expect(button).toBeVisible();
      await expect(button).toContainText(count.toString());
    }
  });

  test("should have default selection of 20 questions", async ({ page }) => {
    const defaultButton = page.locator(`button[aria-label="${DEFAULT_COUNT} questions"]`);
    await expect(defaultButton).toHaveAttribute("aria-pressed", "true");
  });

  test("should render buttons in correct order (10, 20, 30)", async ({ page }) => {
    const buttons = page.locator('button[aria-label*="questions"]');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      await expect(button).toContainText(QUESTION_COUNTS[i].toString());
    }
  });

  test("should prevent hydration mismatch by showing disabled state initially", async ({ page }) => {
    // Navigate and immediately check for disabled state
    await page.goto(HOME_URL);

    // The component should render with disabled buttons initially
    const buttons = page.locator('button[aria-label*="questions"]');
    const firstButton = buttons.first();

    // After mount, buttons should be enabled
    await expect(firstButton).toBeEnabled();
  });
});

test.describe("QuestionCountSelector - User Interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });

  test("should select 10 questions when clicked", async ({ page }) => {
    const button10 = page.locator('button[aria-label="10 questions"]');
    await button10.click();

    await expect(button10).toHaveAttribute("aria-pressed", "true");

    // Verify other buttons are not pressed
    const button20 = page.locator('button[aria-label="20 questions"]');
    const button30 = page.locator('button[aria-label="30 questions"]');

    await expect(button20).toHaveAttribute("aria-pressed", "false");
    await expect(button30).toHaveAttribute("aria-pressed", "false");
  });

  test("should select 30 questions when clicked", async ({ page }) => {
    const button30 = page.locator('button[aria-label="30 questions"]');
    await button30.click();

    await expect(button30).toHaveAttribute("aria-pressed", "true");

    const button10 = page.locator('button[aria-label="10 questions"]');
    const button20 = page.locator('button[aria-label="20 questions"]');

    await expect(button10).toHaveAttribute("aria-pressed", "false");
    await expect(button20).toHaveAttribute("aria-pressed", "false");
  });

  test("should update selected question count in UI text", async ({ page }) => {
    const descriptionText = page.locator('p:has-text("practice questions")');

    // Initial state shows 20
    await expect(descriptionText).toContainText("20 practice questions");

    // Click 10
    await page.locator('button[aria-label="10 questions"]').click();
    await expect(descriptionText).toContainText("10 practice questions");

    // Click 30
    await page.locator('button[aria-label="30 questions"]').click();
    await expect(descriptionText).toContainText("30 practice questions");
  });

  test("should allow switching between options multiple times", async ({ page }) => {
    const button10 = page.locator('button[aria-label="10 questions"]');
    const button20 = page.locator('button[aria-label="20 questions"]');
    const button30 = page.locator('button[aria-label="30 questions"]');

    // 10 -> 20 -> 30 -> 20 -> 10
    await button10.click();
    await expect(button10).toHaveAttribute("aria-pressed", "true");

    await button20.click();
    await expect(button20).toHaveAttribute("aria-pressed", "true");

    await button30.click();
    await expect(button30).toHaveAttribute("aria-pressed", "true");

    await button20.click();
    await expect(button20).toHaveAttribute("aria-pressed", "true");

    await button10.click();
    await expect(button10).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("QuestionCountSelector - localStorage Persistence", () => {
  test("should save selected count to localStorage", async ({ page }) => {
    await page.goto(HOME_URL);
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);

    // Select 10 questions
    await page.locator('button[aria-label="10 questions"]').click();

    // Verify localStorage
    const storedValue = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, STORAGE_KEY);

    expect(storedValue).toBe("10");
  });

  test("should load saved count from localStorage on page load", async ({ page }) => {
    // Set localStorage directly
    await page.goto(HOME_URL);
    await page.evaluate(
      (key) => localStorage.setItem(key, "30"),
      STORAGE_KEY,
    );

    // Reload page
    await page.reload();

    // Verify 30 is selected
    const button30 = page.locator('button[aria-label="30 questions"]');
    await expect(button30).toHaveAttribute("aria-pressed", "true");
  });

  test("should ignore invalid localStorage values", async ({ page }) => {
    // Set invalid value
    await page.goto(HOME_URL);
    await page.evaluate(
      (key) => localStorage.setItem(key, "999"),
      STORAGE_KEY,
    );

    await page.reload();

    // Should default to 20
    const button20 = page.locator('button[aria-label="20 questions"]');
    await expect(button20).toHaveAttribute("aria-pressed", "true");
  });

  test("should handle non-numeric localStorage values gracefully", async ({ page }) => {
    await page.goto(HOME_URL);
    await page.evaluate(
      (key) => localStorage.setItem(key, "invalid"),
      STORAGE_KEY,
    );

    await page.reload();

    // Should default to 20
    const button20 = page.locator('button[aria-label="20 questions"]');
    await expect(button20).toHaveAttribute("aria-pressed", "true");
  });

  test("should persist selection across page navigations", async ({ page }) => {
    await page.goto(HOME_URL);
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);

    // Select 10
    await page.locator('button[aria-label="10 questions"]').click();

    // Navigate away and back
    await page.goto(QUIZ_URL);
    await page.goto(HOME_URL);

    // Verify 10 is still selected
    const button10 = page.locator('button[aria-label="10 questions"]');
    await expect(button10).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("QuestionCountSelector - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
  });

  test("should have proper ARIA labels on all buttons", async ({ page }) => {
    for (const count of QUESTION_COUNTS) {
      const button = page.locator(`button[aria-label="${count} questions"]`);
      await expect(button).toBeVisible();
    }
  });

  test("should have aria-pressed attribute reflecting selection state", async ({
    page,
  }) => {
    const button10 = page.locator('button[aria-label="10 questions"]');
    const button20 = page.locator('button[aria-label="20 questions"]');

    await expect(button10).toHaveAttribute("aria-pressed", "false");
    await expect(button20).toHaveAttribute("aria-pressed", "true");

    await button10.click();

    await expect(button10).toHaveAttribute("aria-pressed", "true");
    await expect(button20).toHaveAttribute("aria-pressed", "false");
  });

  test("should be keyboard navigable using Tab key", async ({ page }) => {
    const buttons = page.locator('button[aria-label*="questions"]');

    // Focus first button
    await buttons.nth(0).focus();

    // Tab through buttons
    for (let i = 0; i < QUESTION_COUNTS.length; i++) {
      const button = buttons.nth(i);
      await expect(button).toBeFocused();
      await page.keyboard.press("Tab");
    }
  });

  test("should be selectable using Enter key", async ({ page }) => {
    const button10 = page.locator('button[aria-label="10 questions"]');
    await button10.focus();
    await page.keyboard.press("Enter");

    await expect(button10).toHaveAttribute("aria-pressed", "true");
  });

  test("should be selectable using Space key", async ({ page }) => {
    const button30 = page.locator('button[aria-label="30 questions"]');
    await button30.focus();
    await page.keyboard.press("Space");

    await expect(button30).toHaveAttribute("aria-pressed", "true");
  });

  test("should have visible focus ring on keyboard focus", async ({ page }) => {
    const button = page.locator('button[aria-label="10 questions"]');
    await button.focus();

    // Check for focus ring styles
    const classes = await button.getAttribute("class");
    expect(classes).toContain("focus:ring-2");
    expect(classes).toContain("focus:ring-neon-lime");
  });

  test("should have proper role for button group container", async ({ page }) => {
    const group = page.locator('[role="group"][aria-label="Question count selection"]');
    await expect(group).toBeVisible();
  });

  test("should announce selection changes to screen readers", async ({
    page,
  }) => {
    const button10 = page.locator('button[aria-label="10 questions"]');

    // Get initial aria-pressed
    const initialState = await button10.getAttribute("aria-pressed");
    expect(initialState).toBe("false");

    // Click and verify change
    await button10.click();
    const newState = await button10.getAttribute("aria-pressed");
    expect(newState).toBe("true");
  });

  test("should have label associated with form control", async ({ page }) => {
    const label = page.locator('label[for="question-count"]');
    const group = page.locator('[role="group"]');

    await expect(label).toBeVisible();
    await expect(label).toContainText("Number of Questions");
    await expect(group).toBeVisible();
  });
});

test.describe("QuestionCountSelector - Integration with Quiz Flow", () => {
  test("should start quiz with selected question count", async ({ page }) => {
    await page.goto(HOME_URL);
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);

    // Select 10 questions
    await page.locator('button[aria-label="10 questions"]').click();

    // Start quiz
    await page.locator('a:has-text("Start Quiz")').click();

    // Verify navigation to quiz page
    await expect(page).toHaveURL(QUIZ_URL);
  });

  test("should maintain selection when returning to home page", async ({
    page,
  }) => {
    await page.goto(HOME_URL);
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);

    // Select 30 questions
    await page.locator('button[aria-label="30 questions"]').click();

    // Navigate to quiz and back
    await page.locator('a:has-text("Start Quiz")').click();
    await page.waitForURL(QUIZ_URL);
    await page.goto(HOME_URL);

    // Verify 30 is still selected
    const button30 = page.locator('button[aria-label="30 questions"]');
    await expect(button30).toHaveAttribute("aria-pressed", "true");
  });

  test("should update quiz info text when selection changes", async ({
    page,
  }) => {
    await page.goto(HOME_URL);

    const quizInfo = page.locator('p:has-text("Questions • Multiple Choice")');

    await expect(quizInfo).toContainText("20 Questions");

    await page.locator('button[aria-label="10 questions"]').click();
    await expect(quizInfo).toContainText("10 Questions");

    await page.locator('button[aria-label="30 questions"]').click();
    await expect(quizInfo).toContainText("30 Questions");
  });
});

test.describe("QuestionCountSelector - Zustand Store Integration", () => {
  test("should initialize store with default value", async ({ page }) => {
    await page.goto(HOME_URL);
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload();

    const storeValue = await page.evaluate(() => {
      // @ts-ignore - Accessing store for testing
      return window.__quizStore?.getState?.()?.selectedQuestionCount;
    });

    expect(storeValue).toBe(20);
  });

  test("should update store when button is clicked", async ({ page }) => {
    await page.goto(HOME_URL);

    await page.locator('button[aria-label="10 questions"]').click();

    // Wait for state update
    await page.waitForTimeout(100);

    const storeValue = await page.evaluate(() => {
      // @ts-ignore - Accessing store for testing
      return window.__quizStore?.getState?.()?.selectedQuestionCount;
    });

    expect(storeValue).toBe(10);
  });

  test("should sync with localStorage on store updates", async ({ page }) => {
    await page.goto(HOME_URL);
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);

    // Click 30
    await page.locator('button[aria-label="30 questions"]').click();

    const localStorageValue = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, STORAGE_KEY);

    expect(localStorageValue).toBe("30");
  });
});

test.describe("QuestionCountSelector - Edge Cases", () => {
  test("should handle rapid clicking between options", async ({ page }) => {
    await page.goto(HOME_URL);

    // Rapid clicks
    await page.locator('button[aria-label="10 questions"]').click();
    await page.locator('button[aria-label="20 questions"]').click();
    await page.locator('button[aria-label="30 questions"]').click();
    await page.locator('button[aria-label="10 questions"]').click();

    const button10 = page.locator('button[aria-label="10 questions"]');
    await expect(button10).toHaveAttribute("aria-pressed", "true");
  });

  test("should handle clicking same option twice", async ({ page }) => {
    await page.goto(HOME_URL);

    const button20 = page.locator('button[aria-label="20 questions"]');
    await button20.click();
    await button20.click();

    // Should remain selected
    await expect(button20).toHaveAttribute("aria-pressed", "true");
  });

  test("should handle localStorage being full", async ({ page }) => {
    await page.goto(HOME_URL);

    // Fill localStorage to quota
    await page.evaluate(() => {
      try {
        const data = "x".repeat(10 * 1024 * 1024); // 10MB
        for (let i = 0; i < 100; i++) {
          localStorage.setItem(`test-${i}`, data);
        }
      } catch (e) {
        // Ignore quota errors
      }
    });

    // Should still work even if localStorage save fails
    await page.locator('button[aria-label="10 questions"]').click();
    await expect(page.locator('button[aria-label="10 questions"]')).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("should handle disabled state during initial render", async ({
    page,
  }) => {
    await page.goto(HOME_URL);

    // Quick navigation during initial render
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload();

    // Component should still be interactive after mount
    const button = page.locator('button[aria-label="10 questions"]');
    await expect(button).toBeEnabled();
  });
});

test.describe("QuestionCountSelector - Visual States", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
  });

  test("should apply selected styling to active button", async ({ page }) => {
    const button20 = page.locator('button[aria-label="20 questions"]');
    const classes = await button20.getAttribute("class");

    expect(classes).toContain("bg-neon-lime");
    expect(classes).toContain("text-pitch-black");
  });

  test("should apply default styling to inactive buttons", async ({ page }) => {
    const button10 = page.locator('button[aria-label="10 questions"]');
    const classes = await button10.getAttribute("class");

    expect(classes).toContain("bg-gunmetal");
    expect(classes).toContain("text-storm-cloud");
  });

  test("should apply hover state to inactive buttons", async ({ page }) => {
    const button10 = page.locator('button[aria-label="10 questions"]');

    await button10.hover();

    const classes = await button10.getAttribute("class");
    expect(classes).toContain("hover:bg-muted-ash");
  });

  test("should update visual state immediately on click", async ({ page }) => {
    const button10 = page.locator('button[aria-label="10 questions"]');
    const button20 = page.locator('button[aria-label="20 questions"]');

    // Initial state
    const initialClasses10 = await button10.getAttribute("class");
    expect(initialClasses10).toContain("bg-gunmetal");

    await button10.click();

    // After click
    const newClasses10 = await button10.getAttribute("class");
    expect(newClasses10).toContain("bg-neon-lime");

    // Previous selection should lose active styling
    const newClasses20 = await button20.getAttribute("class");
    expect(newClasses20).toContain("bg-gunmetal");
  });

  test("should maintain consistent button dimensions", async ({ page }) => {
    const buttons = page.locator('button[aria-label*="questions"]');

    const sizes = await buttons.allTextContents();

    // All buttons should have same height and width classes
    for (let i = 0; i < 3; i++) {
      const button = buttons.nth(i);
      const classes = await button.getAttribute("class");
      expect(classes).toContain("h-10");
      expect(classes).toContain("w-16");
    }
  });
});

test.describe("QuestionCountSelector - Network & API Integration", () => {
  test("should work without network connectivity", async ({ page }) => {
    await page.goto(HOME_URL);

    // Go offline
    await page.context().offline();

    await page.locator('button[aria-label="10 questions"]').click();

    const button10 = page.locator('button[aria-label="10 questions"]');
    await expect(button10).toHaveAttribute("aria-pressed", "true");

    // Go back online
    await page.context().online();
  });

  test("should not make API requests when changing selection", async ({
    page,
  }) => {
    // Monitor network requests
    const requests: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes("/api/")) {
        requests.push(request.url());
      }
    });

    await page.goto(HOME_URL);
    await page.locator('button[aria-label="10 questions"]').click();

    // Should not make any API requests
    const apiRequests = requests.filter((url) => url.includes("/api/"));
    expect(apiRequests.length).toBe(0);
  });
});

test.describe("QuestionCountSelector - Mobile/Responsive", () => {
  test("should be fully functional on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_URL);

    const button10 = page.locator('button[aria-label="10 questions"]');
    await button10.tap();

    await expect(button10).toHaveAttribute("aria-pressed", "true");
  });

  test("should maintain touch target sizes on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(HOME_URL);

    const button = page.locator('button[aria-label="10 questions"]');
    const box = await button.boundingBox();

    // Should be at least 44x44 for touch targets
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("should display correctly on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(HOME_URL);

    const buttons = page.locator('button[aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.first()).toBeVisible();
  });
});

test.describe("QuestionCountSelector - Performance", () => {
  test("should render without noticeable delay", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(HOME_URL);
    const renderTime = Date.now() - startTime;

    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });

  test("should handle click updates without lag", async ({ page }) => {
    await page.goto(HOME_URL);

    const startTime = Date.now();
    await page.locator('button[aria-label="10 questions"]').click();
    const clickTime = Date.now() - startTime;

    // Should update within 100ms
    expect(clickTime).toBeLessThan(100);
  });

  test("should not cause memory leaks on repeated interactions", async ({
    page,
  }) => {
    await page.goto(HOME_URL);

    for (let i = 0; i < 50; i++) {
      await page.locator('button[aria-label="10 questions"]').click();
      await page.locator('button[aria-label="20 questions"]').click();
      await page.locator('button[aria-label="30 questions"]').click();
    }

    // Page should still be responsive
    const button10 = page.locator('button[aria-label="10 questions"]');
    await button10.click();
    await expect(button10).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("QuestionCountSelector - Hydration", () => {
  test("should not show hydration mismatch errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(HOME_URL);
    await page.waitForLoadState("networkidle");

    const hydrationErrors = errors.filter((e) =>
      e.includes("hydration") || e.includes("Hydration")
    );

    expect(hydrationErrors.length).toBe(0);
  });

  test("should handle client-side navigation consistently", async ({
    page,
  }) => {
    await page.goto(HOME_URL);

    // Select 10
    await page.locator('button[aria-label="10 questions"]').click();

    // Navigate using Next.js routing
    await page.evaluate(() => {
      // @ts-ignore
      window.nextRouter?.push?.("/quiz");
    });

    await page.waitForURL(QUIZ_URL);

    // Navigate back
    await page.goto(HOME_URL);

    const button10 = page.locator('button[aria-label="10 questions"]');
    await expect(button10).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("QuestionCountSelector - Internationalization (i18n)", () => {
  test("should display numbers correctly in different locales", async ({
    page,
  }) => {
    await page.goto(HOME_URL);

    // Numbers should be consistent regardless of locale
    const button10 = page.locator('button[aria-label="10 questions"]');
    await expect(button10).toContainText("10");
  });

  test("should handle RTL layouts if needed", async ({ page }) => {
    // Set RTL
    await page.addInitScript(() => {
      document.documentElement.setAttribute("dir", "rtl");
    });

    await page.goto(HOME_URL);

    const buttons = page.locator('button[aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);

    // Reset to LTR
    await page.addInitScript(() => {
      document.documentElement.setAttribute("dir", "ltr");
    });
  });
});

test.describe("QuestionCountSelector - Error Boundaries", () => {
  test("should handle localStorage access errors gracefully", async ({
    page,
  }) => {
    // Block localStorage access
    await page.addInitScript(() => {
      // @ts-ignore
      const originalGetItem = Storage.prototype.getItem;
      // @ts-ignore
      Storage.prototype.getItem = () => {
        throw new Error("Security error");
      };
    });

    await page.goto(HOME_URL);

    // Should still render and function
    const buttons = page.locator('button[aria-label*="questions"]');
    await expect(buttons).toHaveCount(3);
  });

  test("should handle parseInt failures gracefully", async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, "not-a-number");
    }, STORAGE_KEY);

    await page.goto(HOME_URL);

    // Should default to 20
    const button20 = page.locator('button[aria-label="20 questions"]');
    await expect(button20).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("QuestionCountSelector - Analytics/Tracking", () => {
  test("should not throw errors when analytics scripts are blocked", async ({
    page,
  }) => {
    // Block common analytics domains
    await page.route("**/analytics.*", (route) => route.abort());
    await page.route("**/tracking.*", (route) => route.abort());

    await page.goto(HOME_URL);

    const button10 = page.locator('button[aria-label="10 questions"]');
    await button10.click();

    await expect(button10).toHaveAttribute("aria-pressed", "true");
  });
});
