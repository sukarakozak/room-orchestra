# Room Orchestra

**Premises:** 01 Agency × 06 Context
**Live link:** https://YOUR-USERNAME.github.io/premise-remix/

Every key on the keyboard is an object-musician on a round stage (teacups, kettles, metronomes, tin cans, led by an alarm-clock conductor). The loudness of the room decides how far a key reaches: in a quiet room one key plays one object and 5–8 notes fall from the clouds, in a busy room its whole row plays and 10–15 notes fall, in a loud room the whole band plays and every falling note is blown away. Click the curtain to reveal a gramophone soloist; click the street lamp to light the stage (try NIGHT).

## How to use

1. Open the link. Choose **LISTEN TO THE ROOM** (microphone) or **USE THE SPACE KEY INSTEAD**.
2. Play the keys **1–0, Q–P, A–L, Z–M**, or click a musician.
3. The HUD shows the room (`quiet / busy / loud` and %) and your agency (`full / group / single`). The caption under the stage says it in words.

**Alternative input (no microphone, no mouse):** **Space** sets the room by hand (quiet → busy → loud). **Enter** goes back to the microphone. **↑** opens/closes the curtain, **↓** turns the street lamp on/off.

## Where the premises live (`script.js`)

| Premise | Where |
|---|---|
| Context | `readRoom()` reads the microphone; `roomStateFor()` sorts the level into quiet / busy / loud |
| Agency | `ruleFor()` decides who plays when you press a key |
| Where they meet | `updateAgency()` + `inQuiet / inBusy / inLoud` in `design` |

All numbers and rules are in the `design` object at the top of `script.js`, and can also be changed live in the **CODE** tab.

## Credits

- Built on the engine and shell of **Key Orchestra** (premise 01 · Agency) and **Letter Rain** (premise 06 · Context) from the **Interactive Media Applications lab., Mert Seven, PhD** — https://mertseven.com/ima/lab/ . The engine (`engine.js`, `shell.js`, `runner.js`), styles and fonts are the lab's; see `LAB-README.md`. Everything in `script.js` and `room.css` (modern fonts) is my design: the stage, object-musicians, conductor, soloist, clouds, street lamp, audience recipes, microphone/room reading, the room → agency rule and the note rain. The lab's own bandstand scene is hidden.
- Key Orchestra itself is after *Patatap* — Jono Brandel & Lullatone (2014).
- three.js (MIT licence) in `vendor/`. Fonts in `fonts/` are open-licence fonts bundled by the lab.

## AI note

<!-- FILL IN YOURSELF: which tools you used and for what, plus one example you rejected or corrected. -->
- Tool(s) used: …
- What for: …
- One thing I rejected or corrected: …
