"use client";

import { useEffect, useState } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";

type Profile = { role: "admin" | "partner"; full_name: string | null; email?: string | null };
type Exchange = {
  id: string;
  url: string;
  direction: string;
  status: string;
  notes: string | null;
  created_at: string;
  partner_user_id: string;
};

type Privacy = "public" | "team" | "private";
type Collaborator = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type Partner = {
  id: string;
  name: string;
  email: string;
  company: string;
  location: string;
  privacy: Privacy;
  status: string;
  lastActive: string;
  collaborators: Collaborator[];
};

type NavKey = "overview" | "partners" | "invitations" | "collaborators" | "settings";

const seedPartners: Partner[] = [
  {
    id: "partner-1",
    name: "Apex Media Group",
    email: "hello@apexmedia.com",
    company: "Apex Media Group",
    location: "Dubai, UAE",
    privacy: "team",
    status: "Active",
    lastActive: "Today",
    collaborators: [
      { id: "c-1", name: "Hassan Ali", email: "hassan@apexmedia.com", role: "Manager", status: "Active" },
      { id: "c-2", name: "Areeba Noor", email: "areeba@apexmedia.com", role: "Editor", status: "Pending" },
    ],
  },
  {
    id: "partner-2",
    name: "North Link Studio",
    email: "team@northlink.studio",
    company: "North Link Studio",
    location: "London, UK",
    privacy: "public",
    status: "Active",
    lastActive: "2 hours ago",
    collaborators: [
      { id: "c-3", name: "Liam Stone", email: "liam@northlink.studio", role: "Owner", status: "Active" },
      { id: "c-4", name: "Sara Chen", email: "sara@northlink.studio", role: "Designer", status: "Active" },
    ],
  },
  {
    id: "partner-3",
    name: "BluePeak Networks",
    email: "partners@bluepeak.net",
    company: "BluePeak Networks",
    location: "Toronto, Canada",
    privacy: "private",
    status: "Review",
    lastActive: "Yesterday",
    collaborators: [
      { id: "c-5", name: "Ryan Cole", email: "ryan@bluepeak.net", role: "Operations", status: "Review" },
    ],
  },
];

const initialInviteLink = "https://link-exchange-dashboard1.vercel.app/invite/partner-portal-demo";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Exchange[]>([]);
  const [partners, setPartners] = useState<Partner[]>(seedPartners);
  const [nav, setNav] = useState<NavKey>("overview");
  const [search, setSearch] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(seedPartners[0].id);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [direction, setDirection] = useState("sent_to_partner");
  const [partnerId, setPartnerId] = useState(seedPartners[0].id);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Collaborator");
  const [inviteLink, setInviteLink] = useState(initialInviteLink);
  const [newCollaboratorName, setNewCollaboratorName] = useState("");
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [newCollaboratorRole, setNewCollaboratorRole] = useState("Manager");

  async function load(userId: string) {
    const { data: p, error: pe } = await supabase
      .from("profiles")
      .select("role,full_name,email")
      .eq("id", userId)
      .single();

    if (pe || !p) {
      setMessage("Your profile is not configured yet. Ask the admin to create your profile.");
      return;
    }

    setProfile({
      role: p.role,
      full_name: p.full_name,
      email: p.email,
    });

    const { data, error } = await supabase.from("link_exchanges").select("*").order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setRows((data || []) as Exchange[]);
    }

    if (p.role === "admin") {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .eq("role", "partner")
        .order("full_name");

      const dbPartners = (ps || []).map((item: any) => ({
        id: String(item.id),
        name: item.full_name || "Partner",
        email: item.email || "",
        company: "Linked Partner",
        location: "Remote",
        privacy: "team" as Privacy,
        status: "Active",
        lastActive: "Today",
        collaborators: [
          {
            id: `c-${item.id}`,
            name: item.full_name || "Partner user",
            email: item.email || "",
            role: "Primary contact",
            status: "Active",
          },
        ],
      }));

      setPartners((prev) => {
        const byId = new Map(prev.map((partner) => [partner.id, partner]));

        dbPartners.forEach((partner) => {
          byId.set(partner.id, { ...byId.get(partner.id), ...partner });
        });

        return [...Array.from(byId.values())];
      });
    }
  }

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setMessage("Setup required: add your Supabase URL and anon key to .env.local. See README.");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) load(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) load(s.user.id);
      else {
        setProfile(null);
        setRows([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) setMessage(error.message);
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const user = session?.user;
    const target = profile?.role === "admin" ? partnerId : user?.id;

    if (!target) {
      setMessage("Choose a partner first.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("link_exchanges").insert({
      partner_user_id: target,
      submitted_by: user.id,
      url,
      direction,
      notes: notes || null,
      status: profile?.role === "admin" ? status : "pending",
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Link saved.");
    setUrl("");
    setNotes("");
    await load(user.id);
  }

  async function updateStatus(id: string, next: string) {
    const { error } = await supabase.from("link_exchanges").update({ status: next }).eq("id", id);
    setMessage(error ? error.message : "Status updated.");

    if (session?.user) await load(session.user.id);
  }

  const handleNewInvite = () => {
    const generatedLink = `https://link-exchange-dashboard1.vercel.app/invite/${Date.now().toString(36)}`;
    setInviteLink(generatedLink);
    setMessage(`Invitation link created for ${inviteRole.toLowerCase()} access.`);

    if (selectedPartnerId) {
      setPartners((prev) =>
        prev.map((partner) =>
          partner.id === selectedPartnerId
            ? {
                ...partner,
                collaborators: [
                  ...partner.collaborators,
                  {
                    id: `pending-${Date.now()}`,
                    name: inviteEmail || "New invitee",
                    email: inviteEmail || "invite@pending.com",
                    role: inviteRole,
                    status: "Pending",
                  },
                ],
              }
            : partner,
        ),
      );
    }
  };

  const handleAddCollaborator = () => {
    if (!newCollaboratorName.trim()) return;

    const collaborator: Collaborator = {
      id: `collab-${Date.now()}`,
      name: newCollaboratorName,
      email: newCollaboratorEmail || `${newCollaboratorName.toLowerCase().replace(/\s+/g, ".")}@partner.local`,
      role: newCollaboratorRole,
      status: "Active",
    };

    setPartners((prev) =>
      prev.map((partner) =>
        partner.id === selectedPartnerId
          ? { ...partner, collaborators: [...partner.collaborators, collaborator] }
          : partner,
      ),
    );

    setNewCollaboratorName("");
    setNewCollaboratorEmail("");
    setNewCollaboratorRole("Manager");
    setMessage("Collaborator added successfully.");
  };

  const handlePrivacyChange = (partnerIdValue: string, nextPrivacy: Privacy) => {
    setPartners((prev) =>
      prev.map((partner) =>
        partner.id === partnerIdValue ? { ...partner, privacy: nextPrivacy } : partner,
      ),
    );
    setMessage(`Privacy updated to ${nextPrivacy}.`);
  };

  const filteredPartners = partners.filter((partner) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return (
      partner.name.toLowerCase().includes(term) ||
      partner.email.toLowerCase().includes(term) ||
      partner.company.toLowerCase().includes(term)
    );
  });

  const selectedPartner =
    partners.find((partner) => partner.id === selectedPartnerId) || partners[0] || seedPartners[0];

  const mine = rows;
  const sent = mine.filter((r) => r.direction === "sent_to_partner").length;
  const received = mine.filter((r) => r.direction === "received_from_partner").length;
  const pending = mine.filter((r) => r.status === "pending").length;
  const totalCollaborators = partners.reduce((sum, partner) => sum + partner.collaborators.length, 0);

  if (!hasSupabaseConfig()) {
    return (
      <main className="wrap auth-wrap">
        <div className="auth-card">
          <div className="brand-block">
            <span className="brand-dot">L</span>
            <div>
              <p className="eyebrow">Link Exchange Hub</p>
              <h1>Setup required</h1>
            </div>
          </div>
          <div className="notice-box">{message || "Add your Supabase URL and anon key to continue."}</div>
          <p className="muted">Open the README and configure your environment variables before signing in.</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="wrap auth-wrap">
        <div className="auth-card">
          <div className="brand-block">
            <span className="brand-dot">L</span>
            <div>
              <p className="eyebrow">Link Exchange Hub</p>
              <h1>Sign in</h1>
            </div>
          </div>

          <form onSubmit={signIn} className="stack-form">
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            {message && <div className="notice-box error-box">{message}</div>}

            <button type="submit" className="primary-btn" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-badge">L</div>
          <div>
            <p className="eyebrow">Link Exchange</p>
            <h2>Hub</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            ["overview", "Overview"],
            ["partners", "Partners"],
            ["invitations", "Invitations"],
            ["collaborators", "Collaborators"],
            ["settings", "Settings"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={nav === key ? "nav-item active" : "nav-item"}
              onClick={() => setNav(key as NavKey)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="mini-user">
            <div className="avatar small-avatar">{initials(profile?.full_name || session.user.email || "You")}</div>
            <div>
              <strong>{profile?.full_name || "Admin"}</strong>
              <span>{profile?.role === "admin" ? "Admin workspace" : "Partner workspace"}</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{profile?.role === "admin" ? "Admin dashboard" : "Partner dashboard"}</p>
            <h1>{profile?.full_name || "Dashboard"}</h1>
          </div>

          <div className="topbar-actions">
            <input
              type="search"
              className="search-input"
              placeholder="Search partners"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" className="secondary-btn">
              New Partner
            </button>
            <button type="button" className="primary-btn">
              Add Invitation
            </button>
          </div>
        </header>

        {message && <div className="notice-box">{message}</div>}

        {nav === "overview" && (
          <div className="content-stack">
            <div className="stats-grid">
              <div className="stat-card">
                <span>Links sent</span>
                <strong>{sent}</strong>
                <small>Outbound shares</small>
              </div>
              <div className="stat-card">
                <span>Links received</span>
                <strong>{received}</strong>
                <small>Incoming requests</small>
              </div>
              <div className="stat-card">
                <span>Pending</span>
                <strong>{pending}</strong>
                <small>Action needed</small>
              </div>
              <div className="stat-card">
                <span>Collaborators</span>
                <strong>{totalCollaborators}</strong>
                <small>Across all partners</small>
              </div>
            </div>

            <div className="panel-grid">
              <div className="panel large-panel">
                <div className="panel-header">
                  <h3>Recent collaborations</h3>
                  <button type="button" className="ghost-btn">
                    View all
                  </button>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Direction</th>
                        <th>Status</th>
                        <th>Partner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((row) => (
                        <tr key={row.id}>
                          <td>
                            <a href={row.url} target="_blank" rel="noreferrer" className="table-link">
                              {row.url}
                            </a>
                          </td>
                          <td>{row.direction}</td>
                          <td>
                            <span className={`status-pill ${row.status}`}>{row.status}</span>
                          </td>
                          <td>{row.partner_user_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel side-panel">
                <div className="panel-header">
                  <h3>Selected partner</h3>
                </div>

                {selectedPartner && (
                  <div className="partner-summary">
                    <div className="partner-header-row">
                      <div className="avatar wide-avatar">{initials(selectedPartner.name)}</div>
                      <div>
                        <h4>{selectedPartner.name}</h4>
                        <p>{selectedPartner.company}</p>
                      </div>
                    </div>

                    <div className="summary-meta">
                      <span>{selectedPartner.location}</span>
                      <span>{selectedPartner.privacy}</span>
                    </div>

                    <div className="summary-list">
                      <div>
                        <strong>{selectedPartner.collaborators.length}</strong>
                        <span>Collaborators</span>
                      </div>
                      <div>
                        <strong>{selectedPartner.status}</strong>
                        <span>Status</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {nav === "partners" && (
          <div className="content-stack">
            <div className="panel">
              <div className="panel-header">
                <h3>Partner directory</h3>
                <button type="button" className="primary-btn slim-btn">
                  + Add partner
                </button>
              </div>

              <div className="partners-grid">
                {filteredPartners.map((partner) => (
                  <button
                    type="button"
                    key={partner.id}
                    className={selectedPartnerId === partner.id ? "partner-card selected" : "partner-card"}
                    onClick={() => setSelectedPartnerId(partner.id)}
                  >
                    <div className="partner-card-header">
                      <div className="avatar">{initials(partner.name)}</div>
                      <div>
                        <strong>{partner.name}</strong>
                        <span>{partner.company}</span>
                      </div>
                    </div>

                    <div className="partner-metrics">
                      <span>{partner.collaborators.length} collaborators</span>
                      <span>{partner.privacy}</span>
                    </div>

                    <div className="tag-row">
                      <span className="status-pill active">{partner.status}</span>
                      <span className="status-pill muted">{partner.lastActive}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedPartner && (
              <div className="panel">
                <div className="panel-header">
                  <h3>{selectedPartner.name}</h3>
                  <span className="privacy-badge">{selectedPartner.privacy}</span>
                </div>

                <div className="detail-grid">
                  <div>
                    <p className="detail-label">Email</p>
                    <p>{selectedPartner.email}</p>
                  </div>
                  <div>
                    <p className="detail-label">Location</p>
                    <p>{selectedPartner.location}</p>
                  </div>
                  <div>
                    <p className="detail-label">Status</p>
                    <p>{selectedPartner.status}</p>
                  </div>
                  <div>
                    <p className="detail-label">Last active</p>
                    <p>{selectedPartner.lastActive}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {nav === "invitations" && (
          <div className="content-stack">
            <div className="panel invite-panel">
              <div className="panel-header">
                <h3>Create invite link</h3>
              </div>

              <div className="invite-builder">
                <label className="field">
                  <span>Invite for partner</span>
                  <select value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)}>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Contact email</span>
                  <input
                    type="email"
                    value={inviteEmail}
                    placeholder="new.partner@example.com"
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Role</span>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Collaborator">Collaborator</option>
                  </select>
                </label>

                <button type="button" className="primary-btn" onClick={handleNewInvite}>
                  Generate invite
                </button>
              </div>

              <div className="invite-link-box">
                <span>Invitation URL</span>
                <strong>{inviteLink}</strong>
              </div>
            </div>
          </div>
        )}

        {nav === "collaborators" && (
          <div className="content-stack">
            <div className="panel">
              <div className="panel-header">
                <h3>Collaborator access</h3>
              </div>

              <div className="collaborator-form">
                <label className="field">
                  <span>Full name</span>
                  <input
                    type="text"
                    value={newCollaboratorName}
                    onChange={(e) => setNewCollaboratorName(e.target.value)}
                    placeholder="Ayesha Khan"
                  />
                </label>

                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={newCollaboratorEmail}
                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    placeholder="ayesha@example.com"
                  />
                </label>

                <label className="field">
                  <span>Role</span>
                  <select value={newCollaboratorRole} onChange={(e) => setNewCollaboratorRole(e.target.value)}>
                    <option value="Manager">Manager</option>
                    <option value="Collaborator">Collaborator</option>
                    <option value="Editor">Editor</option>
                  </select>
                </label>

                <button type="button" className="primary-btn" onClick={handleAddCollaborator}>
                  Add collaborator
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>By partner</h3>
              </div>

              <div className="collab-list">
                {partners.map((partner) => (
                  <div key={partner.id} className="collab-group">
                    <div className="collab-group-header">
                      <strong>{partner.name}</strong>
                      <span>{partner.collaborators.length} members</span>
                    </div>

                    {partner.collaborators.map((person) => (
                      <div key={person.id} className="collab-item">
                        <div className="avatar small-avatar">{initials(person.name)}</div>
                        <div className="collab-copy">
                          <strong>{person.name}</strong>
                          <span>{person.email}</span>
                        </div>
                        <div className="collab-meta">
                          <span>{person.role}</span>
                          <span className={`status-pill ${person.status.toLowerCase()}`}>{person.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {nav === "settings" && (
          <div className="content-stack">
            <div className="panel">
              <div className="panel-header">
                <h3>Privacy controls</h3>
              </div>

              <div className="settings-list">
                {partners.map((partner) => (
                  <div key={partner.id} className="setting-row">
                    <div>
                      <strong>{partner.name}</strong>
                      <span>{partner.email}</span>
                    </div>

                    <div className="toggle-group">
                      {(["public", "team", "private"] as Privacy[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          className={partner.privacy === level ? "toggle-pill active" : "toggle-pill"}
                          onClick={() => handlePrivacyChange(partner.id, level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bottom-card">
          <h3>Add a new link</h3>
          <form onSubmit={addLink} className="link-form">
            {profile?.role === "admin" && (
              <label className="field">
                <span>Partner</span>
                <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} required>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="field">
              <span>Page URL</span>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" required />
            </label>

            <label className="field">
              <span>Direction</span>
              <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="sent_to_partner">Sent to partner</option>
                <option value="received_from_partner">Received from partner</option>
                <option value="inbound_link">Inbound link</option>
              </select>
            </label>

            <label className="field">
              <span>Notes</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Campaign notes or collaboration info" />
            </label>

            {profile?.role === "admin" && (
              <label className="field">
                <span>Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="live">Live</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
            )}

            <button type="submit" className="primary-btn" disabled={busy}>
              {busy ? "Saving..." : "Save link"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

