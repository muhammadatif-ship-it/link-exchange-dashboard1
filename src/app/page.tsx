 "use client";
import { useEffect, useState } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";

type Profile = { role: "admin" | "partner"; full_name: string | null };
type Exchange = { id: string; url: string; direction: string; status: string; notes: string | null; created_at: string; partner_user_id: string };
export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Exchange[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [direction, setDirection] = useState("sent_to_partner");
  const [partnerId, setPartnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(userId: string) {
    const { data: p, error: pe } = await supabase.from("profiles").select("role,full_name").eq("id", userId).single();
    if (pe || !p) { setMessage("Your profile is not configured yet. Ask the admin to create your profile."); return; }
    setProfile(p as Profile);
    const { data, error } = await supabase.from("link_exchanges").select("*").order("created_at", { ascending: false });
    if (error) setMessage(error.message); else setRows((data || []) as Exchange[]);
    if (p.role === "admin") {
      const { data: ps } = await supabase.from("profiles").select("id,full_name,email").eq("role", "partner").order("full_name");
      setPartners(ps || []);
    }
  }
  useEffect(() => {
    if (!hasSupabaseConfig()) { setMessage("Setup required: add your Supabase URL and anon key to .env.local. See README."); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) load(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) load(s.user.id); else { setProfile(null); setRows([]); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (error) setMessage(error.message);
  }
  async function addLink(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const user = session?.user;
    const target = profile?.role === "admin" ? partnerId : user?.id;
    if (!target) { setMessage("Choose a partner first."); setBusy(false); return; }
    const { error } = await supabase.from("link_exchanges").insert({
      partner_user_id: target, submitted_by: user.id, url, direction,
      notes: notes || null, status: profile?.role === "admin" ? status : "pending"
    });
    setBusy(false);
    if (error) setMessage(error.message);
    else { setMessage("Link saved."); setUrl(""); setNotes(""); await load(user.id); }
  }
  async function updateStatus(id: string, next: string) {
    const { error } = await supabase.from("link_exchanges").update({ status: next }).eq("id", id);
    setMessage(error ? error.message : "Status updated.");
    if (session?.user) await load(session.user.id);
  }
  if (!hasSupabaseConfig()) return <main className="wrap"><h1>Link Exchange Hub</h1><div className="notice">{message || "Setup required."}</div><p>Open the included README to configure Supabase and deploy to Vercel.</p></main>;
  if (!session) return <main className="wrap" style={{maxWidth:520}}><div className="top"><div className="brand">Link Exchange Hub</div></div><div className="card"><h1>Sign in</h1><p className="muted">Private workspace for you and your link partners.</p><form onSubmit={signIn}><div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></div><div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></div><button disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form>{message && <p className="error">{message}</p>}</div></main>;
  const mine = rows;
  const sent = mine.filter(r=>r.direction==="sent_to_partner").length;
  const received = mine.filter(r=>r.direction==="received_from_partner").length;
  const pending = mine.filter(r=>r.status==="pending").length;
  return <main className="wrap">
    <header className="top"><div><div className="brand">Link Exchange Hub</div><div className="muted small">{profile?.role==="admin"?"Admin workspace":"Partner workspace"} · {session.user.email}</div></div><button className="secondary" onClick={()=>supabase.auth.signOut()}>Sign out</button></header>
    {message && <p className={message.includes("saved")||message.includes("updated")?"success":"error"}>{message}</p>}
    <div className="grid"><div className="card"><div className="muted">Links sent</div><div className="metric">{sent}</div></div><div className="card"><div className="muted">Links received</div><div className="metric">{received}</div></div><div className="card"><div className="muted">Pending</div><div className="metric">{pending}</div></div></div>
    <div className="card"><h2>Add a link</h2><p className="muted small">{profile?.role==="admin"?"Add a link under a partner and manage its status.":"You can only add links to your own collaboration record. Other records and admin controls are restricted."}</p>
      <form onSubmit={addLink}>
        {profile?.role==="admin" && <div className="field"><label>Partner</label><select value={partnerId} onChange={e=>setPartnerId(e.target.value)} required><option value="">Select partner</option>{partners.map(p=><option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>)}</select></div>}
        <div className="formgrid"><div className="field"><label>Page URL</label><input type="url" placeholder="https://example.com/page" value={url} onChange={e=>setUrl(e.target.value)} required/></div><div className="field"><label>Exchange direction</label><select value={direction} onChange={e=>setDirection(e.target.value)}><option value="sent_to_partner">I gave this link to partner</option><option value="received_from_partner">Partner gave me this link</option></select></div></div>
        <div className="field"><label>Notes (optional)</label><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anchor text, target page, campaign, etc."/></div>
        {profile?.role==="admin" && <div className="field"><label>Status</label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="pending">Pending</option><option value="live">Live</option><option value="rejected">Rejected</option></select></div>}
        <button disabled={busy}>{busy?"Saving…":"Save link"}</button>
      </form>
    </div>
    <div className="card" style={{marginTop:18}}><h2>{profile?.role==="admin"?"All collaborations":"My collaboration links"}</h2><div className="tablewrap"><table><thead><tr><th>URL</th><th>Direction</th><th>Status</th><th>Notes</th><th>Added</th>{profile?.role==="admin"&&<th>Manage</th>}</tr></thead><tbody>{mine.map(r=><tr key={r.id}><td><a href={r.url} target="_blank" rel="noreferrer">{r.url}</a></td><td>{r.direction==="sent_to_partner"?"Sent":"Received"}</td><td><span className="pill">{r.status}</span></td><td>{r.notes||"—"}</td><td>{new Date(r.created_at).toLocaleDateString()}</td>{profile?.role==="admin"&&<td><select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}><option value="pending">Pending</option><option value="live">Live</option><option value="rejected">Rejected</option></select></td>}</tr>)}{mine.length===0&&<tr><td colSpan={profile?.role==="admin"?6:5}>No links yet.</td></tr>}</tbody></table></div></div>
    <p className="muted small" style={{marginTop:18}}>Security note: database Row Level Security is the actual access boundary. Follow README setup steps before adding real partner data.</p>
  </main>;
}