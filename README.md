# Break It — A Virtual Rage Room

Break It is a browser-based interactive media project: a private, symbolic space for writing down a thought and gradually breaking a virtual object. It is built with HTML, CSS, and vanilla JavaScript. No build step or account is required to use it.

## Run locally

Open `index.html` in a modern browser. The site also works as a static website hosted from the repository root. Styles, scripts, and sounds use relative paths, so they work under a GitHub Pages project URL. The interface uses Google Fonts when available and falls back to local fonts if they cannot load.

## How to use it

1. Choose a plate, bottle, or cup and optionally write a message.
2. Choose Light, Medium, or Heavy impact, then click or tap the object. You can also focus it and press Enter or Space.
3. Watch the cracks accumulate. When the object breaks, its fragments and message scatter.
4. Use Reset to clear the message and start again. Selecting an object starts a fresh object while retaining the message. Selecting the current object also starts it over.
5. Sound starts muted; use the sound control to enable it. The browser's audio support and playback settings can affect which sounds play.

Personal messages are held in the page's memory and are not saved or sent by the project. Reloading clears the message. The page requests fonts from Google when network access is available; the message is not included in those font requests.

## Interaction logic

The program tracks the selected object, message, impact strength, durability, accumulated damage, hit count, and object state. The plate has 12 durability points, the bottle 8, and the cup 16. Each hit adds its selected strength: Light = 1, Medium = 3, Heavy = 5. The ratio of accumulated damage to durability determines the state:

| Damage | State |
| --- | --- |
| Below 25% | Intact |
| 25% to below 65% | Lightly cracked |
| 65% to below 100% | Heavily cracked |
| 100% or more | Broken |

A hit can skip a state. Each registered hit leaves generated cracks, even when the status still reads Intact. Clicking outside the object's surface does not count. The click position determines the origin of the cracks; object type and impact strength determine their style and reach. Each object's five crack arrangements are selected with variation, avoiding immediate repeats. The cup handle is part of its clickable and crackable surface.

Sound uses different recorded layers for each object and strength. Additional fracture and debris layers depend on the damage present **before** a hit; the breaking hit has its own sound. The sound is an expressive approximation, not a physics simulation. Fragments follow new lines radiating from the final hit rather than every earlier crack.

## Project files

- `index.html` — structure and controls
- `styles.css` — appearance, responsive layout, and animations
- `script.js` — interaction state, generated fractures, and audio
- `assets/audio/` — local sound recordings; credits below

`smash()` adds damage and chooses a state; `addCracks()` generates the fracture paths; `renderObject()` updates the page; `shatter()` animates the fragments; `buildSoundLayers()` and `playImpact()` select and play sound; and `resetObject()` starts an object over. Event listeners connect the controls, message, keyboard, and pointer interactions to those functions.

## Testing checklist

- Try each object and verify its surface, including the cup handle, responds to clicks.
- On the plate, strike once each with Light, Medium, Heavy, and Medium. The damage totals should be 1, 4, 9, and 12; the fourth hit breaks it.
- Compare Light hits across objects; the bottle breaks after 8, the plate after 12, and the cup after 16.
- Check that cracks persist, the message remains visible during cracking, and the break animation and reflection appear.
- Test Reset, switching objects, the sound toggle, keyboard interaction, reduced motion, and a narrow screen.
- Reload and confirm the message is cleared. Test the hosted site with sound in the browser used for submission.

## Asset and license credits

The objects, interface, and crack illustrations are drawn with project HTML, CSS, and SVG. The following audio recordings are used under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Some clips are shortened, layered, or played at altered speeds. Freesound MP3 files are its audio previews.

- Plate impacts: [Various Small Ceramic Plate Hits](https://freesound.org/people/Erbsland-Music/sounds/634131/) by Erbsland-Music.
- Ceramic break: [Plate Break 3.wav](https://freesound.org/people/jc.sg/sounds/565640/) by jc.sg.
- Cup impacts: [Tapping of nails on ceramic cup](https://freesound.org/people/Penny_1527/sounds/849319/) by Penny_1527.
- Glass tap: [Glass Tap.wav](https://freesound.org/people/Unicornaphobist/sounds/262958/) by Unicornaphobist.
- Glass fractures, debris, and stone-based impact layers: [75 CC0 breaking / falling / hit sfx](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx) by rubberduck.

The page loads DM Sans, Playfair Display, and Kalam from [Google Fonts](https://fonts.google.com/). The fonts are offered under the [SIL Open Font License](https://openfontlicense.org/); they are served remotely and are not included in this repository.
