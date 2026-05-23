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

function ensureHomepageContent() {
  if (!document.querySelector(".app-shell") || document.querySelector(".homepage-content")) return;
  const section = document.createElement("section");
  section.className = "page-shell homepage-content";
  section.innerHTML = `
    <p class="kicker">About this game</p>
    <h2>カスタム・リバーシとは</h2>
    <p class="page-lead">カスタム・リバーシは、人数、盤面サイズ、勝利条件を自由に変えて遊べるブラウザ向けボードゲームです。通常の2人戦だけでなく、3人戦・4人戦、スコア勝利、逆転勝利、ランダムマッチなど、短時間で違う展開を試せるように作っています。</p>
    <div class="info-grid">
      <div class="info-card"><strong>ルールを変えて遊ぶ</strong><p>4x4から16x16までの盤面、2人から4人までの参加人数、通常・逆転・スコアの勝利条件を組み合わせられます。</p></div>
      <div class="info-card"><strong>URLで共有</strong><p>作成したルールやオンライン部屋はURLで共有できます。友人へ送るだけで同じ条件の対戦を始められます。</p></div>
      <div class="info-card"><strong>多人数向けの反転処理</strong><p>3人以上では、途中に複数の相手色が混ざっていても、自分の石で挟めばすべて自分の色へ変わります。</p></div>
      <div class="info-card"><strong>プライバシーに配慮</strong><p>背景画像はブラウザ内で一時表示します。オンライン対戦の同期に必要な情報は、対戦機能の提供目的で扱います。</p></div>
    </div>
    <h2>初めて遊ぶ方へ</h2>
    <p>まずは8x8、2人、通常モードで始めると基本ルールをつかみやすくなります。慣れてきたら3人戦や4人戦、逆転モード、スコアモードを試すと、同じリバーシでもまったく違う読み合いになります。</p>
    <p>詳しいルールは<a href="./guide.html">遊び方</a>、勝ち方の考え方は<a href="./strategy.html">戦略ガイド</a>、よくある疑問は<a href="./faq.html">FAQ</a>にまとめています。</p>
  `;
  document.querySelector(".app-shell")?.after(section);
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
ensureHomepageContent();
ensureFooter();
