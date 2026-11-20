const express = require('express'), cors = require('cors'), fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'db.json');

const names = ['Aanya','Riya','Kabir','Meera','Arjun','Isha','Rohan','Tara','Vikram','Naina','Dev','Sana','Kunal','Zoya','Aditya','Pooja','Rahul','Simran','Karan','Diya','Neil','Anika','Veer','Myra','Ishaan','Kiara','Yash','Ritika','Aarav','Sneha'];
const places = ['IIT Delhi','Delhi University','BITS Pilani','Mumbai','Bangalore','Pune','VIT Vellore','Jaipur','Hyderabad','NIT Trichy'];
const bios = ['Chai over coffee, always.','Will beat you at FIFA. Probably.','Weekend trekker, weekday overthinker.','Looking for someone to share fries with.','Plays guitar badly, loudly.','Ask me about my playlist.','Gym at 6am, memes at 6pm.','Fluent in sarcasm and Hindi film dialogues.'];
const interests = ['Music','Travel','Gym','Coding','Anime','Cricket','Coffee','Photography','Movies','Cooking','Gaming','Books','Hiking','Dance'];

// Server-side only: `likedMe` marks profiles that already liked the logged-in user. It is never sent to the client.
function seed() {
  const profiles = names.map((name, i) => ({
    id: i + 1, name, age: 19 + (i * 7) % 9,
    photo: `https://picsum.photos/seed/coy${i + 1}/480/640`,
    bio: bios[i % bios.length], place: places[(i * 3) % places.length],
    interests: [0, 1, 2].map(k => interests[(i * 3 + k * 5) % interests.length]),
    likedMe: i % 3 === 0, // 10 of 30
  }));
  // fixed shuffle so "likers" can't be inferred from feed order
  profiles.sort((a, b) => ((a.id * 17) % 31) - ((b.id * 17) % 31));
  return { profiles, swipes: {}, matches: [] };
}
const save = d => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
const load = () => { if (!fs.existsSync(FILE)) save(seed()); return JSON.parse(fs.readFileSync(FILE, 'utf8')); };
const pub = ({ likedMe, ...p }) => p;

const r = express.Router();
r.get('/feed', (_q, s) => { const d = load(); s.json(d.profiles.filter(p => !d.swipes[p.id]).map(pub)); });
r.post('/swipe', (q, s) => {
  const { profileId, direction } = q.body || {};
  const d = load(), p = d.profiles.find(x => x.id === profileId);
  if (!p || !['like', 'pass'].includes(direction)) return s.status(400).json({ error: 'Invalid swipe' });
  if (d.swipes[p.id]) return s.status(409).json({ error: 'Already swiped' });
  d.swipes[p.id] = direction;
  const match = direction === 'like' && p.likedMe; // mutual only
  if (match) d.matches.push(p.id);
  save(d);
  s.json({ match, profile: match ? pub(p) : undefined });
});
r.get('/matches', (_q, s) => { const d = load(); s.json(d.matches.map(id => pub(d.profiles.find(p => p.id === id)))); });
r.post('/reset', (_q, s) => { save(seed()); s.json({ ok: true }); }); // demo helper

const app = express();
app.use(cors(), express.json());
app.use(['/api', '/'], r);
const dist = path.join(__dirname, '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  // SPA fallback: any non-API route serves the app, so a refresh doesn't 404
  app.get('*', (q, s, next) => {
    if (q.path.startsWith('/api/') || ['/feed', '/swipe', '/matches', '/reset'].includes(q.path)) return next();
    s.sendFile(path.join(dist, 'index.html'));
  });
}
app.listen(4000, () => console.log('API on http://localhost:4000'));
