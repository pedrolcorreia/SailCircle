import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { hasSupabaseConfig, supabase } from "./lib/supabase";

const LOCATIONS = [
  { city: "Copenhagen", country: "Denmark", region: "Europe", lat: 55.6761, lng: 12.5683 },
  { city: "Kiel", country: "Germany", region: "Europe", lat: 54.3233, lng: 10.1228 },
  { city: "Cascais", country: "Portugal", region: "Europe", lat: 38.6979, lng: -9.4215 },
  { city: "Lagos", country: "Portugal", region: "Europe", lat: 37.1028, lng: -8.6730 },
  { city: "Palma de Mallorca", country: "Spain", region: "Europe", lat: 39.5696, lng: 2.6502 },
  { city: "Athens", country: "Greece", region: "Europe", lat: 37.9838, lng: 23.7275 },
  { city: "Split", country: "Croatia", region: "Europe", lat: 43.5081, lng: 16.4402 },
  { city: "Annapolis", country: "USA", region: "North America", lat: 38.9784, lng: -76.4922 },
  { city: "San Diego", country: "USA", region: "North America", lat: 32.7157, lng: -117.1611 },
  { city: "Rio de Janeiro", country: "Brazil", region: "South America", lat: -22.9068, lng: -43.1729 },
  { city: "Cape Town", country: "South Africa", region: "Africa", lat: -33.9249, lng: 18.4241 },
  { city: "Singapore", country: "Singapore", region: "Asia", lat: 1.3521, lng: 103.8198 },
  { city: "Sydney", country: "Australia", region: "Oceania", lat: -33.8688, lng: 151.2093 },
];

const REGION_CENTER = {
  All: [30, 5, 2],
  Europe: [50.5, 10, 4],
  "North America": [39, -98, 3],
  "South America": [-15, -60, 3],
  Africa: [3, 20, 3],
  Asia: [25, 100, 3],
  Oceania: [-25, 140, 3],
};

const fallbackSailors = [
  { id: 1, name: "Marta & João", boat: "Beneteau 36", status: "Looking for crew", location: "Cascais Marina", trip: "Cascais → Lagos", date: "May 12", skill: "Coastal cruising", latitude: 38.6979, longitude: -9.4215 },
  { id: 2, name: "Sofie", boat: "X-Yachts 34", status: "Open to meet", location: "Copenhagen", trip: "Øresund weekend sail", date: "May 18", skill: "Racing", latitude: 55.6761, longitude: 12.5683 },
  { id: 3, name: "Andreas", boat: "Hallberg-Rassy 42", status: "Planning passage", location: "Kiel", trip: "Kiel → Bornholm", date: "June 2", skill: "Offshore", latitude: 54.3233, longitude: 10.1228 },
];

const fallbackTrips = [
  { id: 1, title: "Weekend sail around Øresund", route: "Copenhagen → Helsingør → Ven", spots: 2, date: "18–19 May", level: "Beginner friendly", host: "Sofie", description: "A relaxed weekend trip around Øresund.", meeting_point: "Copenhagen Marina", cost_notes: "Shared food and marina costs.", requirements: "Beginner friendly.", city: "Copenhagen", country: "Denmark", region: "Europe", latitude: 55.6761, longitude: 12.5683, is_location_approximate: true },
  { id: 2, title: "Portugal coastal cruise", route: "Cascais → Sines → Lagos", spots: 1, date: "12–17 May", level: "Intermediate", host: "Marta & João", description: "A coastal cruise down Portugal.", meeting_point: "Cascais Marina", cost_notes: "Shared fuel, food, marina.", requirements: "Some experience preferred.", city: "Cascais", country: "Portugal", region: "Europe", latitude: 38.6979, longitude: -9.4215, is_location_approximate: true },
];

const fallbackForumPosts = [
  { id: 1, title: "Best apps for weather routing in the Baltic?", replies: 18, tag: "Navigation", author: "Sofie", body: "Looking for charting and weather apps." },
  { id: 2, title: "How do you split costs fairly with guest crew?", replies: 34, tag: "Crew", author: "Marta", body: "Curious about fair cost sharing." },
];

const sailIcon = L.divIcon({ html: "<div class='sail-marker'>⛵</div>", className: "", iconSize: [32, 32], iconAnchor: [16, 16] });
const tripIcon = L.divIcon({ html: "<div class='trip-marker'>📍</div>", className: "", iconSize: [32, 32], iconAnchor: [16, 16] });

function MapFlyTo({ region }) {
  const map = useMap();
  useEffect(() => {
    const [lat, lng, zoom] = REGION_CENTER[region] || REGION_CENTER.All;
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [region, map]);
  return null;
}

function Button({ children, variant = "solid", className = "", ...props }) {
  const base = "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const styles = variant === "outline" ? "border border-white/20 bg-white/5 text-white hover:bg-white/10" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
}
function Card({ children, className = "" }) { return <div className={`rounded-3xl border border-white/10 bg-white/5 shadow-xl ${className}`}>{children}</div>; }
function TextInput(props) { return <input {...props} className={`rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 ${props.className || ""}`} />; }
function TextArea(props) { return <textarea {...props} className={`min-h-28 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 ${props.className || ""}`} />; }
function Select(props) { return <select {...props} className={`rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none ${props.className || ""}`} />; }

function AuthPanel({ session, profile, onAuthChange }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    if (!hasSupabaseConfig) return setMessage("Supabase is not configured.");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return setMessage(error.message);
      if (data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, display_name: displayName || email.split("@")[0] });
      }
      setMessage("Account created. You can now use SailCircle.");
      onAuthChange?.();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMessage(error.message);
      setMessage("Signed in.");
      onAuthChange?.();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    onAuthChange?.();
  }

  if (session) {
    return (
      <Card className="bg-cyan-300/10 border-cyan-300/30">
        <div className="p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-cyan-200">Signed in</p>
            <p className="font-bold">{profile?.display_name || session.user.email}</p>
            <p className="text-xs text-slate-400">{profile?.verified ? "Verified sailor profile" : "Unverified profile"}</p>
          </div>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-cyan-300/10 border-cyan-300/30">
      <form onSubmit={submit} className="grid gap-3 p-5 md:grid-cols-4">
        <div className="md:col-span-4">
          <h3 className="font-bold text-xl">Login to create trips, request to join, and message sailors</h3>
          <p className="text-sm text-slate-400 mt-1">Browsing the map and forum stays public.</p>
        </div>
        {mode === "signup" && <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />}
        <TextInput required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <TextInput required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <Button>{mode === "signup" ? "Create account" : "Sign in"}</Button>
        <Button type="button" variant="outline" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>{mode === "signup" ? "Use sign in" : "Create account"}</Button>
        {message && <p className="md:col-span-4 text-sm text-cyan-200">{message}</p>}
      </form>
    </Card>
  );
}

function ProfileManager({ session, profile, onSaved }) {
  const [form, setForm] = useState({ display_name: "", home_port: "", region: "Europe", bio: "", skill_level: "Beginner", latitude: "", longitude: "", show_approx_location: true });
  const [boat, setBoat] = useState({ name: "", model: "", length: "", home_port: "", description: "" });
  const [availability, setAvailability] = useState({ start_date: "", end_date: "", region: "Europe", note: "" });
  const [boats, setBoats] = useState([]);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profile) setForm({
      display_name: profile.display_name || "",
      home_port: profile.home_port || "",
      region: profile.region || "Europe",
      bio: profile.bio || "",
      skill_level: profile.skill_level || "Beginner",
      latitude: profile.latitude || "",
      longitude: profile.longitude || "",
      show_approx_location: profile.show_approx_location ?? true,
    });
  }, [profile]);

  useEffect(() => {
    async function load() {
      if (!session || !hasSupabaseConfig) return;
      const [boatsRes, availabilityRes] = await Promise.all([
        supabase.from("boats").select("*").eq("owner_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("availability").select("*").eq("user_id", session.user.id).order("start_date", { ascending: true }),
      ]);
      if (!boatsRes.error) setBoats(boatsRes.data || []);
      if (!availabilityRes.error) setSlots(availabilityRes.data || []);
    }
    load();
  }, [session]);

  if (!session) return null;

  async function saveProfile(e) {
    e.preventDefault();
    setMessage("");
    const payload = {
      id: session.user.id,
      ...form,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) return setMessage(error.message);
    setMessage("Profile saved.");
    onSaved?.();
  }

  async function addBoat(e) {
    e.preventDefault();
    setMessage("");
    const { data, error } = await supabase.from("boats").insert({ ...boat, owner_id: session.user.id }).select().single();
    if (error) return setMessage(error.message);
    setBoats([data, ...boats]);
    setBoat({ name: "", model: "", length: "", home_port: "", description: "" });
  }

  async function addAvailability(e) {
    e.preventDefault();
    setMessage("");
    const { data, error } = await supabase.from("availability").insert({ ...availability, user_id: session.user.id }).select().single();
    if (error) return setMessage(error.message);
    setSlots([...slots, data]);
    setAvailability({ start_date: "", end_date: "", region: "Europe", note: "" });
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-7">
        <p className="text-sm font-semibold text-cyan-300">Your account</p>
        <h2 className="text-4xl font-bold mt-2">Profile, boats, and availability</h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <form onSubmit={saveProfile} className="grid gap-3 p-5">
            <h3 className="text-xl font-bold">Sailor profile</h3>
            <TextInput required value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Display name" />
            <TextInput value={form.home_port} onChange={(e) => setForm({ ...form, home_port: e.target.value })} placeholder="Home port" />
            <Select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>{Object.keys(REGION_CENTER).filter(r=>r!=="All").map(r => <option key={r}>{r}</option>)}</Select>
            <Select value={form.skill_level} onChange={(e) => setForm({ ...form, skill_level: e.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Skipper</option><option>Racing</option></Select>
            <TextArea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" />
            <div className="grid grid-cols-2 gap-3">
              <TextInput value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Latitude" />
              <TextInput value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Longitude" />
            </div>
            <label className="text-sm text-slate-300 flex gap-2 items-center"><input type="checkbox" checked={form.show_approx_location} onChange={(e) => setForm({ ...form, show_approx_location: e.target.checked })} /> Show approximate location</label>
            <Button>Save profile</Button>
          </form>
        </Card>

        <Card>
          <form onSubmit={addBoat} className="grid gap-3 p-5">
            <h3 className="text-xl font-bold">Boat profile</h3>
            <TextInput required value={boat.name} onChange={(e) => setBoat({ ...boat, name: e.target.value })} placeholder="Boat name" />
            <TextInput value={boat.model} onChange={(e) => setBoat({ ...boat, model: e.target.value })} placeholder="Model" />
            <TextInput value={boat.length} onChange={(e) => setBoat({ ...boat, length: e.target.value })} placeholder="Length" />
            <TextInput value={boat.home_port} onChange={(e) => setBoat({ ...boat, home_port: e.target.value })} placeholder="Home port" />
            <TextArea value={boat.description} onChange={(e) => setBoat({ ...boat, description: e.target.value })} placeholder="Description" />
            <Button>Add boat</Button>
            <div className="grid gap-2">
              {boats.map(b => <div key={b.id} className="rounded-2xl bg-white/5 p-3 text-sm"><b>{b.name}</b><br/><span className="text-slate-400">{b.model || "No model"} · {b.home_port || "No port"}</span></div>)}
            </div>
          </form>
        </Card>

        <Card>
          <form onSubmit={addAvailability} className="grid gap-3 p-5">
            <h3 className="text-xl font-bold">Availability calendar</h3>
            <TextInput required type="date" value={availability.start_date} onChange={(e) => setAvailability({ ...availability, start_date: e.target.value })} />
            <TextInput required type="date" value={availability.end_date} onChange={(e) => setAvailability({ ...availability, end_date: e.target.value })} />
            <Select value={availability.region} onChange={(e) => setAvailability({ ...availability, region: e.target.value })}>{Object.keys(REGION_CENTER).filter(r=>r!=="All").map(r => <option key={r}>{r}</option>)}</Select>
            <TextInput value={availability.note} onChange={(e) => setAvailability({ ...availability, note: e.target.value })} placeholder="Note" />
            <Button>Add availability</Button>
            <div className="grid gap-2">
              {slots.map(s => <div key={s.id} className="rounded-2xl bg-white/5 p-3 text-sm"><b>{s.start_date} → {s.end_date}</b><br/><span className="text-slate-400">{s.region} · {s.note}</span></div>)}
            </div>
          </form>
        </Card>
      </div>
      {message && <p className="mt-4 text-sm text-cyan-200">{message}</p>}
    </section>
  );
}

function AddTripForm({ session, profile, onTripCreated }) {
  const [form, setForm] = useState({ title: "", route: "", spots: 1, date: "", level: "Beginner friendly", description: "", meeting_point: "", cost_notes: "", requirements: "", locationIndex: 0 });
  const [message, setMessage] = useState("");

  async function submitTrip(event) {
    event.preventDefault();
    setMessage("");
    if (!session) return setMessage("Please log in to create a trip.");

    const loc = LOCATIONS[Number(form.locationIndex)];
    const newTrip = {
      title: form.title, route: form.route, spots: Number(form.spots), date: form.date, level: form.level,
      host: profile?.display_name || session.user.email,
      description: form.description || "More details to be confirmed by the host.",
      meeting_point: form.meeting_point || "To be confirmed",
      cost_notes: form.cost_notes || "To be agreed between skipper and crew.",
      requirements: form.requirements || "To be confirmed",
      city: loc.city, country: loc.country, region: loc.region, latitude: loc.lat, longitude: loc.lng,
      is_location_approximate: true,
      owner_id: session.user.id,
    };

    const { data, error } = await supabase.from("trips").insert(newTrip).select().single();
    if (error) return setMessage(error.message);
    onTripCreated(data);
    setMessage("Trip created and added to the map.");
    setForm({ title: "", route: "", spots: 1, date: "", level: "Beginner friendly", description: "", meeting_point: "", cost_notes: "", requirements: "", locationIndex: 0 });
  }

  return (
    <Card className="mt-8" id="create-trip-form">
      <form onSubmit={submitTrip} className="grid gap-4 p-6 md:grid-cols-3">
        <div className="md:col-span-3">
          <h3 className="text-2xl font-bold">Create a sailing trip</h3>
          <p className="mt-2 text-sm text-slate-400">Login is required. The selected city creates a trip pin on the map.</p>
        </div>
        <TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Trip title" />
        <TextInput required value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="Route, e.g. Copenhagen → Møns Klint" />
        <TextInput required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="Date or period" />
        <TextInput required type="number" min="1" value={form.spots} onChange={(e) => setForm({ ...form, spots: e.target.value })} placeholder="Spots" />
        <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}><option>Beginner friendly</option><option>Intermediate</option><option>Offshore experience</option><option>Racing</option></Select>
        <Select value={form.locationIndex} onChange={(e) => setForm({ ...form, locationIndex: e.target.value })}>{LOCATIONS.map((l, i) => <option key={`${l.city}-${i}`} value={i}>{l.city}, {l.country} — {l.region}</option>)}</Select>
        <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Trip description" className="md:col-span-3" />
        <TextInput value={form.meeting_point} onChange={(e) => setForm({ ...form, meeting_point: e.target.value })} placeholder="Meeting point" />
        <TextInput value={form.cost_notes} onChange={(e) => setForm({ ...form, cost_notes: e.target.value })} placeholder="Cost notes" />
        <TextInput value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="Requirements" />
        <Button disabled={!session} className="md:col-span-3">＋ Create trip</Button>
        {message && <p className="md:col-span-3 text-sm text-cyan-200">{message}</p>}
      </form>
    </Card>
  );
}

function TripDetail({ trip, session, profile, requests, onClose, onRequestCreated, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [chatBody, setChatBody] = useState("");

  if (!trip) return null;
  const isOwner = session?.user?.id && trip.owner_id === session.user.id;

  async function requestJoin(event) {
    event.preventDefault();
    setRequestStatus("");
    if (!session) return setRequestStatus("Please log in to request to join.");
    if (!trip.owner_id) return setRequestStatus("This demo trip has no owner account yet.");

    const payload = {
      trip_id: trip.id,
      requester_id: session.user.id,
      owner_id: trip.owner_id,
      name: profile?.display_name || session.user.email,
      message,
    };
    const { data, error } = await supabase.from("trip_requests").insert(payload).select().single();
    if (error) return setRequestStatus(error.message);
    onRequestCreated(data);
    setMessage("");
    setRequestStatus("Request sent to the trip owner.");
  }

  async function sendMessage(receiverId) {
    if (!chatBody.trim()) return;
    const { data, error } = await supabase.from("messages").insert({ trip_id: trip.id, sender_id: session.user.id, receiver_id: receiverId, body: chatBody }).select().single();
    if (error) return setRequestStatus(error.message);
    onMessageSent(data);
    setChatBody("");
    setRequestStatus("Message sent.");
  }

  return (
    <Card className="mt-8 border-cyan-300/30 bg-cyan-300/10">
      <div className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Trip details</p>
            <h3 className="mt-2 text-3xl font-bold">{trip.title}</h3>
            <p className="mt-2 text-slate-300">🧭 {trip.route}</p>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <Info label="Date" value={trip.date} />
          <Info label="Host" value={trip.host} />
          <Info label="Level" value={trip.level} />
          <Info label="Open spots" value={trip.spots} />
          <Info label="Location" value={`${trip.city || ""}, ${trip.country || ""}`} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard title="Description" text={trip.description || "No description yet."} />
          <InfoCard title="Meeting point" text={trip.meeting_point || "To be confirmed."} />
          <InfoCard title="Costs" text={trip.cost_notes || "To be agreed."} />
          <InfoCard title="Requirements" text={trip.requirements || "To be confirmed."} />
        </div>

        {!isOwner && (
          <form onSubmit={requestJoin} className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h4 className="text-xl font-bold">Request to join this trip</h4>
            <TextArea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell the host why you want to join, your experience, and availability." />
            <Button disabled={!session}>Send request</Button>
            {!session && <p className="text-sm text-slate-400">You must login before requesting to join.</p>}
          </form>
        )}

        {isOwner && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <h4 className="text-xl font-bold">Requests for this trip</h4>
            <div className="mt-4 grid gap-3">
              {requests.filter(r => String(r.trip_id) === String(trip.id)).length === 0 ? <p className="text-sm text-slate-400">No requests yet.</p> : requests.filter(r => String(r.trip_id) === String(trip.id)).map(r => (
                <div key={r.id} className="rounded-2xl bg-white/5 p-4">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-slate-300 mt-1">{r.message}</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                    <TextInput value={chatBody} onChange={(e) => setChatBody(e.target.value)} placeholder="Write a message back..." />
                    <Button onClick={() => sendMessage(r.requester_id)} type="button">Send message</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {requestStatus && <p className="mt-4 text-sm text-cyan-200">{requestStatus}</p>}
      </div>
    </Card>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs text-slate-400">{label}</p><p className="font-semibold">{value}</p></div>;
}

function InfoCard({ title, text }) {
  return <Card><div className="p-5"><p className="text-sm font-semibold text-cyan-200">{title}</p><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></div></Card>;
}

function ForumDetail({ post, comments, session, profile, onClose, onCommentCreated }) {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  if (!post) return null;

  async function submitComment(event) {
    event.preventDefault();
    setStatus("");
    if (!session) return setStatus("Please log in to comment.");

    const newComment = { post_id: post.id, author_id: session.user.id, author: profile?.display_name || session.user.email, comment };
    const { data, error } = await supabase.from("forum_comments").insert(newComment).select().single();
    if (error) return setStatus(error.message);
    onCommentCreated(data);
    setComment("");
    setStatus("Comment posted.");
  }

  return (
    <Card className="mt-8 border-cyan-300/30 bg-cyan-300/10">
      <div className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{post.tag}</span>
            <h3 className="mt-3 text-3xl font-bold">{post.title}</h3>
            <p className="mt-2 text-sm text-slate-400">Started by {post.author}</p>
            {post.body && <p className="mt-4 text-slate-300 leading-7">{post.body}</p>}
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-6 grid gap-4">
          <h4 className="text-xl font-bold">Comments</h4>
          {comments.length === 0 ? <p className="text-sm text-slate-400">No comments yet.</p> : comments.map((item) => <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><p className="font-semibold">{item.author}</p><p className="mt-2 text-sm leading-6 text-slate-300">{item.comment}</p></div>)}
        </div>
        <form onSubmit={submitComment} className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <h4 className="text-xl font-bold">Add a comment</h4>
          <TextArea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write your comment..." />
          <Button disabled={!session}>Post comment</Button>
          {!session && <p className="text-sm text-slate-400">Login is required to comment.</p>}
          {status && <p className="text-sm text-cyan-200">{status}</p>}
        </form>
      </div>
    </Card>
  );
}

function NewTopicForm({ session, profile, onPostCreated, onClose }) {
  const [form, setForm] = useState({ title: "", body: "", tag: "General" });
  const [status, setStatus] = useState("");

  async function submitPost(event) {
    event.preventDefault();
    setStatus("");
    if (!session) return setStatus("Please log in to create a topic.");

    const newPost = { ...form, replies: 0, author: profile?.display_name || session.user.email, owner_id: session.user.id };
    const { data, error } = await supabase.from("forum_posts").insert(newPost).select().single();
    if (error) return setStatus(error.message);
    onPostCreated(data);
    setForm({ title: "", body: "", tag: "General" });
  }

  return (
    <Card className="mb-8 border-cyan-300/30 bg-cyan-300/10">
      <form onSubmit={submitPost} className="grid gap-4 p-6 md:grid-cols-3">
        <div className="flex items-start justify-between md:col-span-3">
          <div>
            <h3 className="text-2xl font-bold">Start a new forum topic</h3>
            <p className="mt-2 text-sm text-slate-400">Login is required to post.</p>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
        <TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Topic title" className="md:col-span-2" />
        <Select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}><option>General</option><option>Navigation</option><option>Crew</option><option>Beginner</option><option>Safety</option><option>Gear</option><option>Destinations</option></Select>
        <TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your question or topic..." className="md:col-span-3" />
        <Button disabled={!session} className="md:col-span-3">Create topic</Button>
        {status && <p className="md:col-span-3 text-sm text-cyan-200">{status}</p>}
      </form>
    </Card>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sailors, setSailors] = useState(fallbackSailors);
  const [trips, setTrips] = useState(fallbackTrips);
  const [forumPosts, setForumPosts] = useState(fallbackForumPosts);
  const [comments, setComments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedSailor, setSelectedSailor] = useState(fallbackSailors[0]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showNewTopic, setShowNewTopic] = useState(false);

  const [region, setRegion] = useState("All");
  const [tripSort, setTripSort] = useState("newest");
  const [topicFilter, setTopicFilter] = useState("All");
  const [forumSort, setForumSort] = useState("newest");
  const [query, setQuery] = useState("");

  const mapRef = useRef(null);
  const tripsRef = useRef(null);
  const tripFormRef = useRef(null);
  const forumRef = useRef(null);

  async function loadAuth() {
    if (!hasSupabaseConfig) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  }

  async function loadProfile(currentSession = session) {
    if (!currentSession || !hasSupabaseConfig) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", currentSession.user.id).maybeSingle();
    if (data) setProfile(data);
  }

  async function loadData(currentSession = session) {
    if (!hasSupabaseConfig) return;
    const [sailorsRes, tripsRes, postsRes, commentsRes] = await Promise.all([
      supabase.from("sailors").select("*").order("created_at", { ascending: false }),
      supabase.from("trips").select("*").order("created_at", { ascending: false }),
      supabase.from("forum_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("forum_comments").select("*").order("created_at", { ascending: true }),
    ]);
    if (!sailorsRes.error && sailorsRes.data?.length) { setSailors(sailorsRes.data); setSelectedSailor(sailorsRes.data[0]); }
    if (!tripsRes.error && tripsRes.data?.length) setTrips(tripsRes.data);
    if (!postsRes.error && postsRes.data?.length) setForumPosts(postsRes.data);
    if (!commentsRes.error) setComments(commentsRes.data || []);

    if (currentSession) {
      const [reqRes, msgRes] = await Promise.all([
        supabase.from("trip_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("messages").select("*").order("created_at", { ascending: false }),
      ]);
      if (!reqRes.error) setRequests(reqRes.data || []);
      if (!msgRes.error) setMessages(msgRes.data || []);
    }
  }

  useEffect(() => {
    async function init() {
      if (!hasSupabaseConfig) return;
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadProfile(data.session);
      await loadData(data.session);
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setProfile(null);
        await loadProfile(newSession);
        await loadData(newSession);
      });
      return () => listener.subscription.unsubscribe();
    }
    init();
  }, []);

  const filteredTrips = useMemo(() => {
    let out = [...trips];
    if (region !== "All") out = out.filter(t => t.region === region);
    const q = query.toLowerCase();
    if (q) out = out.filter(t => `${t.title} ${t.route} ${t.city} ${t.country} ${t.level} ${t.host}`.toLowerCase().includes(q));
    if (tripSort === "oldest") out.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    else out.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return out;
  }, [trips, region, query, tripSort]);

  const filteredPosts = useMemo(() => {
    let out = [...forumPosts];
    if (topicFilter !== "All") out = out.filter(p => p.tag === topicFilter);
    if (forumSort === "oldest") out.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    else if (forumSort === "active") out.sort((a, b) => comments.filter(c => String(c.post_id) === String(b.id)).length - comments.filter(c => String(c.post_id) === String(a.id)).length);
    else out.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return out;
  }, [forumPosts, topicFilter, forumSort, comments]);

  const selectedPostComments = comments.filter(c => String(c.post_id) === String(selectedPost?.id));
  const mapTrips = region === "All" ? trips : trips.filter(t => t.region === region);

  function scrollTo(ref) { ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function openTrip(trip) { setSelectedTrip(trip); setTimeout(() => scrollTo(tripsRef), 80); }
  function openPost(post) { setSelectedPost(post); setTimeout(() => scrollTo(forumRef), 80); }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button onClick={() => scrollTo(mapRef)} className="flex items-center gap-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-2xl text-slate-950">⛵</div>
            <div><p className="text-lg font-bold tracking-tight">SailCircle</p><p className="text-xs text-slate-400">Find sailors. Plan trips. Share the sea.</p></div>
          </button>
          <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
            <button onClick={() => scrollTo(mapRef)} className="hover:text-white">Map</button>
            <button onClick={() => scrollTo(tripsRef)} className="hover:text-white">Trips</button>
            <button onClick={() => scrollTo(forumRef)} className="hover:text-white">Forum</button>
          </nav>
          <Button className="hidden bg-white hover:bg-cyan-100 sm:inline-flex" onClick={() => scrollTo(tripFormRef)}>Create trip</Button>
        </div>
      </header>

      <main>
        <section ref={mapRef} className="mx-auto max-w-7xl px-5 py-8">
          <AuthPanel session={session} profile={profile} onAuthChange={async () => { await loadAuth(); await loadData(); }} />
        </section>

        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-10 md:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100"><span>🌊</span> {hasSupabaseConfig ? "Connected to Supabase" : "Demo mode"}</div>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">Meet sailors nearby and turn routes into shared adventures.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Discover sailors and trips on a map, plan sailing holidays, request to join, message boaters, and discuss sailing topics.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button onClick={() => scrollTo(mapRef)}>📍 Explore sailors</Button><Button variant="outline" onClick={() => scrollTo(tripFormRef)}>＋ Post a trip</Button></div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] bg-white/10">
            <div className="p-4">
              <div className="mb-3 grid gap-3 md:grid-cols-2">
                <Select value={region} onChange={(e) => setRegion(e.target.value)}>{Object.keys(REGION_CENTER).map(r => <option key={r}>{r}</option>)}</Select>
                <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">Showing {mapTrips.length} trip pins</p>
              </div>
              <div className="relative h-[430px] overflow-hidden rounded-[1.5rem]">
                <MapContainer center={[50.5, 5.5]} zoom={4} scrollWheelZoom={false} className="z-0">
                  <MapFlyTo region={region} />
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {sailors.map(s => <Marker key={`s-${s.id}`} position={[Number(s.latitude), Number(s.longitude)]} icon={sailIcon} eventHandlers={{ click: () => setSelectedSailor(s) }}><Popup><strong>{s.name}</strong><br />{s.boat}<br />{s.location}</Popup></Marker>)}
                  {mapTrips.map(t => <Marker key={`t-${t.id}`} position={[Number(t.latitude), Number(t.longitude)]} icon={tripIcon} eventHandlers={{ click: () => openTrip(t) }}><Popup><strong>{t.title}</strong><br />{t.city}, {t.country}<br />{t.date}</Popup></Marker>)}
                </MapContainer>
                {selectedSailor && <div className="absolute bottom-5 left-5 right-5 z-[500] rounded-3xl border border-white/10 bg-slate-950/90 p-5"><p className="text-lg font-bold">{selectedSailor.name}</p><p className="text-sm text-slate-300">{selectedSailor.boat} · {selectedSailor.location}</p><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p>🧭 {selectedSailor.trip}</p><p>📅 {selectedSailor.date}</p><p>⭐ {selectedSailor.skill}</p></div></div>}
              </div>
            </div>
          </Card>
        </section>

        <ProfileManager session={session} profile={profile} onSaved={() => loadProfile()} />

        <section ref={tripsRef} className="mx-auto max-w-7xl px-5 py-16">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="text-sm font-semibold text-cyan-300">Open trips</p><h2 className="mt-2 text-4xl font-bold">Plan or join a sailing trip</h2></div>
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trips..." />
              <Select value={tripSort} onChange={(e) => setTripSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option></Select>
              <Select value={region} onChange={(e) => setRegion(e.target.value)}>{Object.keys(REGION_CENTER).map(r => <option key={r}>{r}</option>)}</Select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {filteredTrips.map(trip => <Card key={trip.id} className="transition hover:-translate-y-1 hover:bg-white/10"><div className="p-6"><div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">{trip.level}</span><span className="text-sm text-slate-400">{trip.spots} spots</span></div><h3 className="text-xl font-bold">{trip.title}</h3><p className="mt-3 text-sm text-slate-300">🧭 {trip.route}</p><p className="mt-2 text-sm text-slate-300">📅 {trip.date}</p><p className="mt-2 text-sm text-slate-400">📍 {trip.city}, {trip.country}</p><p className="mt-2 text-sm text-slate-400">Hosted by {trip.host}</p><div className="mt-5 grid gap-3"><Button className="w-full bg-white hover:bg-cyan-100" onClick={() => openTrip(trip)}>View details</Button><Button variant="outline" className="w-full" onClick={() => openTrip(trip)}>Request to join</Button></div></div></Card>)}
          </div>

          <TripDetail trip={selectedTrip} session={session} profile={profile} requests={requests} onClose={() => setSelectedTrip(null)} onRequestCreated={(r) => setRequests([r, ...requests])} onMessageSent={(m) => setMessages([m, ...messages])} />

          {session && messages.length > 0 && <Card className="mt-8"><div className="p-6"><h3 className="text-2xl font-bold">Your messages</h3><div className="mt-4 grid gap-3">{messages.map(m => <div key={m.id} className="rounded-2xl bg-white/5 p-4 text-sm"><p>{m.body}</p><p className="mt-1 text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</p></div>)}</div></div></Card>}

          <div ref={tripFormRef}><AddTripForm session={session} profile={profile} onTripCreated={(newTrip) => { setTrips([newTrip, ...trips]); setSelectedTrip(newTrip); setRegion(newTrip.region || "All"); }} /></div>
        </section>

        <section ref={forumRef} className="mx-auto max-w-7xl px-5 pb-16">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><p className="text-sm font-semibold text-cyan-300">Community forum</p><h2 className="mt-2 text-4xl font-bold">Discuss trips, gear, routes, and safety</h2></div>
            <Button variant="outline" onClick={() => setShowNewTopic(true)}>💬 New topic</Button>
          </div>
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            <Select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>{["All","General","Navigation","Crew","Beginner","Safety","Gear","Destinations"].map(t => <option key={t}>{t}</option>)}</Select>
            <Select value={forumSort} onChange={(e) => setForumSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="active">Recently active</option></Select>
          </div>

          {showNewTopic && <NewTopicForm session={session} profile={profile} onClose={() => setShowNewTopic(false)} onPostCreated={(post) => { setForumPosts([post, ...forumPosts]); setSelectedPost(post); setShowNewTopic(false); }} />}

          <div className="grid gap-4">{filteredPosts.map(post => <Card key={post.id}><div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"><div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{post.tag}</span><h3 className="mt-3 text-lg font-semibold">{post.title}</h3><p className="mt-1 text-sm text-slate-400">Started by {post.author}</p></div><div className="flex items-center gap-4 text-sm text-slate-300"><span>💬 {comments.filter(c => String(c.post_id) === String(post.id)).length || post.replies || 0} replies</span><Button onClick={() => openPost(post)}>Open</Button></div></div></Card>)}</div>

          <ForumDetail post={selectedPost} comments={selectedPostComments} session={session} profile={profile} onClose={() => setSelectedPost(null)} onCommentCreated={(c) => setComments([...comments, c])} />
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
