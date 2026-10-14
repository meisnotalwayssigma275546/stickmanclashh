(function () {
  // Needs the inline <script> in index.html that sets window._tbl and window._mem
  const wait = setInterval(function () {
    if (window._tbl && window._mem) { clearInterval(wait); start(); }
  }, 500);

  function start() {
    if (window.__stkMod) return;
    window.__stkMod = true;

    // ================= saved settings =================
    const KEY = "stkmod_v1";
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    const S = {
      key: saved.key || "z", spam: saved.spam !== false, rate: saved.rate || 100,
      pick: saved.pick || "", names: saved.names || {}
    };

    // ================= ability hooks =================
    // name -> function table index (from your list)
    const A = [["ArmCannonGreen",9970],["ArmCannonRedLaser",9974],["AxeExplosion",9990],["BatteAxeHit",9994],["BattleAxeLaunch",10011],["BattleAxeWind",10031],["BazookaBanana",10039],["BladesAbility",10052],["BoomerangLaunch",10084],["BootsDash",10105],["BowShot",10121],["BoxingDash",10135],["clawMuliAttack",10139],["CardAbility",10147],["CircularSawGrow",10170],["CrossBowShot",10186],["DaggerDash",10199],["saberDoubleShot",10218],["saberRotate",10222],["saberStance",10226],["FlailExplosion",10246],["flashlightAb",10250],["flashLightAb2",10256],["GauntletPower",10284],["GrappinShot",10300],["GuitareAbilities",10306],["gunTrileShot",10331],["HammerRotation",10345],["InstanteProjectil",10374],["IronHandAbilities",10378],["LampAbilities",10403],["LanceRotOrb",10425],["LaserswordAbilities",10429],["LaserswordLaunch",10442],["LollipopGrab",10457],["LaunchMagnet",10463],["magnetGrab",10477],["polariseMagnet",10483],["PaintbrushInk",10498],["InstantReUsed",10503],["PortalGunShot",10531],["PotionGeant",10551],["ShieldGrow",10588],["ShieldLaunch",10592],["FireDash",10596],["ShootSniper",10609],["MaceAb",10630],["SpearAttack",10645],["StaffAbility",10659],["SwordDash",10684],["swordGrow",10688],["obTurbo",11940],["overBoardStance",11945]];

    // wraps a table function with a 6-argument logger; the wasm link check rejects any
    // function whose signature differs, so a bad one throws here instead of crashing later
    const hook = (idx, n, cb) => {
      const sec = (id, b) => [id, b.length, ...b], g = [...Array(n).keys()].flatMap((i) => [0x20, i]);
      const body = [0, ...g, 0x10, 0, ...g, 0x10, 1, 0x0b];
      const by = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, ...sec(1, [1, 0x60, n, ...Array(n).fill(0x7f), 0]),
        ...sec(2, [2, 1, 0x65, 3, 0x6c, 0x6f, 0x67, 0, 0, 1, 0x65, 4, 0x6f, 0x72, 0x69, 0x67, 0, 0]),
        ...sec(3, [1, 0]), ...sec(7, [1, 1, 0x77, 0, 2]), ...sec(10, [1, body.length, ...body])]);
      const orig = _tbl.get(idx);
      _tbl.set(idx, new WebAssembly.Instance(new WebAssembly.Module(by), { e: { log: cb, orig } }).exports.w);
      return orig;
    };

    const REC = {};          // name -> Map(selector -> {a: args})   (selector = argument 3)
    const ORIG = {};         // name -> the game's untouched function
    let sig = 0;             // bumps when a new ability variant is learned
    const LOG = new Map();   // optional full log: "name|args" -> {fn, a, n}
    let logging = false;
    const learn = (nm, a) => {
      const m = REC[nm] || (REC[nm] = new Map()), s = a[3];
      let e = m.get(s);
      if (!e) { if (m.size >= 8) m.delete(m.keys().next().value); e = { a, n: 0 }; m.set(s, e); sig++; }
      e.a = a; e.n++;
      if (logging) {
        const k = nm + "|" + a.join(",");
        const l = LOG.get(k);
        if (l) l.n++; else if (LOG.size < 3000) LOG.set(k, { fn: nm, a, n: 1 });
      }
    };
    const skipped = [];
    A.forEach(([nm, idx]) => {
      try {
        const o = _tbl.get(idx);
        if (!o || o.length !== 6) { skipped.push(nm); return; }
        ORIG[nm] = hook(idx, 6, (...a) => learn(nm, a));
      } catch (e) { skipped.push(nm); }
    });

    const fire = (key) => {
      const i = key.lastIndexOf("|"), nm = key.slice(0, i), sel = +key.slice(i + 1);
      const e = REC[nm] && REC[nm].get(sel);
      if (!e) return "not learned yet: use it once in a match";
      try { ORIG[nm](...e.a); return "fired"; } catch (err) { return "ERR " + err.message; }
    };

    // ================= UI (liquid glass, same look as the fish menu) =================
    const spring = "cubic-bezier(.34,1.56,.64,1)";
    const MONO = "ui-monospace,Menlo,Consolas,monospace";
    const css = [
      ".p{position:relative;width:300px;color:#000;font:13px -apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;border-radius:34px;",
      "background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.04));-webkit-backdrop-filter:blur(14px) saturate(190%) brightness(1.08);backdrop-filter:blur(14px) saturate(190%) brightness(1.08);",
      "box-shadow:0 18px 50px rgba(0,0,0,.35),0 2px 8px rgba(0,0,0,.2),inset 0 0 0 1px rgba(255,255,255,.1),inset 0 1px 1px rgba(255,255,255,.55);",
      "transition:transform .6s " + spring + ";user-select:none;overflow:hidden}",
      ".h,.b{position:relative;z-index:1}",
      ".h{padding:15px 18px 9px;display:flex;justify-content:space-between;align-items:center;cursor:grab;touch-action:none;font-weight:700;font-size:15px}",
      ".min{width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,.4);background:linear-gradient(160deg,rgba(255,255,255,.35),rgba(255,255,255,.1));box-shadow:inset 0 1px 1px rgba(255,255,255,.6);color:#000;font-size:15px;cursor:pointer;padding:0}",
      ".b{padding:2px 14px 16px;display:flex;flex-direction:column;gap:10px}.b.hide{display:none}",
      ".card{background:linear-gradient(160deg,rgba(255,255,255,.2),rgba(255,255,255,.06));border-radius:24px;padding:11px 13px;box-shadow:inset 0 1px 1px rgba(255,255,255,.5),inset 0 0 0 1px rgba(255,255,255,.12),0 4px 14px rgba(0,0,0,.12)}",
      ".row{display:flex;align-items:center;justify-content:space-between;gap:10px}",
      ".lbl{font-weight:600}.lbl small{display:block;opacity:.7;font-size:11px;font-weight:400;margin-top:1px}",
      ".btn{border:0;border-radius:16px;padding:0 13px;height:30px;background:linear-gradient(160deg,rgba(255,255,255,.34),rgba(255,255,255,.12));box-shadow:inset 0 1px 1px rgba(255,255,255,.6);color:#000;font:600 12px -apple-system,system-ui,sans-serif;cursor:pointer;flex:none;transition:transform .4s " + spring + "}",
      ".btn:active,.min:active{transform:scale(.88)}",
      ".step{display:flex;align-items:center;gap:2px;background:rgba(0,0,0,.22);border-radius:16px;padding:3px;box-shadow:inset 0 1px 3px rgba(0,0,0,.25),0 1px 0 rgba(255,255,255,.2)}",
      ".step button{width:28px;height:28px;border:0;border-radius:13px;background:linear-gradient(160deg,rgba(255,255,255,.34),rgba(255,255,255,.12));box-shadow:inset 0 1px 1px rgba(255,255,255,.6);color:#000;font-size:17px;cursor:pointer;padding:0}",
      ".step input{width:52px;text-align:center;background:transparent;border:0;color:#000;font:700 14px -apple-system,system-ui,sans-serif;outline:none;-moz-appearance:textfield;padding:0;user-select:text}",
      ".step input::-webkit-inner-spin-button,.step input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}",
      ".sw{width:50px;height:30px;border-radius:15px;background:rgba(255,255,255,.2);box-shadow:inset 0 1px 3px rgba(0,0,0,.28),0 1px 0 rgba(255,255,255,.25);position:relative;cursor:pointer;transition:background .3s;flex:none}",
      ".sw i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:12px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:transform .45s " + spring + "}",
      ".sw.on{background:rgba(52,199,89,.9)}.sw.on i{transform:translateX(20px)}",
      ".grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:230px;overflow-y:auto;padding:3px;margin-top:8px}",
      ".grid::-webkit-scrollbar{width:6px}.grid::-webkit-scrollbar-thumb{background:rgba(255,255,255,.3);border-radius:3px}",
      ".tile{height:54px;border-radius:17px;background:linear-gradient(160deg,rgba(255,255,255,.2),rgba(255,255,255,.06));box-shadow:inset 0 1px 1px rgba(255,255,255,.5),inset 0 0 0 1px rgba(255,255,255,.12);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;text-align:center;padding:0 4px;overflow:hidden;transition:transform .4s " + spring + "}",
      ".tile:hover{transform:scale(1.06)}.tile:active{transform:scale(.92)}",
      ".tile.sel{box-shadow:0 0 0 2px rgba(255,255,255,.95),0 0 20px rgba(120,200,255,.8),inset 0 1px 1px rgba(255,255,255,.6)}",
      ".tile span{font-weight:600;font-size:11.5px;line-height:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".tile em{font-style:normal;font-size:10px;opacity:.65}",
      ".empty{grid-column:1/-1;padding:18px 8px;text-align:center;opacity:.65;font-size:12px}",
      ".status{font:11px " + MONO + ";opacity:.85;min-height:13px;padding:0 6px;word-break:break-word}"
    ].join("");

    const el = (tag, props, kids) => {
      const n = document.createElement(tag);
      if (props) Object.assign(n, props);
      (kids || []).forEach((k) => n.appendChild(k));
      return n;
    };

    const host = el("div");
    host.style.cssText = "position:fixed;top:50px;left:12px;z-index:2147483647;";
    ["mousedown","mouseup","mousemove","click","dblclick","touchstart","touchmove","touchend","touchcancel",
     "pointerdown","pointermove","pointerup","pointercancel","wheel","contextmenu","keydown","keyup","keypress","input","change"]
      .forEach((ev) => host.addEventListener(ev, (e) => e.stopPropagation()));
    const root = host.attachShadow({ mode: "open" });

    const status = el("div", { className: "status" });
    const minBtn = el("button", { className: "min", textContent: "–" });
    const head = el("div", { className: "h" }, [el("span", { textContent: "Stickman Mod" }), minBtn]);

    // --- keybind ---
    let binding = false;
    const keyBtn = el("button", { className: "btn" });
    const showKey = () => { keyBtn.textContent = binding ? "press a key..." : S.key.length === 1 ? S.key.toUpperCase() : S.key; };
    keyBtn.onclick = () => { binding = true; showKey(); };
    const keyRow = el("div", { className: "card" }, [
      el("div", { className: "row" }, [
        el("div", { className: "lbl" }, [document.createTextNode("Ability key"), el("small", { textContent: "fires the picked ability" })]),
        keyBtn
      ])
    ]);

    // --- spam toggle + speed ---
    const spamSw = el("div", { className: "sw" }, [el("i")]);
    const input = el("input", { type: "number", min: 1, max: 2000, step: 1, value: S.rate });
    const setRate = (v) => { v = Math.floor(+v); if (!(v >= 1)) v = 1; if (v > 2000) v = 2000; S.rate = v; input.value = v; };
    const minus = el("button", { textContent: "−" }), plus = el("button", { textContent: "+" });
    input.onchange = () => setRate(input.value);
    minus.onclick = () => setRate(S.rate - (S.rate > 20 ? 10 : 1));
    plus.onclick = () => setRate(S.rate + (S.rate >= 20 ? 10 : 1));
    const spamRow = el("div", { className: "card" }, [
      el("div", { className: "row" }, [
        el("div", { className: "lbl" }, [document.createTextNode("Spam while held"), el("small", { textContent: "repeat delay in ms" })]),
        spamSw
      ]),
      el("div", { className: "row", style: "margin-top:8px" }, [
        el("div", { className: "lbl", textContent: "Delay" }),
        el("div", { className: "step" }, [minus, input, plus])
      ])
    ]);
    spamSw.onclick = () => { S.spam = !S.spam; spamSw.classList.toggle("on", S.spam); };

    // --- ability picker ---
    const grid = el("div", { className: "grid" });
    const fireBtn = el("button", { className: "btn", textContent: "Fire now" });
    const forgetBtn = el("button", { className: "btn", textContent: "Forget all" });
    const pickRow = el("div", { className: "card" }, [
      el("div", { className: "row" }, [
        el("div", { className: "lbl" }, [document.createTextNode("Abilities"), el("small", { textContent: "learned as you use them" })]),
        el("div", { className: "row", style: "gap:6px" }, [fireBtn, forgetBtn])
      ]),
      grid
    ]);

    const short = (nm) => nm.replace(/Abilit(y|ies)$/i, "").replace(/^./, (c) => c.toUpperCase());
    let shown = -1;
    const render = () => {
      shown = sig;
      grid.innerHTML = "";
      let n = 0;
      Object.keys(REC).forEach((nm) => REC[nm].forEach((e, sel) => {
        const k = nm + "|" + sel;
        const t = el("div", { className: "tile" + (S.pick === k ? " sel" : ""), title: k + "  (double-click to rename)" },
          [el("span", { textContent: S.names[k] || short(nm) }), el("em", { textContent: "#" + sel })]);
        t.onclick = () => {
          S.pick = k;
          grid.querySelectorAll(".tile").forEach((x) => x.classList.toggle("sel", x === t));
          status.textContent = "picked " + (S.names[k] || k);
        };
        t.ondblclick = () => {
          const v = prompt("Name for " + k, S.names[k] || "");
          if (v !== null) { if (v.trim()) S.names[k] = v.trim(); else delete S.names[k]; render(); }
        };
        grid.appendChild(t); n++;
      }));
      if (!n) grid.appendChild(el("div", { className: "empty", textContent: "Use abilities in a match. Each one shows up here." }));
    };
    setInterval(() => { if (shown !== sig) render(); }, 400);

    const doFire = () => {
      if (!S.pick) { status.textContent = "pick an ability first"; return; }
      const r = fire(S.pick);
      if (r !== "fired") status.textContent = r;
    };
    fireBtn.onclick = doFire;
    forgetBtn.onclick = () => { Object.keys(REC).forEach((k) => delete REC[k]); sig++; status.textContent = "cleared"; };

    // --- export everything recorded (copy or .txt download) ---
    const logSw = el("div", { className: "sw" }, [el("i")]);
    logSw.onclick = () => {
      logging = !logging; logSw.classList.toggle("on", logging);
      status.textContent = logging ? "logging every call (can be heavy)" : "full log off";
    };
    const buildText = () => {
      const out = ["# learned abilities: name | selector (arg 3) | args | calls"];
      Object.keys(REC).forEach((nm) => REC[nm].forEach((e, sel) => out.push(nm + " | " + sel + " | " + e.a.join(",") + " | x" + e.n)));
      if (LOG.size) {
        out.push("", "# full call log: name | args | calls");
        LOG.forEach((l) => out.push(l.fn + " | " + l.a.join(",") + " | x" + l.n));
      }
      return out.join("\n");
    };
    const copyFallback = (txt) => {
      const t = document.createElement("textarea");
      t.value = txt; document.body.appendChild(t); t.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      t.remove(); status.textContent = ok ? "copied to clipboard" : "copy failed, use Save .txt";
    };
    const copyBtn = el("button", { className: "btn", textContent: "Copy log" });
    copyBtn.onclick = () => {
      const txt = buildText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => { status.textContent = "copied to clipboard"; }, () => copyFallback(txt));
      } else copyFallback(txt);
    };
    const saveBtn = el("button", { className: "btn", textContent: "Save .txt" });
    saveBtn.onclick = () => {
      const a = el("a", { href: URL.createObjectURL(new Blob([buildText()], { type: "text/plain" })), download: "stickman-abilities.txt" });
      document.body.appendChild(a); a.click(); a.remove();
      status.textContent = "saved stickman-abilities.txt";
    };
    const exportRow = el("div", { className: "card" }, [
      el("div", { className: "row" }, [
        el("div", { className: "lbl" }, [document.createTextNode("Export recorded"), el("small", { textContent: "abilities and their calls" })]),
        el("div", { className: "row", style: "gap:6px" }, [copyBtn, saveBtn])
      ]),
      el("div", { className: "row", style: "margin-top:8px" }, [
        el("div", { className: "lbl" }, [document.createTextNode("Log every call"), el("small", { textContent: "adds all variants to the export" })]),
        logSw
      ])
    ]);

    const body = el("div", { className: "b" }, [keyRow, spamRow, pickRow, exportRow, status]);
    const panel = el("div", { className: "p" }, [head, body]);
    root.appendChild(el("style", { textContent: css }));
    root.appendChild(panel);
    document.body.appendChild(host);

    // --- keyboard: tap fires once, hold repeats ---
    let tm = null;
    addEventListener("keydown", (e) => {
      if (binding) {
        e.preventDefault(); e.stopPropagation();
        S.key = e.key.toLowerCase(); binding = false; showKey();
        status.textContent = "key set to " + S.key; return;
      }
      if (e.key.toLowerCase() !== S.key || e.repeat) return;
      const t = e.composedPath()[0];
      if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      doFire();
      if (S.spam) { clearInterval(tm); tm = setInterval(doFire, S.rate); }
    }, true);
    addEventListener("keyup", (e) => {
      if (e.key.toLowerCase() === S.key) { clearInterval(tm); tm = null; }
    }, true);
    addEventListener("blur", () => { clearInterval(tm); tm = null; });

    // --- drag + minimize ---
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const keepOnScreen = () => {
      host.style.left = clamp(host.offsetLeft, 0, Math.max(0, innerWidth - host.offsetWidth)) + "px";
      host.style.top = clamp(host.offsetTop, 0, Math.max(0, innerHeight - host.offsetHeight)) + "px";
    };
    if (saved.pos) { host.style.left = saved.pos.l + "px"; host.style.top = saved.pos.t + "px"; }
    if (saved.min) body.classList.add("hide");
    keepOnScreen();
    addEventListener("resize", keepOnScreen);
    let dx = 0, dy = 0, drag = false;
    head.addEventListener("pointerdown", (e) => {
      if (e.target === minBtn) return;
      drag = true; dx = e.clientX - host.offsetLeft; dy = e.clientY - host.offsetTop;
      head.setPointerCapture(e.pointerId); panel.style.transform = "scale(1.03)";
    });
    head.addEventListener("pointermove", (e) => {
      if (!drag) return;
      host.style.left = clamp(e.clientX - dx, 0, Math.max(0, innerWidth - host.offsetWidth)) + "px";
      host.style.top = clamp(e.clientY - dy, 0, Math.max(0, innerHeight - host.offsetHeight)) + "px";
    });
    const endDrag = () => { drag = false; panel.style.transform = ""; };
    head.addEventListener("pointerup", endDrag);
    head.addEventListener("pointercancel", endDrag);
    minBtn.onclick = () => body.classList.toggle("hide");

    // --- save settings every 2 seconds ---
    let last = "";
    setInterval(() => {
      try {
        const json = JSON.stringify({ key: S.key, spam: S.spam, rate: S.rate, pick: S.pick, names: S.names,
          pos: { l: host.offsetLeft, t: host.offsetTop }, min: body.classList.contains("hide") });
        if (json !== last) { localStorage.setItem(KEY, json); last = json; }
      } catch (e) {}
    }, 2000);

    showKey(); setRate(S.rate); spamSw.classList.toggle("on", S.spam); render();
    status.textContent = "hooked " + Object.keys(ORIG).length + "/" + A.length + (skipped.length ? ", skipped: " + skipped.join(", ") : "");
    console.log("stickman mod loaded: hooked", Object.keys(ORIG).length, "skipped", skipped);
  }
})();