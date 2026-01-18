const flags = {
  diary: false,
  can: false,
  canConditionCleared: false,
  safe: false,
  safeUnlocked: false,
  laptop: false,
  laptopRead: false,
  puzzleCleared: false,
  drawer: false,
  door: false,
};

const titleScreen = document.getElementById("title-screen");
const startBtn = document.getElementById("start-btn");

startBtn.addEventListener("click", () => {
  const title = document.getElementById("title-screen");
  // フェードアウト
  titleScreen.style.transition = "opacity 1.5s";
  titleScreen.style.opacity = 0;

  setTimeout(() => {
    titleScreen.style.display = "none";

    resetGameUI();   // ★ 追加
    resetGameState(); // ★ 追加

    // ★★★ これを必ず追加 ★★★
    const room = document.getElementById("room");
    room.classList.remove("hidden");
    room.classList.remove("fadeout");
    room.style.opacity = "1";
    room.style.display = "block";

    // ★ ゲーム開始BGM
    playBGM("bgm_room.mp3");
  }, 1500);
});

const seCache = {};

function playSE(src) {
  if (!src) return;

  // キャッシュ（同じ音を毎回 new Audio しない）
  if (!seCache[src]) {
    seCache[src] = new Audio(src);
  }

  const se = seCache[src];
  se.currentTime = 0; // 連続再生対策
  se.play();
}

function stopBGM() {
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}

function resolveRoute(entry) {
  // ① read 済み
  if (flags[entry.flag]) {
    return entry.read;
  }

  // ② condition
  if (entry.conditionRoute && entry.conditionRoute.condition()) {
    return entry.conditionRoute;
  }

  // ③ unread
  return entry.unread;
}

const data = {
  diary: {
    flag: "diary",
    image: "diary.png",
    unread:{
      texts: [
        "表紙が白紙の本だ。",
        "中身は・・・",
        "日記のようだ。",
        "9月14日",
        "興味深い噂を聞いた。",
        "もし本当にそんなことが可能なら・・・",
        "11月3日",
        "痕跡さえも見つからない。",
        "そんなことがあるのだろうか。",
        "12月21日",
        "ようやく見つけた。",
        "早速、準備を始めよう。あまり時間はない。",
        "この後のページは破られている。"
      ],

      seOnTexts: [
        { index: 1, se: "se_diary.mp3" }
      ],

      unlockRead: true,
    },

    read:{
      texts: [
        "表紙が白紙の本。中身は日記のようだ。",
        "途中のページが破られて、なくなっている。"
      ]
    },
    unlockRead: true
  },

  can: {
    flag: "can",
    image: "can.png",                 // unread 用
    readImage: "memo.png",   // ★ 追加（read 用）

    // 🔹 diary 未読時
    unread:{
      texts: ["ごみ箱は紙で埋まっている。"],
    },

    // 🔹 diary 読了後の condition ルート
    conditionRoute: {
      condition: () => flags.diary,

      texts: [
        "ごみ箱は紙で埋まっている。",
        "中を探ってみるか。",
        "日記の破られたページを見つけた。",
        "12月28日",
        "おおよその準備は整った。",
        "成功するかはわからないが・・・",
        "後のことは任せよう。"
      ],

      // ★ 画像
      imageOnTextIndex: 2,
      imageAfterChange: "memo.png",

      // ★ SE
      seOnTexts: [
        { index: 1, se: "se_can.mp3" },
        { index: 2, se: "se_memo.mp3" }
      ],

      unlockRead: true, // ★ unlockはここだけ！

      onFinish: () => {
        playBGM("bgm_room.mp3");
        flags.canConditionCleared = true; // ★ readImage 用
      }
    },

    // 🔹 condition 読了後
    read:{
      texts: [
        "ごみ箱に日記の破られたページが捨てられていた。",
        "ページの端に『2434』と書かれている。"
      ],
        se: "se_memo.mp3"
    },
  },

  laptop: {
    flag: "laptop",
    image: "laptop_off.png",

    unread: {
      texts: [
        "ノートパソコンが起動している。",
        "何かのロックがかかっているようだ。"
      ],
      unlockRead: false,

      onFinish: () => {
        flags.laptopRead = true;

        if (!flags.puzzleCleared) {
          openLightsOut();
        }
      }
    },

    // ② lightsout クリア後に再度触ったとき
    conditionRoute: {
      condition: () => flags.puzzleCleared,

      texts: [
        "画面には『2434』と表示されている。"
      ],

      unlockRead: true
    },

    // ③ それ以降
    read: {
      texts: [
        "画面には『2434』と表示されている。"
      ]
    }
  },

  safe: {
    flag: "safe",
    image: "safe.png",
    readImage: "zasshi.png",   // ★ 追加（read 用）

    unread: {
      texts: [
        "金庫だ。開けるには暗証番号が必要だ。"
      ]
    },

    conditionRoute: {
      condition: () => flags.puzzleCleared && !flags.safeUnlocked,
      texts: [
        "金庫だ。開けるには暗証番号が必要だ。",
        "さっき見た数字を入力してみよう。"
      ]
    },

    read:{
      texts: [
        "金庫の中には雑誌が入っていた。"
      ],

      unlockRead: true,

      onFinish: () => {
        startTruthTransition();
      }
    },

    // ★ 暗証番号
    code: "2434",

    seSuccess: "se_safe_open.mp3",
    seFail: "se_beep.mp3"
  },

  door: {
    flag: "door",
    image: "door.png",
    readImage: "door_open.png",

    unread:{
      texts: [
        "扉には鍵がかかっている。"
      ]
    },

    // ★ 鍵を持っている場合の特別ルート
    conditionRoute: {
      condition: () => flags.hasKey,
      texts: [
        "扉には鍵がかかっている。",
        "鍵を使えば・・・",
        "",
        "開いた"
      ],

      // ★ 画像
      imageOnTextIndex: 2,
      imageAfterChange: "door_open.png",
      // ★ SE
      seOnTexts: [
        { index: 2, se: "se_door_open.mp3" }
      ],

      unlockRead: true,

      onFinish: () => {
        flags.dooropen = true;
        startdoorTransition();
        playBGM("bgm_test.mp3")
      }
    },

    read:{
      texts: [
        "test"
      ]
    },
    unlockRead: true
  },

  drawer: {
    flag: "drawer",
    image: "drawer.png",
    unread: {
      texts: [
        "引き出しの中には・・・",
        "目ぼしいものはなさそうだ。"
      ],
        unlockRead: true,
        se: "se_drawer.mp3"
    },

    read:{
      texts: [
        "引き出しの中に目ぼしいものはない。"
      ]
    },
    unlockRead: true
  }
};

let currentKey = null;
let currentTextIndex = 0;
let activeTexts = [];
let hasFinishedReading = false;
let canMarkAsRead = false;
let activeRoute = null;
let isEndingPhase = 0;
let safeEndingQueued = false;

const popup = document.getElementById("popup");
const popupImage = document.getElementById("popup-image");
const popupText = document.getElementById("popup-text");

let typingTimer = null;
let typingIndex = 0;

/* タイプライター表示 */
function typeText(text) {
  // ★ diary用の文字色制御
  popupText.classList.remove("diary-highlight");

  /* ===== diary unread：3〜12文目 ===== */
  if (
    currentKey === "diary" &&
    activeRoute === data.diary.unread &&
    currentTextIndex >= 3 &&
    currentTextIndex <= 11
  ) {
    popupText.classList.add("diary-highlight");
  }

  /* ===== can conditionRoute：4〜7文目 ===== */
  if (
    currentKey === "can" &&
    activeRoute === data.can.conditionRoute &&
    currentTextIndex >= 3 &&
    currentTextIndex <= 6
  ) {
    popupText.classList.add("diary-highlight");
  }

  // --- 以下は既存のタイプライター処理 ---
  // 途中表示をリセット
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }

  popupText.textContent = "";
  typingIndex = 0;

  function type() {
    if (typingIndex < text.length) {
      popupText.textContent += text.charAt(typingIndex);
      typingIndex++;
      typingTimer = setTimeout(type, 40); // ←速度（小さいほど速い）
    } else {
      // ★ ここが「1文の表示完了」
      onTextFinished();
    }
  }

  type();
}

function onTextFinished() {
  // 最後の文まで来た？
  if (currentTextIndex === activeTexts.length - 1) {
    hasFinishedReading = true;

    // ★★★ safe暗証番号成功 → 即エンディング ★★★
    if (safeEndingQueued) {
      safeEndingQueued = false;

      // ★ エンディング直前BGMに切り替え
      playBGM("bgm_test.mp3", 0.4);

      // ★ 少し余韻を置いてから演出開始（超おすすめ）
      setTimeout(() => {
        startTruthTransition();
      }, 1200);

      return;
    }

    // ★ condition ルートを最後まで読んだときだけ
    if (activeRoute === data[currentKey]) {
    }
  }
}

function openPopup(key) {
  currentKey = key;

  currentTextIndex = 0;
  hasFinishedReading = false;
  canMarkAsRead = false;

  const entry = data[key];

  // ★ ルート確定（最優先）
  activeRoute = resolveRoute(entry);

  // 表示する文章群
  activeTexts = activeRoute.texts || [];

  // ★ 表示画像（read / unread / condition 後を含めて1回だけ）
  if (flags[key] && entry.readImage) {
    popupImage.src = entry.readImage;
  } else {
    popupImage.src = entry.image;
  }

  // ★ read フラグを立ててよいか
  canMarkAsRead = !!activeRoute.unlockRead;

  // ★ SE 再生
  if (activeRoute.se) {
    playSE(activeRoute.se);
  }

  // ★ 金庫だけ入力UIを出す
  if (key === "safe" && !flags.safe) {
    keypad.classList.remove("hidden");
  } else {
    keypad.classList.add("hidden");
  }

  popup.classList.remove("hidden");
  popup.classList.add("show");

  if (activeTexts.length) {
    typeText(activeTexts[0]);
  }
};

function closePopup() {
  // ★ lightsout 中は絶対に閉じない
  if (isLightsOutActive) return;

  keypad.classList.add("hidden"); // ← 保険

  // ★ エンディング中なら通常処理をしない
  if (isEndingPhase === 1) {
    showTbcPhase();
    return;
  }

  // 1. 先に読了時の処理（フラグ更新など）を実行してしまう
  if (hasFinishedReading && activeRoute?.onFinish) {
    activeRoute.onFinish();
  }

  // 通常 unread → read
  if (hasFinishedReading && canMarkAsRead) {
    flags[currentKey] = true;
  }

  // 2. ★★★ 修正箇所：パズル開始条件を満たす場合は、ポップアップを閉じずにパズルを開始して終了 ★★★
  if (
    currentKey === "laptop" &&
    flags.laptopRead &&
    !flags.puzzleCleared
  ) {
    // ポップアップを閉じずに、そのままパズル画面へ切り替え
    openLightsOut(); 
    return; // ← ここで関数を抜けることで、下の remove("show") が実行されなくなります
  }

  // 3. 通常の閉じる処理（パズルに行かない場合のみここに来る）
  popup.classList.remove("show");

  currentKey = null;
  activeTexts = [];
  canMarkAsRead = false;
};

popup.removeEventListener("click", closePopup);

const popupContent = document.getElementById("popup-content");

popupContent.addEventListener("click", (event) => {
  event.stopPropagation();
});

const messageArea = document.getElementById("popup-message-area");

messageArea.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!activeTexts.length) return;
  if (currentTextIndex >= activeTexts.length - 1) return;

  currentTextIndex++;

  // ★ 文インデックスごとの SE 再生（複数対応）
  if (activeRoute && Array.isArray(activeRoute.seOnTexts)) {
    const hit = activeRoute.seOnTexts.find(
      s => s.index === currentTextIndex
    );
    if (hit) {
      playSE(hit.se);
    }
  }

  // ★ 文インデックスで画像切り替え
  if (
    activeRoute &&
    activeRoute.imageOnTextIndex === currentTextIndex
  ) {
    // フェードアウト開始
    popupImage.classList.add("fade");

    setTimeout(() => {
      popupImage.src = activeRoute.imageAfterChange;

      // フェードイン
      popupImage.classList.remove("fade");
    }, 0);
  }

  typeText(activeTexts[currentTextIndex]);
});

const closeBtn = document.getElementById("close-btn");

closeBtn.addEventListener("click", (event) => {
  if (isLightsOutActive) {
  event.stopPropagation(); // ← これが超重要
    return;
  }
  closePopup();
});

document.getElementById("lightsout").addEventListener("click", e => {
  e.stopPropagation();
});

const codeInput = document.getElementById("codeInput");
const codeSubmit = document.getElementById("codeSubmit");
const keypad = document.getElementById("keypad");

codeSubmit.addEventListener("click", () => {
  const entry = data.safe;
  const input = codeInput.value;

  if (input === entry.code) {
    // 成功
    flags.safeUnlocked = true;   // ★ ここだけ
    flags.safe = true;
    playSE(entry.seSuccess);

    popupImage.src = entry.readImage;
    activeTexts = [
      "開いた。",
      "中身は雑誌？",
      "「1996年1月号」ずいぶん古い。",
      "内容は普通のようだが・・・",
      "「大晦日集団失踪事件」？",
    ];
    currentTextIndex = 0;
    safeEndingQueued = true; // ★ ここ重要
    typeText(activeTexts[0]);

    keypad.classList.add("hidden");
  } else {
    // 失敗
    playSE(entry.seFail);
    activeTexts = ["違うようだ。"];
    currentTextIndex = 0;
    typeText(activeTexts[0]);
  }

  codeInput.value = "";
});

codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    codeSubmit.click();
  }
});

const size = 5;
let gridState = [];

const fixedPattern = [
  false,  false,  true,   true,   true,
  false,  true,   false,  true,   true,
  true,   false,  false,  false,  true,
  true,   true,   false,  true,   false,
  true,   true,   true,   false,  false,
];

let isLightsOutActive = false;

function openLightsOut() {
  if (isLightsOutActive) return;

  isLightsOutActive = true;

  popupImage.src = "laptop_off_bg.png";
  popupImage.classList.remove("hidden-image"); // ← ここ重要

  document.getElementById("lightsout").classList.remove("hidden");

  // ★ メッセージだけ消す
  document.getElementById("popup-message-area").classList.add("hidden");

  initPuzzle();
}

function initPuzzle() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  gridState = [];

  for (let i = 0; i < size * size; i++) {
    const isOn = fixedPattern[i]; // ★ ここ
    gridState.push(isOn);

    const cell = document.createElement("div");
    cell.className = "panel" + (isOn ? " on" : "");
    cell.dataset.index = i;
    cell.addEventListener("click", togglePanel);
    grid.appendChild(cell);
  }
}

function togglePanel(e) {
  const i = Number(e.target.dataset.index);
  const targets = [
    i,
    i - 1,
    i + 1,
    i - size,
    i + size
  ];

  targets.forEach(t => {
    if (t >= 0 && t < gridState.length) {
      gridState[t] = !gridState[t];
      updatePanel(t);
    }
  });

  checkClear();
}

function updatePanel(i) {
  const cell = document.querySelector(`[data-index="${i}"]`);
  cell.classList.toggle("on", gridState[i]);
}

function checkClear() {
  if (gridState.every(v => v)) {
    puzzleClear();
  }
}

function puzzleClear() {
  flags.puzzleCleared = true;
  isLightsOutActive = false; // ★ ここ

  // ★ クリアSE
  playSE("se_lightsout_clear.mp3");

  // ミニゲーム UI を消す
  document.getElementById("lightsout").classList.add("hidden");

  // ★ ここで画像を差し替える
  popupImage.src = "laptop_off_2434.png";

  // ★ パソコン画像を戻す
  popupImage.classList.remove("hidden-image");

  // メッセージエリアを戻す
  document.getElementById("popup-message-area").classList.remove("hidden");

  activeTexts = [
    "画面に数字が表示された。",
    "『2434』と書かれている。"
  ];
  currentTextIndex = 0;

  typeText(activeTexts[0]);
}

function startTruthTransition() {
  isEndingPhase = 1; // ★ ここで世界を切り替える

  const popupText = document.getElementById("popup-text");
  popupText.classList.add("ending-text"); // ★ 追加

  const room = document.getElementById("room");
  const messageArea = document.getElementById("popup-message-area");

  // ★【追加①】フェード前の初期化（超重要）
  room.classList.remove("hidden");
  room.classList.remove("fadeout");
  room.style.opacity = "";

  // ★【追加②】1フレーム待ってからフェード開始
  requestAnimationFrame(() => {
    fadeOutRoom(() => {
      // 部屋を消す
      room.classList.add("hidden");

      // popup を再表示
      popup.classList.add("show");

      // ★ 通常メッセージウィンドウに戻す
      messageArea.classList.remove("hidden");
      messageArea.classList.remove("ending");

      // popup差し替え
      popupImage.src = "zasshi.png";
      activeTexts = [
        "大晦日、静かな村で起こった「集団失踪事件」。",
        "住民が次々と姿を消し、年越しを迎えるまでに全員行方不明に！",
        "謎の解明を求める声が高まる中、恐怖と好奇心が交錯する。",
        "あなたもこのミステリーを追いかけてみては？",
      ];
      currentTextIndex = 0;

      typeText(activeTexts[0]);
    });
  });
}

function fadeOutRoom(cb) {
  const room = document.getElementById("room");
  room.classList.add("fadeout");
  setTimeout(cb, 1500);
}

function showTbcPhase() {
  isEndingPhase = 2;

  stopBGM(); // ★ BGM停止

  // メッセージUIを消す
  const messageArea = document.getElementById("popup-message-area");
  messageArea.classList.add("hidden");

  // popup-image-area は残す（←重要）
  popupImage.src = ""; // 雑誌画像などは不要なら消す

  const tbc = document.getElementById("tbc");
  tbc.classList.remove("hidden");

  // ★ 少し待ってから表示
  setTimeout(() => {
    tbc.classList.remove("hidden");

    // フェードインを確実に効かせる
    requestAnimationFrame(() => {
      tbc.classList.add("show");
    });
  }, 1500); // ← ここが遅延時間（ms）

  // ★ タイプライター開始（さらに遅らせる）
  setTimeout(() => {
    typeTBC("To be continued...");
  }, 2500);

  setTimeout(() => {
    returnToTitle();
  }, 10000); // 好きな余韻時間
}

let tbcTimer = null;

function typeTBC(text, speed = 120) {
  const tbc = document.getElementById("tbc");
  tbc.textContent = "";

  let index = 0;

  if (tbcTimer) {
    clearTimeout(tbcTimer);
    tbcTimer = null;
  }

  function type() {
    if (index < text.length) {
      tbc.textContent += text.charAt(index);
      index++;
      tbcTimer = setTimeout(type, speed);
      speed = index > text.length - 5 ? 450 : 180;
      playSE("se_tick.mp3");
    }
  }

  type();
}

let clickSE;

function playClickSE() {
  if (!clickSE) {
    clickSE = new Audio("se_click.mp3");
  }
  clickSE.currentTime = 0;
  clickSE.play();
}

codeInput.addEventListener("input", () => {
  playClickSE();
});

const bgm = new Audio();
bgm.loop = true;
bgm.volume = 0;

let currentBgmName = null;
let fadeTimer = null;

function playBGM(src, targetVolume = 0.5) {
  if (currentBgmName === src) return; // 同じBGMなら何もしない

  if (fadeTimer) clearInterval(fadeTimer);

  // フェードアウト
  fadeTimer = setInterval(() => {
    if (bgm.volume > 0.02) {
      bgm.volume -= 0.02;
    } else {
      clearInterval(fadeTimer);

      bgm.src = src;
      bgm.currentTime = 0;
      bgm.volume = 0;
      bgm.play();

      currentBgmName = src;

      // フェードイン
      fadeTimer = setInterval(() => {
        if (bgm.volume < targetVolume) {
          bgm.volume = Math.min(bgm.volume + 0.02, targetVolume);
        } else {
          clearInterval(fadeTimer);
        }
      }, 50);
    }
  }, 50);
}

function returnToTitle() {
  const popupText = document.getElementById("popup-text");
  popupText.classList.remove("ending-text");

  // BGM 停止
  stopBGM();

  // ポップアップを消す
  popup.classList.remove("show");

  // TBCを消す
  const tbc = document.getElementById("tbc");
  tbc.classList.add("hidden");
  tbc.classList.remove("show");
  tbc.textContent = "";

  // room を戻す（次回プレイ用）
  const room = document.getElementById("room");
  room.classList.remove("hidden");
  room.classList.remove("fadeout");
  room.style.opacity = "1";

  // フラグ初期化（最低限）
  Object.keys(flags).forEach(k => flags[k] = false);

  // タイトル表示
  const title = document.getElementById("title-screen");
  title.style.display = "flex";
  title.style.opacity = 0;

  requestAnimationFrame(() => {
    title.style.transition = "opacity 2s";
    title.style.opacity = 1;
  });
}

function resetGameUI() {
  // popup を完全初期化
  popup.classList.remove("show");
  popup.classList.add("hidden"); // ★ これ重要

  // メッセージウィンドウを必ず戻す
  const messageArea = document.getElementById("popup-message-area");
  messageArea.classList.remove("hidden");
  messageArea.classList.remove("ending");

  // TBC を消す
  const tbc = document.getElementById("tbc");
  tbc.classList.add("hidden");
  tbc.classList.remove("show");
  tbc.textContent = "";

  // lightsout 完全停止
  document.getElementById("lightsout").classList.add("hidden");

  // keypad を隠す
  keypad.classList.add("hidden");

  // popup画像リセット（任意）
  popupImage.src = "";
  popupImage.classList.remove("hidden-image"); // ★ 忘れ防止

  // テキスト初期化
  popupText.textContent = "";

  // ★ room を必ず表示状態に戻す
  const room = document.getElementById("room");
  room.classList.remove("hidden");
  room.classList.remove("fadeout"); // ★ これが致命的に抜けていた

  room.style.opacity = "1";
  room.style.display = "";

  // 念のため画像も
  const roomImg = document.getElementById("room-image");
  if (roomImg) {
    roomImg.src = "room.png";
  }
}

function resetGameState() {
  currentKey = null;
  activeRoute = null;
  activeTexts = [];
  currentTextIndex = 0;

  hasFinishedReading = false;
  canMarkAsRead = false;

  isEndingPhase = 0;

  // フラグ初期化（全部 or 必要な分だけ）
  Object.keys(flags).forEach(k => flags[k] = false);
}