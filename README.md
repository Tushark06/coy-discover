# Coy – Discover tab

Swipe-based discovery (React + Vite, Express, JSON-file persistence).

## Run
```
npm install        # also installs client deps
npm run dev        # API :4000, UI :5173
```
Prod-style: `npm run build && npm start` → http://localhost:4000

## API
- `GET /feed` – profiles not yet swiped on
- `POST /swipe` `{profileId, direction: "like"|"pass"}` → `{match, profile?}`
- `GET /matches` – mutual matches
- `POST /reset` – demo helper, re-seeds data

## Privacy
`likedMe` (who already liked the user) lives only in the server DB and is stripped from every response.
A profile is revealed as a "like" only via a match. Feed order is shuffled so likers can't be inferred.
Swipes are idempotent: a second swipe on the same profile returns 409.

## Part A – two feature suggestions
1. **Match icebreaker + 24h window** – after a mutual reveal, offer 3 tap-to-send openers and a 24h
   expiry nudge. Reveals are the app's peak moment; without a next step they fizzle, so this turns
   matches into conversations (retention + the actual outcome users want).
2. **Opt-out / block list** – let anyone block specific numbers from adding them as a crush.
   Coy's whole promise is trust; people who don't want to be on someone's list need control,
   which reduces harassment risk and makes users more comfortable signing up.
