# CheckedIn Showreel

A 45-second, 1920×1080 Remotion brand film for CheckedIn. The reel moves from a
bold opener through QR check-in, verified arrival, live event attendance,
offline sync, and campus discovery to a branded end card. A slower, conversational
male neural voice-over runs on its own timeline, with a gentle continuous camera
drift and subtle looping movement in the phone, dashboard, and event cards.

## Preview

```console
npm install
npm run dev
```

Open `http://localhost:3001/CheckedIn-Showreel` in Remotion Studio. The scenes
are available individually in the `Scenes` folder. Studio uses port 3001 so
Remotion's render and composition-discovery commands can use their default port.

## Render

```console
npx remotion render CheckedIn-Showreel out/checkedin-showreel.mp4
```

The logo mark and opening sound cue are in `public/assets/`.
Seven scene-timed narration clips are in `public/assets/narration/` on a
separate `Voice-over` track, so you can adjust or replace each line in Studio.
