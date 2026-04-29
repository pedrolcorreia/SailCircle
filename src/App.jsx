import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { hasSupabaseConfig, supabase } from "./lib/supabase";

const fallbackSailors = [
  { id: 1, name: "Marta & João", boat: "Beneteau 36", status: "Looking for crew", location: "Cascais Marina", trip: "Cascais → Lagos", date: "May 12", skill: "Coastal cruising", latitude: 38.6979, longitude: -9.4215 },
  { id: 2, name: "Sofie", boat: "X-Yachts 34", status: "Open to meet", location: "Copenhagen", trip: "Øresund weekend sail", date: "May 18", skill: "Racing", latitude: 55.6761, longitude: 12.5683 },
  { id: 3, name: "Andreas", boat: "Hallberg-Rassy 42", status: "Planning passage", location: "Kiel", trip: "Kiel → Bornholm", date: "June 2", skill: "Offshore", latitude: 54.3233, longitude: 10.1228 },
  { id: 4, name: "Lea", boat: "No boat", status: "Wants to join", location: "Mallorca", trip: "Balearic Islands", date: "Flexible", skill: "Beginner", latitude: 39.5696, longitude: 2.6502 },
];

const fallbackTrips = [
  { id: 1, title: "Weekend sail around Øresund", route: "Copenhagen → Helsingør → Ven", spots: 2, date: "18–19 May", level: "Beginner friendly", host: "Sofie", description: "A relaxed weekend trip around Øresund for sailors who want to meet others and gain coastal sailing experience.", meeting_point: "Copenhagen Marina", cost_notes: "Shared food and marina costs.", requirements: "Beginner friendly, but bring waterproof clothing." },
  { id: 2, title: "Portugal coastal cruise", route: "Cascais → Sines → Lagos", spots: 1, date: "12–17 May", level: "Intermediate", host: "Marta & João", description: "A coastal cruise down the Portuguese coast with stops in Sines and Lagos.", meeting_point: "Cascais Marina", cost_notes: "Shared fuel, food, and marina costs.", requirements: "Some sailing experience preferred." },
  { id: 3, title: "Baltic mini passage", route: "Kiel → Bornholm", spots: 3, date: "2–6 June", level: "Offshore experience", host: "Andreas", description: "A longer passage for people interested in offshore conditions and watch planning.", meeting_point: "Kiel harbour", cost_notes: "Shared expenses agreed before departure.", requirements: "Comfortable with overnight sailing." },
];

const fallbackForumPosts = [
  { id: 1, title: "Best apps for weather routing in the Baltic?", replies: 18, tag: "Navigation", author: "Sofie" },
  { id: 2, title: "How do you split costs fairly with guest crew?", replies: 34, tag: "Crew", author: "Marta" },
  { id: 3, title: "First overnight passage — what should I prepare?", replies: 12, tag: "Beginner", author: "Lea" },
];

const sailIcon = L.divIcon({ html: "<div class='sail-marker'>⛵</div>", className: "", iconSize: [32, 32], iconAnchor: [16, 16] });

function Button({ children, variant = "solid", className = "", ...props }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const styles = variant === "outline" ? "border border-white/20 bg-white/5 text-white hover:bg-white/10" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}
function Card({ children, className = "" }) { return <div className={`rounded-3xl border border-white/10 bg-white/5 shadow-xl ${className}`}>{children}</div>; }
function TextInput(props) { return <input {...props} className={`rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 ${props.className || ""}`} />; }
function TextArea(props) { return <textarea {...props} className={`min-h-28 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 ${props.className || ""}`} />; }

function AddTripForm({ onTripCreated }) {
  const [form, setForm] = useState({ title: "", route: "", spots: 1, date: "", level: "Beginner friendly", host: "", description: "", meeting_point: "", cost_notes: "", requirements: "" });
  const [message, setMessage] = useState("");
  async function submitTrip(event) {
    event.preventDefault(); setMessage("");
    const newTrip = { ...form, spots: Number(form.spots), description: form.description || "More details to be confirmed by the host.", meeting_point: form.meeting_point || "To be confirmed", cost_notes: form.cost_notes || "To be agreed between skipper and crew.", requirements: form.requirements || "To be confirmed" };
    if (!hasSupabaseConfig) { onTripCreated({ ...newTrip, id: crypto.randomUUID() }); setMessage("Demo mode: trip added locally."); return; }
    const { data, error } = await supabase.from("trips").insert(newTrip).select().single();
    if (error) { setMessage(error.message); return; }
    onTripCreated(data); setMessage("Trip created and saved.");
    setForm({ title: "", route: "", spots: 1, date: "", level: "Beginner friendly", host: "", description: "", meeting_point: "", cost_notes: "", requirements: "" });
  }
  function update(field, value) { setForm((old) => ({ ...old, [field]: value })); }
  return <Card className="mt-8" id="create-trip-form"><form onSubmit={submitTrip} className="grid gap-4 p-6 md:grid-cols-3">
    <div className="md:col-span-3"><h3 className="text-2xl font-bold">Create a sailing trip</h3><p className="mt-2 text-sm text-slate-400">Post a route, explain the trip, and invite others to request a spot.</p></div>
    <TextInput required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Trip title" />
    <TextInput required value={form.route} onChange={(e) => update("route", e.target.value)} placeholder="Route, e.g. Copenhagen → Ven" />
    <TextInput required value={form.date} onChange={(e) => update("date", e.target.value)} placeholder="Date" />
    <TextInput required value={form.host} onChange={(e) => update("host", e.target.value)} placeholder="Host name" />
    <TextInput required type="number" min="1" value={form.spots} onChange={(e) => update("spots", e.target.value)} placeholder="Spots" />
    <select value={form.level} onChange={(e) => update("level", e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none"><option>Beginner friendly</option><option>Intermediate</option><option>Offshore experience</option><option>Racing</option></select>
    <TextArea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Trip description" className="md:col-span-3" />
    <TextInput value={form.meeting_point} onChange={(e) => update("meeting_point", e.target.value)} placeholder="Meeting point" />
    <TextInput value={form.cost_notes} onChange={(e) => update("cost_notes", e.target.value)} placeholder="Cost notes" />
    <TextInput value={form.requirements} onChange={(e) => update("requirements", e.target.value)} placeholder="Requirements" />
    <Button className="md:col-span-3">＋ Create trip</Button>{message && <p className="md:col-span-3 text-sm text-cyan-200">{message}</p>}
  </form></Card>;
}

function TripDetail({ trip, onClose }) {
  const [name, setName] = useState(""); const [message, setMessage] = useState(""); const [status, setStatus] = useState("");
  if (!trip) return null;
  async function requestJoin(event) {
    event.preventDefault(); setStatus("");
    if (!hasSupabaseConfig) { setStatus("Demo mode: request created locally."); setName(""); setMessage(""); return; }
    const { error } = await supabase.from("trip_requests").insert({ trip_id: trip.id, name, message });
    if (error) { setStatus(error.message); return; }
    setStatus("Request sent and saved."); setName(""); setMessage("");
  }
  return <Card className="mt-8 border-cyan-300/30 bg-cyan-300/10"><div className="p-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><p className="text-sm font-semibold text-cyan-200">Trip details</p><h3 className="mt-2 text-3xl font-bold">{trip.title}</h3><p className="mt-2 text-slate-300">🧭 {trip.route}</p></div><Button variant="outline" onClick={onClose}>Close</Button></div>
    <div className="mt-6 grid gap-4 md:grid-cols-4"><div><p className="text-xs text-slate-400">Date</p><p className="font-semibold">{trip.date}</p></div><div><p className="text-xs text-slate-400">Host</p><p className="font-semibold">{trip.host}</p></div><div><p className="text-xs text-slate-400">Level</p><p className="font-semibold">{trip.level}</p></div><div><p className="text-xs text-slate-400">Open spots</p><p className="font-semibold">{trip.spots}</p></div></div>
    <div className="mt-6 grid gap-4 md:grid-cols-2"><Card><div className="p-5"><p className="text-sm font-semibold text-cyan-200">Description</p><p className="mt-2 text-sm leading-6 text-slate-300">{trip.description || "No description yet."}</p></div></Card><Card><div className="p-5"><p className="text-sm font-semibold text-cyan-200">Meeting point</p><p className="mt-2 text-sm leading-6 text-slate-300">{trip.meeting_point || "To be confirmed."}</p></div></Card><Card><div className="p-5"><p className="text-sm font-semibold text-cyan-200">Costs</p><p className="mt-2 text-sm leading-6 text-slate-300">{trip.cost_notes || "To be agreed."}</p></div></Card><Card><div className="p-5"><p className="text-sm font-semibold text-cyan-200">Requirements</p><p className="mt-2 text-sm leading-6 text-slate-300">{trip.requirements || "To be confirmed."}</p></div></Card></div>
    <form onSubmit={requestJoin} className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5"><h4 className="text-xl font-bold">Request to join this trip</h4><TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /><TextArea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell the host why you want to join, your experience, and availability." /><Button>Send request</Button>{status && <p className="text-sm text-cyan-200">{status}</p>}</form>
  </div></Card>;
}

function ForumDetail({ post, comments, onClose, onCommentCreated }) {
  const [author, setAuthor] = useState(""); const [comment, setComment] = useState(""); const [status, setStatus] = useState("");
  if (!post) return null;
  async function submitComment(event) {
    event.preventDefault(); setStatus(""); const newComment = { post_id: post.id, author, comment };
    if (!hasSupabaseConfig) { onCommentCreated({ ...newComment, id: crypto.randomUUID(), created_at: new Date().toISOString() }); setAuthor(""); setComment(""); setStatus("Demo mode: comment added locally."); return; }
    const { data, error } = await supabase.from("forum_comments").insert(newComment).select().single();
    if (error) { setStatus(error.message); return; }
    onCommentCreated(data); setAuthor(""); setComment(""); setStatus("Comment posted.");
  }
  return <Card className="mt-8 border-cyan-300/30 bg-cyan-300/10"><div className="p-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{post.tag}</span><h3 className="mt-3 text-3xl font-bold">{post.title}</h3><p className="mt-2 text-sm text-slate-400">Started by {post.author}</p></div><Button variant="outline" onClick={onClose}>Close</Button></div>
    <div className="mt-6 grid gap-4"><h4 className="text-xl font-bold">Comments</h4>{comments.length === 0 ? <p className="text-sm text-slate-400">No comments yet. Be the first to reply.</p> : comments.map((item) => <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><p className="font-semibold">{item.author}</p><p className="mt-2 text-sm leading-6 text-slate-300">{item.comment}</p></div>)}</div>
    <form onSubmit={submitComment} className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5"><h4 className="text-xl font-bold">Add a comment</h4><TextInput required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" /><TextArea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write your comment..." /><Button>Post comment</Button>{status && <p className="text-sm text-cyan-200">{status}</p>}</form>
  </div></Card>;
}

function NewTopicForm({ onPostCreated, onClose }) {
  const [form, setForm] = useState({ title: "", tag: "General", author: "" }); const [status, setStatus] = useState("");
  async function submitPost(event) {
    event.preventDefault(); setStatus(""); const newPost = { ...form, replies: 0 };
    if (!hasSupabaseConfig) { onPostCreated({ ...newPost, id: crypto.randomUUID() }); setStatus("Demo mode: topic created locally."); return; }
    const { data, error } = await supabase.from("forum_posts").insert(newPost).select().single();
    if (error) { setStatus(error.message); return; }
    onPostCreated(data); setStatus("Topic created."); setForm({ title: "", tag: "General", author: "" });
  }
  return <Card className="mb-8 border-cyan-300/30 bg-cyan-300/10"><form onSubmit={submitPost} className="grid gap-4 p-6 md:grid-cols-3"><div className="flex items-start justify-between md:col-span-3"><div><h3 className="text-2xl font-bold">Start a new forum topic</h3><p className="mt-2 text-sm text-slate-400">Ask about routes, gear, trip planning, safety, costs, or anything sailing-related.</p></div><Button type="button" variant="outline" onClick={onClose}>Close</Button></div><TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Topic title" className="md:col-span-2" /><TextInput required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Your name" /><select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none"><option>General</option><option>Navigation</option><option>Crew</option><option>Beginner</option><option>Safety</option><option>Gear</option><option>Destinations</option></select><Button className="md:col-span-2">Create topic</Button>{status && <p className="md:col-span-3 text-sm text-cyan-200">{status}</p>}</form></Card>;
}

function App() {
  const [query, setQuery] = useState(""); const [sailors, setSailors] = useState(fallbackSailors); const [trips, setTrips] = useState(fallbackTrips); const [forumPosts, setForumPosts] = useState(fallbackForumPosts); const [comments, setComments] = useState([]); const [selectedSailor, setSelectedSailor] = useState(fallbackSailors[0]); const [selectedTrip, setSelectedTrip] = useState(null); const [selectedPost, setSelectedPost] = useState(null); const [showNewTopic, setShowNewTopic] = useState(false);
  const mapRef = useRef(null); const tripsRef = useRef(null); const tripFormRef = useRef(null); const forumRef = useRef(null);
  useEffect(() => { async function loadData() { if (!hasSupabaseConfig) return; const [sailorsRes, tripsRes, postsRes, commentsRes] = await Promise.all([supabase.from("sailors").select("*").order("created_at", { ascending: false }), supabase.from("trips").select("*").order("created_at", { ascending: false }), supabase.from("forum_posts").select("*").order("created_at", { ascending: false }), supabase.from("forum_comments").select("*").order("created_at", { ascending: true })]); if (!sailorsRes.error && sailorsRes.data?.length) { setSailors(sailorsRes.data); setSelectedSailor(sailorsRes.data[0]); } if (!tripsRes.error && tripsRes.data?.length) setTrips(tripsRes.data); if (!postsRes.error && postsRes.data?.length) setForumPosts(postsRes.data); if (!commentsRes.error && commentsRes.data?.length) setComments(commentsRes.data); } loadData(); }, []);
  const filteredTrips = useMemo(() => { const q = query.toLowerCase(); return trips.filter((trip) => `${trip.title} ${trip.route} ${trip.level} ${trip.host}`.toLowerCase().includes(q)); }, [query, trips]);
  const selectedPostComments = comments.filter((comment) => String(comment.post_id) === String(selectedPost?.id));
  function scrollTo(ref) { ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function openTrip(trip) { setSelectedTrip(trip); setTimeout(() => scrollTo(tripsRef), 50); }
  function openPost(post) { setSelectedPost(post); setTimeout(() => scrollTo(forumRef), 50); }
  return <div className="min-h-screen bg-slate-950 text-white"><header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><button onClick={() => scrollTo(mapRef)} className="flex items-center gap-3 text-left"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-2xl text-slate-950 shadow-lg shadow-cyan-400/20">⛵</div><div><p className="text-lg font-bold tracking-tight">SailCircle</p><p className="text-xs text-slate-400">Find sailors. Plan trips. Share the sea.</p></div></button><nav className="hidden gap-6 text-sm text-slate-300 md:flex"><button onClick={() => scrollTo(mapRef)} className="hover:text-white">Map</button><button onClick={() => scrollTo(tripsRef)} className="hover:text-white">Trips</button><button onClick={() => scrollTo(forumRef)} className="hover:text-white">Forum</button></nav><Button className="hidden bg-white hover:bg-cyan-100 sm:inline-flex" onClick={() => scrollTo(tripFormRef)}>Create trip</Button></div></header><main>
    <section ref={mapRef} id="map" className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[1.05fr_.95fr]"><div><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100"><span>🌊</span> {hasSupabaseConfig ? "Connected to Supabase" : "Demo mode"}</div><h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">Meet sailors nearby and turn routes into shared adventures.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Discover boaters on an interactive map, plan sailing holidays, invite crew, and discuss routes, gear, safety, and destinations in one simple community.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button onClick={() => scrollTo(mapRef)}><span className="mr-2">📍</span> Explore sailors</Button><Button variant="outline" onClick={() => scrollTo(tripFormRef)}><span className="mr-2">＋</span> Post a trip</Button></div></div><Card className="overflow-hidden rounded-[2rem] bg-white/10 shadow-2xl shadow-cyan-950/40"><div className="p-4"><div className="relative h-[430px] overflow-hidden rounded-[1.5rem]"><MapContainer center={[50.5, 5.5]} zoom={4} scrollWheelZoom={false} className="z-0"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{sailors.map((sailor) => <Marker key={sailor.id} position={[Number(sailor.latitude), Number(sailor.longitude)]} icon={sailIcon} eventHandlers={{ click: () => setSelectedSailor(sailor) }}><Popup><strong>{sailor.name}</strong><br />{sailor.boat}<br />{sailor.location}</Popup></Marker>)}</MapContainer>{selectedSailor && <div className="absolute bottom-5 left-5 right-5 z-[500] rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-white backdrop-blur-xl"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-bold">{selectedSailor.name}</p><p className="text-sm text-slate-300">{selectedSailor.boat} · {selectedSailor.location}</p></div><span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">{selectedSailor.status}</span></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><p>🧭 {selectedSailor.trip}</p><p>📅 {selectedSailor.date}</p><p>⭐ {selectedSailor.skill}</p></div></div>}</div></div></Card></section>
    <section className="border-y border-white/10 bg-white/[0.03]"><div className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3">{[["👥","Verified sailor profiles","Know who is onboard before accepting or joining a trip."],["⚓","Trip planning","Routes, dates, crew spots, costs, and shared checklists."],["🛡️","Safety-first community","Reviews, reports, and marina-based meetups for trust."]].map(([icon,title,text]) => <Card key={title}><div className="p-6"><div className="mb-4 text-3xl">{icon}</div><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div></Card>)}</div></section>
    <section ref={tripsRef} id="trips" className="mx-auto max-w-7xl px-5 py-16"><div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-semibold text-cyan-300">Open trips</p><h2 className="mt-2 text-4xl font-bold">Plan or join a sailing trip</h2></div><div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300"><span>🔎</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search route, level, destination..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 md:w-72" /></div></div><div className="grid gap-5 md:grid-cols-3">{filteredTrips.map((trip) => <Card key={trip.id} className="transition hover:-translate-y-1 hover:bg-white/10"><div className="p-6"><div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">{trip.level}</span><span className="text-sm text-slate-400">{trip.spots} spots</span></div><h3 className="text-xl font-bold text-white">{trip.title}</h3><p className="mt-3 text-sm text-slate-300">🧭 {trip.route}</p><p className="mt-2 text-sm text-slate-300">📅 {trip.date}</p><p className="mt-2 text-sm text-slate-400">Hosted by {trip.host}</p><div className="mt-5 grid gap-3"><Button className="w-full bg-white hover:bg-cyan-100" onClick={() => openTrip(trip)}>View details</Button><Button variant="outline" className="w-full" onClick={() => openTrip(trip)}>Request to join</Button></div></div></Card>)}</div><TripDetail trip={selectedTrip} onClose={() => setSelectedTrip(null)} /><div ref={tripFormRef}><AddTripForm onTripCreated={(newTrip) => { setTrips((old) => [newTrip, ...old]); setSelectedTrip(newTrip); }} /></div></section>
    <section ref={forumRef} id="forum" className="mx-auto max-w-7xl px-5 pb-16"><div className="mb-7 flex items-center justify-between"><div><p className="text-sm font-semibold text-cyan-300">Community forum</p><h2 className="mt-2 text-4xl font-bold">Discuss trips, gear, routes, and safety</h2></div><Button variant="outline" className="hidden md:inline-flex" onClick={() => setShowNewTopic(true)}><span className="mr-2">💬</span> New topic</Button></div>{showNewTopic && <NewTopicForm onClose={() => setShowNewTopic(false)} onPostCreated={(post) => { setForumPosts((old) => [post, ...old]); setSelectedPost(post); setShowNewTopic(false); }} />}<div className="grid gap-4">{forumPosts.map((post) => <Card key={post.id}><div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"><div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{post.tag}</span><h3 className="mt-3 text-lg font-semibold text-white">{post.title}</h3><p className="mt-1 text-sm text-slate-400">Started by {post.author}</p></div><div className="flex items-center gap-4 text-sm text-slate-300"><span>💬 {comments.filter((comment) => String(comment.post_id) === String(post.id)).length || post.replies || 0} replies</span><Button onClick={() => openPost(post)}>Open</Button></div></div></Card>)}</div><ForumDetail post={selectedPost} comments={selectedPostComments} onClose={() => setSelectedPost(null)} onCommentCreated={(comment) => setComments((old) => [...old, comment])} /></section>
  </main></div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

