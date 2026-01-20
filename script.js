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

  titleScreen.style.transition = "opacity 1.5s";
  titleScreen.style.opacity = 0;

  setTimeout(() => {
    titleScreen.style.display = "none";

    resetGameUI();
    resetGameState();

    const room = document.getElementById("room");
    room.classList.remove("hidden");
    room.classList.remove("fadeout");
    room.style.opacity = "1";
    room.style.display = "block";

    playBGM("bgm_room.mp3");
  }, 1500);
});

const seCache = {};

function playSE(src) {
  if (!src) return;

  if (!seCache[src]) {
    seCache[src] = new Audio(src);
  }

  const se = seCache[src];
  se.currentTime = 0;
  se.play();
}

function stopBGM() {
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}

function resolveRoute(entry) {
  if (flags[entry.flag]) {
    return entry.read;
  }

  if (entry.conditionRoute && entry.conditionRoute.condition()) {
    return entry.conditionRoute;
  }

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
    image: "can.png",
    readImage: "memo.png",

    unread:{
      texts: ["ごみ箱は紙で埋まっている。"],
    },

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

      imageOnTextIndex: 2,
      imageAfterChange: "memo.png",

      seOnTexts: [
        { index: 1, se: "se_can.mp3" },
        { index: 2, se: "se_memo.mp3" }
      ],

      unlockRead: true,

      onFinish: () => {
        playBGM("bgm_room.mp3");
        flags.canConditionCleared = true;
      }
    },

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
        "ノートパソコンだ。",
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

    conditionRoute: {
      condition: () => flags.puzzleCleared,

      texts: [
        "画面には『2434』と表示されている。"
      ],

      unlockRead: true
    },

    read: {
      texts: [
        "画面には『2434』と表示されている。"
      ]
    }
  },

  safe: {
    flag: "safe",
    image: "safe.png",
    readImage: "zasshi.png",

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

    conditionRoute: {
      condition: () => flags.hasKey,
      texts: [
        "扉には鍵がかかっている。",
        "鍵を使えば・・・",
        "",
        "開いた"
      ],

      imageOnTextIndex: 2,
      imageAfterChange: "door_open.png",
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

function typeText(text) {
  popupText.classList.remove("diary-highlight");

  if (
    currentKey === "diary" &&
    activeRoute === data.diary.unread &&
    currentTextIndex >= 3 &&
    currentTextIndex <= 11
  ) {
    popupText.classList.add("diary-highlight");
  }

  if (
    currentKey === "can" &&
    activeRoute === data.can.conditionRoute &&
    currentTextIndex >= 3 &&
    currentTextIndex <= 6
  ) {
    popupText.classList.add("diary-highlight");
  }

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
      typingTimer = setTimeout(type, 40);
    } else {
      onTextFinished();
    }
  }

  type();
}

function onTextFinished() {
  if (currentTextIndex === activeTexts.length - 1) {
    hasFinishedReading = true;

    if (safeEndingQueued) {
      safeEndingQueued = false;

      playBGM("bgm_test.mp3", 0.4);

      setTimeout(() => {
        startTruthTransition();
      }, 1200);

      return;
    }

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

  activeRoute = resolveRoute(entry);

  activeTexts = activeRoute.texts || [];

  if (flags[key] && entry.readImage) {
    popupImage.src = entry.readImage;
  } else {
    popupImage.src = entry.image;
  }

  canMarkAsRead = !!activeRoute.unlockRead;

  if (activeRoute.se) {
    playSE(activeRoute.se);
  }

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
  if (isLightsOutActive) return;

  keypad.classList.add("hidden");

  if (isEndingPhase === 1) {
    showTbcPhase();
    return;
  }

  if (hasFinishedReading && activeRoute?.onFinish) {
    activeRoute.onFinish();
  }

  if (hasFinishedReading && canMarkAsRead) {
    flags[currentKey] = true;
  }

  if (
    currentKey === "laptop" &&
    flags.laptopRead &&
    !flags.puzzleCleared
  ) {
    openLightsOut(); 
    return;
  }

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

  if (activeRoute && Array.isArray(activeRoute.seOnTexts)) {
    const hit = activeRoute.seOnTexts.find(
      s => s.index === currentTextIndex
    );
    if (hit) {
      playSE(hit.se);
    }
  }

  if (
    activeRoute &&
    activeRoute.imageOnTextIndex === currentTextIndex
  ) {
    popupImage.classList.add("fade");

    setTimeout(() => {
      popupImage.src = activeRoute.imageAfterChange;

      popupImage.classList.remove("fade");
    }, 0);
  }

  typeText(activeTexts[currentTextIndex]);
});

const closeBtn = document.getElementById("close-btn");

closeBtn.addEventListener("click", (event) => {
  if (isLightsOutActive) {
  event.stopPropagation();
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
    flags.safeUnlocked = true;
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
    safeEndingQueued = true;
    typeText(activeTexts[0]);

    keypad.classList.add("hidden");
  } else {
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
  popupImage.classList.remove("hidden-image");

  document.getElementById("lightsout").classList.remove("hidden");

  document.getElementById("popup-message-area").classList.add("hidden");

  initPuzzle();
}

function initPuzzle() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  gridState = [];

  for (let i = 0; i < size * size; i++) {
    const isOn = fixedPattern[i];
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
  isLightsOutActive = false;

  playSE("se_lightsout_clear.mp3");

  document.getElementById("lightsout").classList.add("hidden");

  popupImage.src = "laptop_off_2434.png";

  popupImage.classList.remove("hidden-image");

  document.getElementById("popup-message-area").classList.remove("hidden");

  activeTexts = [
    "画面に数字が表示された。",
    "『2434』と書かれている。"
  ];
  currentTextIndex = 0;

  typeText(activeTexts[0]);
}

function startTruthTransition() {
  isEndingPhase = 1;

  const popupText = document.getElementById("popup-text");
  popupText.classList.add("ending-text");

  const room = document.getElementById("room");
  const messageArea = document.getElementById("popup-message-area");

  room.classList.remove("hidden");
  room.classList.remove("fadeout");
  room.style.opacity = "";

  requestAnimationFrame(() => {
    fadeOutRoom(() => {
      room.classList.add("hidden");

      popup.classList.add("show");

      messageArea.classList.remove("hidden");
      messageArea.classList.remove("ending");

      popupImage.src = "zasshi.png";
      activeTexts = [
        "大晦日、静かな村で起こった「集団失踪事件」",
        "住民が次々と姿を消し、年越しを迎えるまでに全員行方不明に！",
        "取材の中で出会ったのは謎の儀式の噂",
        "UFOとの交信か？ はたまた黄泉がえりの秘術か？",
        "全日本ミステリー研究部は、真相を追いかけます！"
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

  stopBGM();

  const messageArea = document.getElementById("popup-message-area");
  messageArea.classList.add("hidden");

  popupImage.src = "";

  const tbc = document.getElementById("tbc");
  tbc.classList.remove("hidden");

  setTimeout(() => {
    tbc.classList.remove("hidden");

    requestAnimationFrame(() => {
      tbc.classList.add("show");
    });
  }, 1500);

  setTimeout(() => {
    typeTBC("To be continued...");
  }, 2500);

  setTimeout(() => {
    returnToTitle();
  }, 10000);
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
  if (currentBgmName === src) return;

  if (fadeTimer) clearInterval(fadeTimer);

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

  stopBGM();

  popup.classList.remove("show");

  const tbc = document.getElementById("tbc");
  tbc.classList.add("hidden");
  tbc.classList.remove("show");
  tbc.textContent = "";

  const room = document.getElementById("room");
  room.classList.remove("hidden");
  room.classList.remove("fadeout");
  room.style.opacity = "1";

  Object.keys(flags).forEach(k => flags[k] = false);

  const title = document.getElementById("title-screen");
  title.style.display = "flex";
  title.style.opacity = 0;

  requestAnimationFrame(() => {
    title.style.transition = "opacity 2s";
    title.style.opacity = 1;
  });
}

function resetGameUI() {
  popup.classList.remove("show");
  popup.classList.add("hidden");

  const messageArea = document.getElementById("popup-message-area");
  messageArea.classList.remove("hidden");
  messageArea.classList.remove("ending");

  const tbc = document.getElementById("tbc");
  tbc.classList.add("hidden");
  tbc.classList.remove("show");
  tbc.textContent = "";

  document.getElementById("lightsout").classList.add("hidden");

  keypad.classList.add("hidden");

  popupImage.src = "";
  popupImage.classList.remove("hidden-image");

  popupText.textContent = "";

  const room = document.getElementById("room");
  room.classList.remove("hidden");
  room.classList.remove("fadeout");

  room.style.opacity = "1";
  room.style.display = "";

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

  Object.keys(flags).forEach(k => flags[k] = false);

}


