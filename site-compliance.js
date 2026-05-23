const links = [
  ["./", "ゲーム"],
  ["./guide.html", "遊び方"],
  ["./strategy.html", "戦略ガイド"],
  ["./faq.html", "FAQ"],
  ["./about.html", "サイト情報"],
  ["./contact.html", "お問い合わせ"],
  ["./privacy.html", "プライバシー"],
];

function buildLink([href, label]) {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = label;
  return a;
}

function ensureNav() {
  if (document.querySelector(".site-nav")) return;
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "サイト内メニュー");

  const brand = document.createElement("a");
  brand.className = "site-brand";
  brand.href = "./";
  brand.textContent = "Custom Reversi";

  const list = document.createElement("div");
  list.className = "site-links";
  for (const link of links) list.append(buildLink(link));

  nav.append(brand, list);
  document.body.prepend(nav);
}

function ensureFooter() {
  if (document.querySelector(".site-footer")) return;
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  const year = new Date().getFullYear();
  const left = document.createElement("span");
  left.textContent = `© ${year} Custom Reversi`;
  const right = document.createElement("span");
  right.append(buildLink(["./privacy.html", "プライバシーポリシー"]));
  right.append(" / ");
  right.append(buildLink(["./contact.html", "お問い合わせ"]));
  footer.append(left, right);
  document.body.append(footer);
}

ensureNav();
ensureFooter();
