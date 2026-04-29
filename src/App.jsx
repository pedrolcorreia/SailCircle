import React, { useEffect, useMemo, useState } from "react";
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
  { id: 1, title: "Weekend sail around Øresund", route: "Copenhagen → Helsingør → Ven", spots: 2, date: "18–19 May", level: "Beginner friendly", host: "Sofie" },
  { id: 2, title: "Portugal coastal cruise", route: "Cascais → Sines → Lagos", spots: 1, date: "12–17 May", level: "Intermediate", host: "Marta & João" },
  { id: 3, title: "Baltic mini passage", route: "Kiel → Bornholm", spots: 3, date: "2–6 June", level: "Offshore experience", host: "Andreas" },
];

const fallbackForumPosts = [
  { id: 1, title: "Best apps for weather routing in the Baltic?", replies: 18, tag: "Navigation", author: "Sofie" },
  { id: 2, title: "How do you split costs fairly with guest crew?", replies: 34, tag: "Crew", author: "Marta" },
  { id: 3, title: "First overnight passage — what should I prepare?", replies: 12, tag: "Beginner", author: "Lea" },
];

const sailIcon = L.divIcon({
  html: "<div class='sail-marker'>⛵</div>",
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function Button({ children, variant = "solid", className = "", ...props }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition active:scale-[0.98]";
  const styles = variant === "outline"
    ? "border border-white/20 bg-white/5 text-white hover:bg-white/10"
    : "bg-cyan-400 text-slate-950 hover:bg-cyan-300";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/5 shadow-xl ${className}`}>{children}</div>;
}

function AddTripForm({ onTripCreated }) {
  const [form, setForm] = useState({
    title: "",
    route: "",
    spots: 1,
    date: "",
    level: "Beginner friendly",
    host: "",
  });
  const [message, setMessage] = useState("");

  async function submitTrip(event) {
    event.preventDefault();
    setMessage("");

    const newTrip = {
      ...form,
      spots: Number(form.spots),
    };

    if (!hasSupabaseConfig) {
      onTripCreated({ ...newTrip, id: crypto.randomUUID() });
      setMessage("Demo mode: trip added locally. Connect Supabase to save permanently.");
      setForm({ title: "", route: "", spots: 1, date: "", level: "Beginner friendly", host: "" });
      return;
    }

    const { data, error } = await supabase.from("trips").insert(newTrip).select().single();

    if (error) {
      setMessage(error.message);
      return;
    }

    onTripCreated(data);
    setMessage("Trip created.");
    setForm({ title: "", route: "", spots: 1, date: "", level: "Beginner friendly", host: "" });
  }

  function update(field, value) {
    setForm((old) => ({ ...old, [field]: value }));
  }

  return (
    <Card className="mt-8">
      <form onSubmit={submitTrip} className="grid gap-4 p-6 md:grid-cols-3">
        <input required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Trip title" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
        <input required value={form.route} onChange={(e) => update("route", e.target.value)} placeholder="Route, e.g. Copenhagen → Ven" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
        <input required value={form.date} onChange={(e) => update("date", e.target.value)} placeholder="Date" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
        <input required value={form.host} onChange={(e) => update("host", e.target.value)} placeholder="Host name" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
        <input required type="number" min="1" value={form.spots} onChange={(e) => update("spots", e.target.value)} placeholder="Spots" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500" />
        <select value={form.level} onChange={(e) => update("level", e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none">
          <option>Beginner friendly</option>
          <option>Intermediate</option>
          <option>Offshore experience</option>
          <option>Racing</option>
        </select>
        <Button className="md:col-span-3">＋ Create trip</Button>
        {message && <p className="md:col-span-3 text-sm text-cyan-200">{message}</p>}
      </form>
    </Card>
  );
}

function App() {
  const [query, setQuery] = useState("");
  const [sailors, setSailors] = useState(fallbackSailors);
  const [trips, setTrips] = useState(fallbackTrips);
  const [forumPosts, setForumPosts] = useState(fallbackForumPosts);
  const [selected, setSelected] = useState(fallbackSailors[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!hasSupabaseConfig) {
        setLoading(false);
        return;
      }

      const [sailorsRes, tripsRes, postsRes] = await Promise.all([
        supabase.from("sailors").select("*").order("created_at", { ascending: false }),
        supabase.from("trips").select("*").order("created_at", { ascending: false }),
        supabase.from("forum_posts").select("*").order("created_at", { ascending: false }),
      ]);

      if (!sailorsRes.error && sailorsRes.data?.length) {
        setSailors(sailorsRes.data);
        setSelected(sailorsRes.data[0]);
      }

      if (!tripsRes.error && tripsRes.data?.length) setTrips(tripsRes.data);
      if (!postsRes.error && postsRes.data?.length) setForumPosts(postsRes.data);

      setLoading(false);
    }

    loadData();
  }, []);

  const filteredTrips = useMemo(() => {
    const q = query.toLowerCase();
    return trips.filter((trip) => `${trip.title} ${trip.route} ${trip.level}`.toLowerCase().includes(q));
  }, [query, trips]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-2xl text-slate-950 shadow-lg shadow-cyan-400/20">⛵</div>
            <div>
              <p className="text-lg font-bold tracking-tight">SailCircle</p>
              <p className="text-xs text-slate-400">Find sailors. Plan trips. Share the sea.</p>
            </div>
          </div>
          <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
            <a href="#map" className="hover:text-white">Map</a>
            <a href="#trips" className="hover:text-white">Trips</a>
            <a href="#forum" className="hover:text-white">Forum</a>
          </nav>
          <Button className="hidden bg-white hover:bg-cyan-100 sm:inline-flex">Create trip</Button>
        </div>
      </header>

      <main>
        <section id="map" className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <span>🌊</span> {hasSupabaseConfig ? "Connected to Supabase" : "Demo mode — connect Supabase to save data"}
            </div>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
              Meet sailors nearby and turn routes into shared adventures.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Discover boaters on an interactive map, plan sailing holidays, invite crew, and discuss routes, gear, safety, and destinations in one community.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button><span className="mr-2">📍</span> Explore sailors</Button>
              <Button variant="outline"><span className="mr-2">＋</span> Post a trip</Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] bg-white/10 shadow-2xl shadow-cyan-950/40">
            <div className="p-4">
              <div className="relative h-[430px] overflow-hidden rounded-[1.5rem]">
                <MapContainer center={[50.5, 5.5]} zoom={4} scrollWheelZoom={false} className="z-0">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {sailors.map((sailor) => (
                    <Marker key={sailor.id} position={[Number(sailor.latitude), Number(sailor.longitude)]} icon={sailIcon} eventHandlers={{ click: () => setSelected(sailor) }}>
                      <Popup>
                        <strong>{sailor.name}</strong><br />
                        {sailor.boat}<br />
                        {sailor.location}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                {selected && (
                  <div className="absolute bottom-5 left-5 right-5 z-[500] rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-white backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold">{selected.name}</p>
                        <p className="text-sm text-slate-300">{selected.boat} · {selected.location}</p>
                      </div>
                      <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">{selected.status}</span>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <p>🧭 {selected.trip}</p>
                      <p>📅 {selected.date}</p>
                      <p>⭐ {selected.skill}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3">
            {[
              ["👥", "Verified sailor profiles", "Know who is onboard before accepting or joining a trip."],
              ["⚓", "Trip planning", "Routes, dates, crew spots, costs, and shared checklists."],
              ["🛡️", "Safety-first community", "Reviews, reports, and marina-based meetups for trust."],
            ].map(([icon, title, text]) => (
              <Card key={title}>
                <div className="p-6">
                  <div className="mb-4 text-3xl">{icon}</div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="trips" className="mx-auto max-w-7xl px-5 py-16">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-cyan-300">Open trips</p>
              <h2 className="mt-2 text-4xl font-bold">Plan or join a sailing trip</h2>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300">
              <span>🔎</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search route, level, destination..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500 md:w-72"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} className="transition hover:-translate-y-1 hover:bg-white/10">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">{trip.level}</span>
                    <span className="text-sm text-slate-400">{trip.spots} spots</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{trip.title}</h3>
                  <p className="mt-3 text-sm text-slate-300">🧭 {trip.route}</p>
                  <p className="mt-2 text-sm text-slate-300">📅 {trip.date}</p>
                  <p className="mt-2 text-sm text-slate-400">Hosted by {trip.host}</p>
                  <Button className="mt-5 w-full bg-white hover:bg-cyan-100">Request to join</Button>
                </div>
              </Card>
            ))}
          </div>

          <AddTripForm onTripCreated={(newTrip) => setTrips((old) => [newTrip, ...old])} />
        </section>

        <section id="forum" className="mx-auto max-w-7xl px-5 pb-16">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-300">Community forum</p>
              <h2 className="mt-2 text-4xl font-bold">Discuss trips, gear, routes, and safety</h2>
            </div>
            <Button variant="outline" className="hidden md:inline-flex"><span className="mr-2">💬</span> New topic</Button>
          </div>

          <div className="grid gap-4">
            {forumPosts.map((post) => (
              <Card key={post.id}>
                <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
                  <div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{post.tag}</span>
                    <h3 className="mt-3 text-lg font-semibold text-white">{post.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">Started by {post.author}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                    <span>💬 {post.replies} replies</span>
                    <Button>Open</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {loading && <p className="mt-6 text-sm text-slate-400">Loading backend data...</p>}
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
