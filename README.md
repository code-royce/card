# Bio card

My digital business card, made to be pulled up on a phone. The front has my photo and name. Tap it and it flips over to my contact info, a QR code that opens the card on someone else's phone, and a button that saves me to their contacts.

**Live:** https://code-royce.github.io/mp0/

![Front and back of the card at phone size](docs/screenshot.png)

## What it does

- Flips between front and back on a tap, a click, or the keyboard (Esc flips it back). On desktop it tilts a little toward the mouse. If your system is set to reduce motion, the tilt is off and the card crossfades instead of flipping.
- **Save contact** downloads a vCard (`jeffry-royce.vcf`) with my name, title, email, links and photo, so a phone can add me in one step.
- The QR code is drawn in the browser from the page's own address, so it keeps working if the site moves. No outside services.

## Changing the details

Everything on the card comes from [`src/contact.json`](src/contact.json): the text, the links, and the vCard. Edit it there and rebuild. The photo is `src/assets/jeffry-royce.jpg`.

## Run it locally

You need [Node.js](https://nodejs.org/). The first time, run `npm install`. After that:

```
npm start        # dev server at http://localhost:8080, reloads as you edit
npm run build    # writes the site to build/
```

Pushing to `main` builds the site and deploys it to GitHub Pages through `.github/workflows/static.yml`.

## Background

This started as MP0 for CS 409 (The Art of Web Programming) at UIUC, fall 2026: a static bio card in HTML and CSS. The original assignment is in [SPEC.md](SPEC.md), and the graded version is tagged `v1.0-submitted`. The makeover borrows the look of my personal site.
