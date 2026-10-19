// @vitest-environment jsdom
/**
 * Подсказки, называющие роль, при скрытых ролях не показываются: метка
 * «мой read» без title, тултип сайта у спрятанной своей роли погашен.
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@core/env", () => ({
  browser: { storage: { local: { get: vi.fn(async () => ({})), set: vi.fn(async () => {}) }, onChanged: { addListener: vi.fn(), removeListener: vi.fn() } } },
}));
vi.mock("@core/log", () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@core/toast", () => ({ showToast: vi.fn(), clearToasts: vi.fn() }));
vi.mock("@core/dom", () => ({ onDomChange: vi.fn(() => () => {}) }));

import { paintMarker } from "@content/features/role-marker";
import { rolesHidden } from "@content/roles-hidden";
import { OWN } from "@core/selectors";

function ownRole(sprite: string): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="player__role role role my-role"><svg><use href="/b.svg#${sprite}"></use></svg>` +
      `<div class="tooltip"><div class="content"><span>Ваша роль - Шериф</span></div></div></div>`,
  );
}

function marker(): HTMLElement {
  const el = document.createElement("button");
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
  document.getElementById(OWN.roleHideStyle)?.remove();
});

describe("метка «мой read» при скрытых ролях", () => {
  test("роли видны — подсказка называет роль", () => {
    ownRole("sheriff");
    const m = marker();
    paintMarker(m, "civ");
    expect(m.title).toBe("Мой read: Мирный");
  });

  test("сайт скрыл роль (#stop) — подсказки нет", () => {
    ownRole("stop");
    expect(rolesHidden()).toBe(true);
    const m = marker();
    paintMarker(m, "mafia");
    expect(m.hasAttribute("title")).toBe(false);
  });

  test("роли скрыты нашим CSS — подсказки нет", () => {
    ownRole("sheriff");
    const style = document.createElement("style");
    style.id = OWN.roleHideStyle;
    document.head.appendChild(style);
    const m = marker();
    paintMarker(m, "don");
    expect(m.hasAttribute("title")).toBe(false);
  });

  test("роли снова показаны — та же роль перерисовывается с подсказкой", () => {
    ownRole("stop");
    const m = marker();
    paintMarker(m, "sheriff");
    expect(m.hasAttribute("title")).toBe(false);
    document.querySelector("use")!.setAttribute("href", "/b.svg#sheriff");
    paintMarker(m, "sheriff");
    expect(m.title).toBe("Мой read: Шериф");
  });
});

describe("тултип сайта у скрытой роли", () => {
  test("notes.css гасит тултип внутри роли со спрайтом #stop", () => {
    const css = readFileSync("src/static/notes.css", "utf8");
    const rule = css.match(
      /\.player__role:has\(use\[href\*="#stop"\]\) \.tooltip,\s*\.player__role:has\(use\[\*\|href\*="#stop"\]\) \.tooltip\s*\{([^}]+)\}/,
    );
    expect(rule, "правило существует").not.toBeNull();
    expect(rule![1]).toMatch(/display:\s*none\s*!important/);
    ownRole("stop");
    const tip = document.querySelector<HTMLElement>(".tooltip")!;
    expect(tip.matches('.player__role:has(use[href*="#stop"]) .tooltip')).toBe(true);
    document.querySelector("use")!.setAttribute("href", "/b.svg#sheriff");
    expect(tip.matches('.player__role:has(use[href*="#stop"]) .tooltip')).toBe(false);
  });

  test("CSS-скрытие ролей гасит и тултип сайта", () => {
    const src = readFileSync("src/content/features/auto-start.ts", "utf8");
    const block = src.match(/const ROLE_HIDE_CSS = `([\s\S]*?)`;/);
    expect(block, "блок ROLE_HIDE_CSS найден").not.toBeNull();
    expect(block![1]).toMatch(/\.player__role \.tooltip\s*\{\s*display:\s*none !important;/);
  });
});
