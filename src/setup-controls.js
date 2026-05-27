const LANGUAGE_ITEMS = [
  { value: "ja", flag: "🇯🇵", label: "日本語" },
  { value: "en", flag: "🇺🇸", label: "English" },
  { value: "fr", flag: "🇫🇷", label: "Français" },
  { value: "es", flag: "🇪🇸", label: "Español" },
  { value: "de", flag: "🇩🇪", label: "Deutsch" },
  { value: "ko", flag: "🇰🇷", label: "한국어" },
  { value: "zh", flag: "🇨🇳", label: "中文" },
];

const SEGMENTED_SELECTS = [
  "#playerCountSelect",
  "#boardSizeSelect",
  "#winModeSelect",
];

function dispatchNativeChange(select) {
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function buildLanguageDock() {
  const select = document.querySelector("#languageSelect");
  const shell = document.querySelector(".app-shell");
  if (!select || !shell || document.querySelector("#languageDock")) return;

  const dock = document.createElement("nav");
  dock.id = "languageDock";
  dock.className = "language-dock";
  dock.setAttribute("aria-label", "Language");

  for (const item of LANGUAGE_ITEMS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "language-pill";
    button.dataset.value = item.value;
    button.innerHTML = `<span class="language-flag" aria-hidden="true">${item.flag}</span><span>${item.label}</span>`;
    button.addEventListener("click", () => {
      if (select.value === item.value) return;
      select.value = item.value;
      dispatchNativeChange(select);
      updateLanguageDock();
    });
    dock.append(button);
  }

  shell.prepend(dock);
  select.closest("label")?.classList.add("is-native-language");
  select.addEventListener("change", updateLanguageDock);
  updateLanguageDock();
}

function updateLanguageDock() {
  const select = document.querySelector("#languageSelect");
  if (!select) return;
  for (const button of document.querySelectorAll(".language-pill")) {
    const active = button.dataset.value === select.value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function createSegmentedControl(select) {
  const label = select.closest("label");
  if (!label || label.querySelector(".segmented-control")) return;

  label.classList.add("select-backed-control");
  select.classList.add("native-select-hidden");

  const control = document.createElement("div");
  control.className = "segmented-control";
  control.setAttribute("role", "radiogroup");
  control.setAttribute("aria-label", label.querySelector("span")?.textContent || "");
  select.after(control);

  const render = () => {
    const previous = control.dataset.signature;
    const signature = Array.from(select.options).map((option) => `${option.value}:${option.textContent}:${option.disabled}`).join("|");
    if (previous !== signature) {
      control.dataset.signature = signature;
      control.replaceChildren();
      for (const option of select.options) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "segment-option";
        button.dataset.value = option.value;
        button.textContent = option.textContent;
        button.disabled = option.disabled;
        button.setAttribute("role", "radio");
        button.addEventListener("click", () => {
          if (button.disabled || select.value === option.value) return;
          select.value = option.value;
          dispatchNativeChange(select);
          update();
        });
        control.append(button);
      }
    }
    update();
  };

  const update = () => {
    for (const button of control.querySelectorAll(".segment-option")) {
      const active = button.dataset.value === select.value;
      const option = Array.from(select.options).find((item) => item.value === button.dataset.value);
      button.disabled = Boolean(option?.disabled);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", String(active));
    }
  };

  select.addEventListener("change", render);
  new MutationObserver(render).observe(select, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["disabled", "selected"],
  });
  render();
}

function initSegmentedControls() {
  for (const selector of SEGMENTED_SELECTS) {
    const select = document.querySelector(selector);
    if (select) createSegmentedControl(select);
  }
}

buildLanguageDock();
initSegmentedControls();
