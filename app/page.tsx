"use client";

import { useState, useEffect } from "react";

type Role = "admin" | "manager" | "user";

export default function DashboardPage() {
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Admin 專屬的狀態
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any | null>(null);

  const handleMockLogin = (role: Role, email: string) => {
    setCurrentRole(role);
    setCurrentUserEmail(email);
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentUserEmail("");
    setEvents([]);
    setNotifications([]);
    setSystemUsers([]);
    setReportData(null);
  };

  // 讀取 Manager 與 Admin 共用的事件與通知資料
  const fetchManagerData = async () => {
    if (currentRole === "manager" || currentRole === "admin") {
      try {
        const res = await fetch(`/api/manager?email=${currentUserEmail}`);
        const data = await res.json();
        if (res.ok) {
          setEvents(data.events || []);
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to fetch manager data", err);
      }
    }
  };

  // Admin 專屬：讀取使用者列表與系統報表
  const fetchAdminData = async () => {
    if (currentRole === "admin") {
      try {
        const res = await fetch(`/api/admin?email=${currentUserEmail}`);
        const data = await res.json();
        if (res.ok) {
          setSystemUsers(data.users || []);
          setReportData(data.report || null);
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      }
    }
  };

  useEffect(() => {
    fetchManagerData();
    fetchAdminData();
  }, [currentRole]);

  // Admin 動作：修改角色
  const handleUpdateRole = async (targetUserId: number, newRole: Role) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUserEmail, targetUserId, newRole })
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Admin 動作：刪除使用者
  const handleRemoveUser = async (targetUserId: number) => {
    if (!confirm("Are you sure you want to completely remove this user?")) return;
    try {
      const res = await fetch(`/api/admin?adminEmail=${currentUserEmail}&targetUserId=${targetUserId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAdminData();
        fetchManagerData(); // 使用者被刪除，其對應的事件列表也需要同步重整
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentRole) {
    return (
      <main className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl text-center">
          <h1 className="text-3xl font-extrabold text-indigo-500 mb-2">Management Portal</h1>
          <p className="text-gray-400 mb-8 text-sm">Select a role below to simulate login and test permissions.</p>
          <div className="space-y-4">
            <button
              onClick={() => handleMockLogin("admin", "admin@company.com")}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg text-left px-6 flex justify-between items-center"
            >
              <span>🔴 Enter as Admin</span>
              <span className="text-xs bg-black/30 px-2 py-1 rounded">Full Control</span>
            </button>

            <button
              onClick={() => handleMockLogin("manager", "manager@company.com")}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg text-left px-6 flex justify-between items-center"
              >
              <span>🟡 Enter as Manager</span>
              <span className="text-xs bg-black/30 px-2 py-1 rounded">Reviewer</span>
            </button>

            <button
              onClick={() => handleMockLogin("user", "user@company.com")}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg text-left px-6 flex justify-between items-center"
            >
              <span>🔵 Enter as Normal User</span>
              <span className="text-xs bg-black/30 px-2 py-1 rounded">Form Submitter</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-4">
          <span className="text-xl font-black text-indigo-500 tracking-wider">WORKSPACE</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            currentRole === "admin" ? "bg-red-900/60 text-red-300 border border-red-700" :
            currentRole === "manager" ? "bg-amber-900/60 text-amber-300 border border-amber-700" :
            "bg-blue-900/60 text-blue-300 border border-blue-700"
          }`}>
            {currentRole} Mode
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">{currentUserEmail}</span>
          <button onClick={handleLogout} className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition border border-gray-700">
            Log out
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* 上方網格：一般功能與審核功能 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 區塊 A: Normal User 功能 */}
          <div className={`bg-gray-900 p-6 rounded-2xl border transition ${currentRole === "user" ? "border-blue-500 shadow-blue-900/20 shadow-lg" : "border-gray-800 opacity-40 select-none"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-400">📝 User Functions</h2>
              {currentRole !== "user" && <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">Locked</span>}
            </div>
            <p className="text-sm text-gray-400 mb-6">Submit requests, upload forms, and attach images or documents.</p>

            {currentRole === "user" ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  formData.append('email', currentUserEmail);
                  alert("Uploading...");
                  try {
                    const res = await fetch('/api/events', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (res.ok) { alert(data.message); form.reset(); } else { alert(data.error); }
                  } catch (err) { alert("Submission failed"); }
                }}
                className="space-y-4 text-left"
              >
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Event Title *</label>
                  <input type="text" name="title" required placeholder="e.g., Annual Leave Request" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Description</label>
                  <textarea name="description" rows={3} placeholder="Provide details here..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Attachment (Image/File)</label>
                  <input type="file" name="attachment" accept="image/*,.pdf,.doc,.docx" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-blue-400 hover:file:bg-gray-700 file:cursor-pointer" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-md">Submit Form Event</button>
              </form>
            ) : (
              <div className="text-xs text-gray-600 italic">Only accessible by Normal Users.</div>
            )}
          </div>

          {/* 區塊 B: Manager 功能 (Admin 可繼承使用) */}
          <div className={`bg-gray-900 p-6 rounded-2xl border transition lg:col-span-2 ${currentRole === "manager" || currentRole === "admin" ? "border-amber-500 shadow-amber-900/20 shadow-lg" : "border-gray-800 opacity-40 select-none"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-amber-400">⚖️ Manager Functions</h2>
              {!(currentRole === "manager" || currentRole === "admin") && <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">Locked</span>}
            </div>
            
            {(currentRole === "manager" || currentRole === "admin") ? (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 flex items-center gap-2">
                    <span>Notifications</span>
                    {notifications.length > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{notifications.length} New</span>}
                  </h3>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500 italic bg-gray-800/50 p-3 rounded-xl border border-gray-800">No new alerts.</p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="text-xs bg-amber-950/40 border border-amber-900 text-amber-300 p-3 rounded-xl flex justify-between items-center">
                          <span>🔔 {n.message}</span>
                          <span className="text-[10px] text-amber-600">{new Date(n.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Recent User Events Submission</h3>
                  {events.length === 0 ? (
                    <p className="text-sm text-gray-500 italic bg-gray-800/50 p-4 rounded-xl text-center">No events found in the system.</p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {events.map((ev) => (
                        <div key={ev.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{ev.title}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ev.status === 'approved' ? 'bg-green-900 text-green-300' : ev.status === 'rejected' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'}`}>{ev.status}</span>
                            </div>
                            <p className="text-xs text-gray-400">{ev.description || "No description provided."}</p>
                            <p className="text-[10px] text-gray-500">Submitted by: {ev.user_name || ev.user_email}</p>
                            {ev.attachment_url && <a href={ev.attachment_url} target="_blank" rel="noreferrer" className="inline-block text-xs text-blue-400 hover:underline mt-1">📁 View Attachment</a>}
                          </div>
                          {ev.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={async () => { const res = await fetch('/api/manager', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: currentUserEmail, eventId: ev.id, status: 'approved' }) }); if (res.ok) { fetchManagerData(); fetchAdminData(); } }} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition">Accept</button>
                              <button onClick={async () => { const res = await fetch('/api/manager', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: currentUserEmail, eventId: ev.id, status: 'rejected' }) }); if (res.ok) { fetchManagerData(); fetchAdminData(); } }} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition">Reject</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-600 italic">Accessible by Managers and Admins.</div>
            )}
          </div>
        </div>

        {/* ==========================================
            區塊 C: Admin 功能 (下方橫向大面板)
            ========================================== */}
        <div className={`bg-gray-900 p-6 rounded-2xl border transition ${currentRole === "admin" ? "border-red-500 shadow-red-900/20 shadow-lg" : "border-gray-800 opacity-40 select-none"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-red-400">⚙️ Admin Control Panel (System Management)</h2>
            {currentRole !== "admin" && <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">Locked</span>}
          </div>

          {currentRole === "admin" ? (
            <div className="space-y-6 text-left">
              
              {/* 📊 數據報表生成 (Generate Report) */}
              {reportData && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3">System Report Dashboard</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-xs text-gray-400">Total Registered</div>
                      <div className="text-2xl font-black text-white mt-1">{reportData.totalUsers} Users</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-xs text-gray-400">Role breakdown</div>
                      <div className="text-xs text-gray-300 mt-2 space-y-0.5">
                        <p>🔴 Admin: {reportData.roles.admin}</p>
                        <p>🟡 Manager: {reportData.roles.manager}</p>
                        <p>🔵 User: {reportData.roles.user}</p>
                      </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-xs text-gray-400">Pending Forms</div>
                      <div className="text-2xl font-black text-amber-500 mt-1">{reportData.events.pending} Items</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <div className="text-xs text-gray-400">Processed Events</div>
                      <div className="text-xs text-gray-300 mt-2 space-y-0.5">
                        <p>✅ Approved: {reportData.events.approved}</p>
                        <p>❌ Rejected: {reportData.events.rejected}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 👥 使用者列表控制與角色修改 (User List & Modify Role & Remove User) */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3">System User Directory</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-700">
                  <table className="w-full text-sm text-left text-gray-300 bg-gray-800">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400 font-bold">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">User Email</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Current Role</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {systemUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-700/50 transition">
                          <td className="px-4 py-3 text-gray-500 font-mono">{u.id}</td>
                          <td className="px-4 py-3 font-semibold text-white">{u.email}</td>
                          <td className="px-4 py-3 text-gray-400">{u.name || "N/A"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-red-900 text-red-300' : u.role === 'manager' ? 'bg-amber-900 text-amber-300' : 'bg-blue-900 text-blue-300'}`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3 flex items-center justify-center gap-2">
                            {/* 修改角色快捷選單 */}
                            <select 
                              value={u.role} 
                              onChange={(e) => handleUpdateRole(u.id, e.target.value as Role)}
                              className="bg-gray-950 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                            >
                              <option value="user">User</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>

                            {/* 刪除按鈕 (不能刪自己) */}
                            <button 
                              onClick={() => handleRemoveUser(u.id)}
                              disabled={u.email === currentUserEmail}
                              className={`px-2 py-1 rounded text-xs font-bold transition ${u.email === currentUserEmail ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-500 text-white"}`}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-xs text-gray-600 italic">Only accessible by System Administrators.</div>
          )}
        </div>

      </div>
    </main>
  );
}