# Room Orchestra — Design rationale

**Live link:** https://sukarakozak.github.io/room-orchestra/

## Idea

Every key on the keyboard is an object-musician on a festival stage: teacups, kettles, metronomes and tin cans, led by an old radio. Pressing a key makes its object play and notes rain from the clouds. But the participant is never alone: the microphone listens, and the loudness of the room decides how far one key reaches — one object, one row, or the whole band.

## Agency and Context

Agency lives in `ruleFor()`: a key press always gets an answer, but the rule decides who answers. Context lives in `readRoom()` and `roomStateFor()`: the microphone level becomes quiet, busy or loud, and control only changes after the room has held that state for `modeHold` seconds. The two premises meet in one rule instead of sitting side by side. In a quiet room one key plays one object; in a busy room it plays its row; in a loud room it sets off the whole band and the falling notes explode outward. The tension is deliberate: the louder the room, the bigger your action, and the less precisely it is yours. The radio's four lights make this shift visible.

## Theory

Wardrip-Fruin et al. (2009) describe agency as the satisfaction of seeing your intentions matched by what the system allows. Because of this, no key is ever ignored: only the scope of the answer changes. For the same reason I removed idle note rain, since rain nobody caused blurred whose action was whose. Their account assumes a single player; here the room shares authorship.

Dey (2001) treats context as measurable information about a situation, which is how my code treats the room: one level, two thresholds. Dourish (2004) argues that context is produced by the activity itself. The `ignoreOwnSound` switch stages this disagreement: when on, the band does not hear itself (Dey); when off, the band's own sound changes the room and therefore the rule (Dourish).

## What I learned

Early versions rained notes and moved the audience even when nobody played. The stage looked lively, but the link between my key and the result disappeared. I set idle rain to zero and let the crowd react only after a key press, so every change on stage now has a cause the participant can trace.

---

## References

- Dey, A. K. (2001). Understanding and Using Context. *Personal and Ubiquitous Computing*, 5(1), 4–7. https://doi.org/10.1007/s007790170019
- Dourish, P. (2004). What We Talk About When We Talk About Context. *Personal and Ubiquitous Computing*, 8(1), 19–30. https://doi.org/10.1007/s00779-003-0253-8
- Wardrip-Fruin, N., Mateas, M., Dow, S., & Sali, S. (2009). Agency Reconsidered. *DiGRA 2009*. https://doi.org/10.26503/dl.v2009i1.369
