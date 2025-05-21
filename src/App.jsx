import React, { useState } from "react";

const INITIAL_CARDS = [
  { name: "sword", label: "剣", damage: 5 },
  { name: "dagger", label: "小剣", damage: 2 },
  { name: "dagger", label: "小剣", damage: 2 },
  { name: "spear", label: "槍", damage: 4 },
  { name: "spear", label: "槍", damage: 4 },
  { name: "heal", label: "回復", heal: 1 },
  { name: "shield", label: "盾" },
  { name: "shield", label: "盾" },
  { name: "bomb", label: "爆弾" }
];

const CARD_INFO = {
  sword: {
    label: "剣",
    damage: 5,
    image: "/images/sword.png",
    description: "5ダメージ（盾と槍で防がれる）"
  },
  dagger: {
    label: "小剣",
    damage: 2,
    image: "/images/dagger.png",
    description: "2ダメージ（盾で防がれる）"
  },
  spear: {
    label: "槍",
    damage: 4,
    image: "/images/spear.png",
    description: "4ダメージ（小剣と盾で防がれる）"
  },
  heal: {
    heal: 1,
    label: "回復",
    image: "/images/heal.png",
    description: "+1HP（槍を受けると無効）"
  },
  shield: {
    label: "盾",
    image: "/images/shield.png",
    description: "全攻撃を防ぐ"
  },
  bomb: {
    label: "爆弾",
    image: "/images/bomb.png",
    description: "次ターンに起動（盾で無効／1回限定）"
  }
};

const App = () => {
  const [turn, setTurn] = useState(1);
  const [playerHP, setPlayerHP] = useState(9);
  const [aiHP, setAIHP] = useState(9);
  const [playerCards, setPlayerCards] = useState(INITIAL_CARDS);
  const [aiCards, setAICards] = useState([...INITIAL_CARDS]);
  const [log, setLog] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedBombCard, setSelectedBombCard] = useState(null);
  const [bombPlanted, setBombPlanted] = useState(false);
  const [playerBombNext, setPlayerBombNext] = useState(null);
  const [playerBombUsed, setPlayerBombUsed] = useState(false);
  const [aiBombNext, setAIBombNext] = useState(null);
  const [playerHealBlocked, setPlayerHealBlocked] = useState(false);
  const [aiHealBlocked, setAIHealBlocked] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState("");

  const handleCardSelect = (card, index) => {
    if (card.name === "bomb") {
      if (selectedBombCard?.index === index) {
        setSelectedBombCard(null);
        setPlayerBombNext(null);
      } else {
        setPlayerBombNext(turn);
        setSelectedBombCard({ ...card, index });
      }
    } else {
      if (selectedCard?.index === index) {
        setSelectedCard(null);
      } else {
        setSelectedCard({ ...card, index });
      }
    }
  };

  const handlePlay = () => {
    if (playerHP <= 0 || aiHP <= 0) return;
    if (!selectedCard && !selectedBombCard) return;
    const newPlayerCards = [...playerCards];
    if (selectedCard && selectedCard.name !== "bomb") {
      newPlayerCards.splice(selectedCard.index, 1);
    }

    const aiChoiceIndex = Math.floor(Math.random() * aiCards.length);
    const aiCard = aiCards[aiChoiceIndex];
    const newAICards = [...aiCards];
    newAICards.splice(aiChoiceIndex, 1);

    // 爆弾ダメージ処理（前ターン設置）
    let pHP = playerHP;
    let aHP = aiHP;
    let roundLog = [];

    if (playerBombNext === turn - 1) {
      if (Math.random() > 0.3) {
        if (aiCard.name === "shield") {
          roundLog.push(`相手の盾があなたの爆弾を防いだ`);
        } else {
          aHP -= 4;
          roundLog.push(`あなたの爆弾が起動！ 相手に4ダメージ`);
        }
      } else {
        roundLog.push(`あなたの爆弾は不発に終わった`);
      }
    }
    if (aiBombNext) {
      if (Math.random() > 0.3) {
        if (selectedCard && selectedCard.name === "shield") {
          roundLog.push(`あなたの盾が相手の爆弾を防いだ`);
        } else {
          pHP -= 4;
          roundLog.push(`相手の爆弾が起動！ あなたに4ダメージ`);
        }
      } else {
        roundLog.push(`相手の爆弾は不発に終わった`);
      }
    }

    // メインカード処理（処理順に基づく）
    const resolutionOrder = ["spear", "dagger", "sword", "heal"];
    const both = [
      { actor: "あなた", card: selectedCard },
      { actor: "相手", card: aiCard },
    ].sort(
      (a, b) => resolutionOrder.indexOf(a.card.name) - resolutionOrder.indexOf(b.card.name)
    );

    let newPlayerHealBlocked = false;
    let newAIHealBlocked = false;

    const playerCard = selectedCard;
    const opponentCard = aiCard;

    both.forEach(({ actor, card }) => {
      if (card.name === "spear") {
        if (actor === "あなた") {
          if (opponentCard.name === "shield" || opponentCard.name === "dagger") {
            roundLog.push("相手の盾/小剣があなたの攻撃を防いだ");
            return;
          }
          aHP -= 4;
          newAIHealBlocked = true;
          roundLog.push("あなたの槍が命中！ 相手に4ダメージ＋回復不能");
          // spear hits: remove opponent's heal card from their hand
          const healIndex = newAICards.findIndex(c => c.name === "heal");
          if (healIndex !== -1) {
            newAICards.splice(healIndex, 1);
          }
        } else {
          if (playerCard && (playerCard.name === "shield" || playerCard.name === "dagger")) {
            roundLog.push("あなたの盾/小剣が相手の攻撃を防いだ");
            return;
          }
          pHP -= 4;
          newPlayerHealBlocked = true;
          roundLog.push("相手の槍が命中！ あなたに4ダメージ＋回復不能");
          // spear hits: remove player's heal card from their hand
          const healIndex = newPlayerCards.findIndex(c => c.name === "heal");
          if (healIndex !== -1) {
            newPlayerCards.splice(healIndex, 1);
          }
        }
      } else if (card.name === "dagger") {
        if (actor === "あなた") {
          if (opponentCard.name === "shield") {
            roundLog.push("相手の盾があなたの攻撃を防いだ");
            return;
          }
          aHP -= 2;
          roundLog.push("あなたの小剣が命中！ 相手に2ダメージ");
        } else {
          if (playerCard && playerCard.name === "shield") {
            roundLog.push("あなたの盾が相手の攻撃を防いだ");
            return;
          }
          pHP -= 2;
          roundLog.push("相手の小剣が命中！ あなたに2ダメージ");
        }
      } else if (card.name === "sword") {
        if (actor === "あなた") {
          if (opponentCard.name === "shield" || opponentCard.name === "spear") {
            roundLog.push("相手の盾/槍があなたの攻撃を防いだ");
            return;
          }
          aHP -= 5;
          roundLog.push("あなたの剣が命中！ 相手に5ダメージ");
        } else {
          if (playerCard && (playerCard.name === "shield" || playerCard.name === "spear")) {
            roundLog.push("あなたの盾/槍が相手の攻撃を防いだ");
            return;
          }
          pHP -= 5;
          roundLog.push("相手の剣が命中！ あなたに5ダメージ");
        }
      } else if (card.name === "heal") {
        if (actor === "あなた" && !playerHealBlocked) {
          pHP = Math.min(9, pHP + 1);
          roundLog.push("あなたが1回復した");
        } else if (actor === "相手" && !aiHealBlocked) {
          aHP = Math.min(9, aHP + 1);
          roundLog.push("相手が1回復した");
        }
      }
    });

    if (roundLog.length === 0) {
      roundLog.push("このターンでは何も起きなかった");
    }

    if (pHP <= 0 && aHP <= 0) {
      setResult("引き分け");
    } else if (pHP <= 0) {
      setResult("あなたの敗北");
    } else if (aHP <= 0) {
      setResult("あなたの勝利");
    }

    setPlayerHP(Math.max(0, pHP));
    setAIHP(Math.max(0, aHP));
    setLog([...log, `--- Turn ${turn} ---`, ...roundLog]);
    setFeedback(roundLog.join("\n"));
    setTimeout(() => setFeedback(""), 2500);

    // Remove bomb card from player hand if used this turn
    if (selectedBombCard) {
      setPlayerBombUsed(true);
      const updatedCards = [...playerCards];
      updatedCards.splice(selectedBombCard.index, 1);
      setPlayerCards(updatedCards);
    }

    setTurn(turn + 1);
    setSelectedCard(null);
    setSelectedBombCard(null);

    if (selectedCard) {
      setPlayerCards(newPlayerCards);
    }
    setAICards(newAICards);

    // (Bomb setup is now handled in handleCardSelect)
    // Let AI randomly plant a bomb in turn 1-3 with 1/3 chance if not already used
    const aiBombChance = Math.random();
    setAIBombNext(turn <= 3 && !aiBombNext && aiBombChance < 0.75 ? true : null);
    setPlayerHealBlocked(newPlayerHealBlocked);
    setAIHealBlocked(newAIHealBlocked);
  };

  return (
    <div
      className="min-h-screen bg-gray-900 text-gray-100 font-serif p-4 mx-auto text-center space-y-4 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl"
    >
      <h1 className="text-xl font-bold">One Day Dual</h1>
      <div className="flex justify-between">
        <span>あなた: HP {playerHP}</span>
        <span>相手: HP {aiHP}</span>
      </div>
      {result && (
        <div className="text-center text-xl font-bold text-red-600">
          ゲーム終了：{result}
        </div>
      )}
      <div>
        <div className="mb-2 font-bold text-lg text-left">メインアクション枠</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
          {(() => {
            const grouped = {};
            playerCards
              .filter(card => card.name !== "bomb")
              .forEach((card, idx) => {
                if (!grouped[card.name]) grouped[card.name] = [];
                grouped[card.name].push({ ...card, index: idx });
              });
            return Object.entries(grouped).map(([name, group]) => {
              const info = CARD_INFO[name];
              const overlapOffset = 10;
              const groupWidth = group.length > 1
                ? `calc(min(40vw,120px) + ${(group.length - 1) * overlapOffset}px)`
                : "min(40vw,120px)";
              return (
                <div
                  key={name}
                  className="relative"
                  style={{ width: groupWidth, height: "min(40vw,200px)" }}
                >
                  {group.map((card, i) => (
                    <button
                      key={card.index}
                      onClick={() => handleCardSelect({ name, label: card.label }, card.index)}
                      className={`border rounded bg-white text-gray-800 text-xs p-2 disabled:text-gray-500 flex flex-col items-center transition-transform duration-200 ${
                        selectedCard?.index === card.index ? "ring-4 ring-yellow-400 scale-105 shadow-lg" : ""
                      }`}
                      style={{
                        position: "absolute",
                        left: `${i * overlapOffset}px`,
                        width: "min(40vw, 120px)",
                        zIndex: group.length - i
                      }}
                      disabled={result}
                    >
                      <img src={info.image} alt={info.label} className="w-20 h-20 mb-1 object-contain" />
                      <span className="font-bold break-words">{info.label}</span>
                      <span className="text-xs text-gray-600 text-center leading-tight break-all whitespace-normal">
                        {info.description}
                      </span>
                    </button>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      </div>
      {turn <= 3 && !playerBombUsed && (
        <div className="mt-4">
          <div className="mb-2 font-bold text-lg text-left">ステルスアクション枠</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
            {(() => {
              const grouped = {};
              playerCards
                .filter(card => card.name === "bomb")
                .forEach((card, idx) => {
                  if (!grouped[card.name]) grouped[card.name] = [];
                  grouped[card.name].push({ ...card, index: idx });
                });
              return Object.entries(grouped).map(([name, group]) => {
                const info = CARD_INFO[name];
                const overlapOffset = 10;
                const groupWidth = group.length > 1
                  ? `calc(min(40vw,120px) + ${(group.length - 1) * overlapOffset}px)`
                  : "min(40vw,120px)";
                return (
                  <div
                    key={name}
                    className="relative"
                    style={{ width: groupWidth, height: "min(40vw,200px)" }}
                  >
                    {group.map((card, i) => (
                      <button
                        key={card.index}
                        onClick={() => handleCardSelect({ name, label: card.label }, card.index)}
                        className={`border rounded bg-white text-gray-800 text-xs p-2 disabled:text-gray-500 flex flex-col items-center transition-transform duration-200 ${
                          selectedBombCard?.index === card.index ? "ring-4 ring-yellow-400 scale-105 shadow-lg" : ""
                        }`}
                        style={{
                          position: "absolute",
                          left: `${i * overlapOffset}px`,
                          width: "min(40vw, 120px)",
                          zIndex: group.length - i
                        }}
                        disabled={result}
                      >
                        <img src={info.image} alt={info.label} className="w-20 h-20 mb-1 object-contain" />
                        <span className="font-bold break-words">{info.label}</span>
                        <span className="text-xs text-gray-600 text-center leading-tight break-all whitespace-normal">
                          {info.description}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
          <small className="text-white block text-left">
            ※ステルスアクションはメインアクションと同時に選択できます
          </small>
        </div>
      )}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handlePlay}
        disabled={(!selectedCard && !selectedBombCard) || result}
      >
        カードを出す
      </button>
      {feedback && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white px-6 py-4 rounded shadow-lg text-xl font-bold z-50 animate-fade">
          {feedback}
        </div>
      )}
    </div>
  );
};

export default App;