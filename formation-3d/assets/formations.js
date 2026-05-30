/* ============================================================
   Formation Lab — formation data & matchup analysis
   Pitch model: X = width (-34..34), Z = length (-52.5..52.5)
   HOME defends -Z (attacks toward +Z). AWAY is mirrored.
   Roles: GK, DF, DM, CM, MF(wing-back/box-to-box), AM, FW
   ============================================================ */
(function (global) {
  "use strict";

  // Each formation lists outfield players + GK in the HOME orientation.
  // x: across the pitch (left -, right +). z: own goal (-) toward halfway (+).
  const FORMATIONS = {
    "4-2-3-1": {
      label: "4-2-3-1",
      blurb: "二枚のアンカーで中央を締め、トップ下と1トップで仕掛けるバランス型。",
      players: [
        { x: 0,   z: -48, role: "GK" },
        { x: -25, z: -32, role: "DF" }, { x: -9, z: -34, role: "DF" },
        { x: 9,   z: -34, role: "DF" }, { x: 25, z: -32, role: "DF" },
        { x: -11, z: -18, role: "DM" }, { x: 11, z: -18, role: "DM" },
        { x: -23, z: 4,   role: "AM" }, { x: 0,  z: 1,  role: "AM" }, { x: 23, z: 4, role: "AM" },
        { x: 0,   z: 18,  role: "FW" }
      ]
    },
    "4-3-3": {
      label: "4-3-3",
      blurb: "中盤逆三角形で主導権を握り、両ウイングが幅を取って崩す攻撃的志向。",
      players: [
        { x: 0,   z: -48, role: "GK" },
        { x: -25, z: -32, role: "DF" }, { x: -9, z: -34, role: "DF" },
        { x: 9,   z: -34, role: "DF" }, { x: 25, z: -32, role: "DF" },
        { x: 0,   z: -20, role: "DM" }, { x: -16, z: -8, role: "CM" }, { x: 16, z: -8, role: "CM" },
        { x: -26, z: 14,  role: "FW" }, { x: 0, z: 18, role: "FW" }, { x: 26, z: 14, role: "FW" }
      ]
    },
    "3-4-2-1": {
      label: "3-4-2-1",
      blurb: "3バック＋ウイングバックで幅を確保。2シャドーが中央のハーフスペースを突く。",
      players: [
        { x: 0,   z: -48, role: "GK" },
        { x: -18, z: -33, role: "DF" }, { x: 0, z: -35, role: "DF" }, { x: 18, z: -33, role: "DF" },
        { x: -30, z: -10, role: "MF" }, { x: -8, z: -14, role: "CM" },
        { x: 8,   z: -14, role: "CM" }, { x: 30, z: -10, role: "MF" },
        { x: -11, z: 6,   role: "AM" }, { x: 11, z: 6, role: "AM" },
        { x: 0,   z: 18,  role: "FW" }
      ]
    },
    "3-3-2-2": {
      label: "3-3-2-2",
      blurb: "中央に人を集める菱形寄りの密集型。2トップで最終ラインに圧力をかける。",
      players: [
        { x: 0,   z: -48, role: "GK" },
        { x: -18, z: -33, role: "DF" }, { x: 0, z: -35, role: "DF" }, { x: 18, z: -33, role: "DF" },
        { x: -19, z: -13, role: "MF" }, { x: 0, z: -16, role: "CM" }, { x: 19, z: -13, role: "MF" },
        { x: -10, z: 2,   role: "AM" }, { x: 10, z: 2, role: "AM" },
        { x: -9,  z: 18,  role: "FW" }, { x: 9, z: 18, role: "FW" }
      ]
    }
  };

  const MID_ROLES = ["DM", "CM", "MF"];
  const ATT_ROLES = ["AM", "FW"];

  // Derive zone counts used by the matchup engine.
  function profile(key) {
    const p = FORMATIONS[key].players;
    const cnt = (f) => p.filter(f).length;
    return {
      key,
      backLine:     cnt((q) => q.role === "DF"),
      wideDefenders:cnt((q) => q.role === "DF" && Math.abs(q.x) >= 20), // full-backs
      midTotal:     cnt((q) => MID_ROLES.includes(q.role)),
      midCentral:   cnt((q) => MID_ROLES.includes(q.role) && Math.abs(q.x) < 15),
      midWide:      cnt((q) => MID_ROLES.includes(q.role) && Math.abs(q.x) >= 20),
      betweenLines: cnt((q) => q.role === "AM"),
      forwards:     cnt((q) => q.role === "FW"),
      wideAttack:   cnt((q) => ATT_ROLES.includes(q.role) && Math.abs(q.x) >= 20),
      highPress:    cnt((q) => ATT_ROLES.includes(q.role)) // bodies that press the back line
    };
  }

  function verdictWord(h, a) {
    if (h > a) return { v: "有利", cls: "good" };
    if (h < a) return { v: "不利", cls: "bad" };
    return { v: "互角", cls: "even" };
  }

  // Compare HOME vs AWAY and return readable, number-backed bullets.
  function analyze(homeKey, awayKey) {
    const H = profile(homeKey);
    const A = profile(awayKey);
    const rows = [];
    let score = 0;
    const push = (area, hv, av, builder) => {
      const w = verdictWord(hv, av);
      score += hv > av ? 1 : hv < av ? -1 : 0;
      rows.push({ area, home: hv, away: av, verdict: w.v, cls: w.cls, note: builder(w.v) });
    };

    // 1) Central midfield battle — who controls the middle third.
    push("中盤中央の支配", H.midCentral, A.midCentral, (v) =>
      v === "有利" ? "中央で数的優位を作りやすく、ビルドアップとセカンドボール回収で主導権を握れる。"
      : v === "不利" ? "中央で枚数負けしやすい。サイド経由かアンカー脇の活用で迂回したい。"
      : "中央は同数。個の質とポジショニングの優劣が勝負を分ける。");

    // 2) Width in attack vs opponent's defensive width.
    push("サイド攻撃の幅", H.wideAttack, A.wideDefenders, (v) =>
      v === "有利" ? "相手のサイドの枚数を上回り、大外〜ハーフスペースで1対1や2対1を作れる。"
      : v === "不利" ? "幅を取る枚数が相手の守備を上回れない。内側に絞って中央で勝負する設計が有効。"
      : "サイドの攻防は同数。クロスの質とインナーラップの連携が鍵。");

    // 3) Striker(s) vs back line — spare man at the back.
    push("最前線の駆け引き", H.forwards, A.backLine, (v) =>
      v === "不利" ? "相手は最終ラインに余りを作れる（" + A.backLine + "対" + H.forwards + "）。"
                    + "前線で楔を引き出すか、二列目の飛び出しで数的不利を補いたい。"
      : v === "有利" ? "FWが相手CBと同数以上。プレスで最終ラインを能動的に追い込める。"
      : "FWと相手CBは拮抗。背後のスペース管理が攻防の分岐点。");

    // 4) Press resistance — keeping possession against their front line.
    push("プレス耐性（後方の枚数）", H.backLine, A.highPress, (v) =>
      v === "有利" ? "後方の枚数が相手の前プレ人数を上回り、落ち着いて前進できる。"
      : v === "不利" ? "相手の前線プレスに後方が噛み合わされやすい。GK・アンカーの関与で出口を作りたい。"
      : "ビルドアップ枚数とプレス人数が同数。最初の縦パスの精度が問われる。");

    // 5) Players between the lines vs their screening midfield.
    push("ライン間の厚み", H.betweenLines, A.midCentral, (v) =>
      v === "有利" ? "相手のスクリーンより多くの選手をライン間に置け、危険なゾーンを使える。"
      : v === "不利" ? "ライン間が相手の中盤に消されやすい。サイドからの侵入で角度を変えたい。"
      : "ライン間の攻防は均衡。受け手の上下動でマークを外せるか。");

    const overall =
      score > 0 ? { text: "総合的に HOME（" + homeKey + "）がやや有利", cls: "good" }
      : score < 0 ? { text: "総合的に AWAY（" + awayKey + "）がやや有利", cls: "bad" }
      : { text: "総合的にほぼ互角の組み合わせ", cls: "even" };

    return { rows, overall, score };
  }

  global.FL = { FORMATIONS, profile, analyze };
})(window);
