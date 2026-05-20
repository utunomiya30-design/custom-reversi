const DEFAULT_CONFIG = {
  enabled: false,
  client: "",
  slots: {
    gameBanner: "",
    resultLarge: "",
  },
};

const config = {
  ...DEFAULT_CONFIG,
  ...(window.CUSTOM_REVERSI_ADS || {}),
  slots: {
    ...DEFAULT_CONFIG.slots,
    ...(window.CUSTOM_REVERSI_ADS?.slots || {}),
  },
};

const AD_SCRIPT_ID = "adsense-script";
const ADSENSE_SRC = "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

function hasProductionConfig() {
  return Boolean(
    config.enabled &&
      /^ca-pub-\d+$/.test(config.client) &&
      config.slots.gameBanner &&
      config.slots.resultLarge,
  );
}

function findAdSenseScript() {
  return Array.from(document.scripts).find((script) => script.src.includes(ADSENSE_SRC));
}

function loadAdSenseScript() {
  const existing = document.getElementById(AD_SCRIPT_ID) || findAdSenseScript();
  if (existing) return existing;

  const script = document.createElement("script");
  script.id = AD_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.client)}`;
  document.head.appendChild(script);
  return script;
}

function buildAdUnit(container, slotId, format) {
  if (container.querySelector(".adsbygoogle")) return;

  container.textContent = "";
  container.classList.add("is-ad-ready");
  container.setAttribute("aria-label", "Advertisement");

  const ad = document.createElement("ins");
  ad.className = "adsbygoogle";
  ad.style.display = "block";
  ad.dataset.adClient = config.client;
  ad.dataset.adSlot = slotId;
  ad.dataset.adFormat = format;
  ad.dataset.fullWidthResponsive = "true";

  container.appendChild(ad);

  try {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  } catch (error) {
    container.classList.remove("is-ad-ready");
    container.textContent = "Advertisement";
    console.warn("AdSense slot initialization failed", error);
  }
}

function preparePlaceholders() {
  document.querySelectorAll("[data-ad-placement]").forEach((container) => {
    if (!container.textContent.trim()) {
      container.textContent = "Advertisement";
    }
  });
}

function initAds() {
  preparePlaceholders();

  if (!hasProductionConfig()) return;

  loadAdSenseScript();

  const gameBanner = document.querySelector('[data-ad-placement="game-banner"]');
  const resultLarge = document.querySelector('[data-ad-placement="result-large"]');

  if (gameBanner) buildAdUnit(gameBanner, config.slots.gameBanner, "auto");
  if (resultLarge) buildAdUnit(resultLarge, config.slots.resultLarge, "auto");
}

initAds();
