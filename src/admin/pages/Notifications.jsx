import React, { useState } from "react";
import { adminAPI } from "../../services/api";
import { toast } from "react-hot-toast";
import {
  FaBell, FaPaperPlane, FaUsers, FaCar, FaBroadcastTower,
  FaClock, FaHistory, FaExclamationTriangle,
} from "react-icons/fa";

const TARGETS = [
  { value: "all",     label: "Everyone",      icon: <FaBroadcastTower />, desc: "All users and drivers" },
  { value: "users",   label: "All Customers", icon: <FaUsers />,          desc: "All registered customers" },
  { value: "drivers", label: "All Drivers",   icon: <FaCar />,            desc: "All registered drivers" },
];

const TEMPLATES = [
  { title: "App Update",    body: "A new version of GaonConnect is available. Please update for the best experience." },
  { title: "Festival Offer", body: "Festive season discount! Get 20% off on all rides today. Happy festivities!" },
  { title: "Maintenance",   body: "We will be doing maintenance from 2AM-4AM tonight. Sorry for the inconvenience." },
  { title: "New Feature",   body: "Exciting new features are now live! Open the app to explore them." },
];

const HISTORY_KEY = "gcNotifHistory";

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
};

const ConfirmModal = ({ data, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
          <FaExclamationTriangle />
        </div>
        <h3 className="font-bold text-gray-800 text-lg">Confirm Send</h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        You are about to send a notification to <strong>{data.target}</strong>.
      </p>
      <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4 border border-gray-200">
        <p className="font-semibold text-gray-800">{data.title}</p>
        <p className="text-gray-500 mt-0.5 text-xs">{data.body}</p>
        {data.scheduledAt && (
          <p className="text-orange-500 text-xs mt-1 flex items-center gap-1">
            <FaClock /> Scheduled: {new Date(data.scheduledAt).toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
        >
          <FaPaperPlane /> Confirm Send
        </button>
      </div>
    </div>
  </div>
);

const Notifications = () => {
  const [tab, setTab]         = useState("bulk");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [history, setHistory] = useState(loadHistory);

  const [bulk,   setBulk]   = useState({ target: "all", title: "", body: "", scheduledAt: "" });
  const [single, setSingle] = useState({ userId: "", title: "", body: "" });

  const pushHistory = (item) => {
    const updated = [{ ...item, sentAt: new Date().toISOString() }, ...history].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const applyTemplate = (template, isBulk) => {
    if (isBulk) setBulk((b) => ({ ...b, title: template.title, body: template.body }));
    else        setSingle((s) => ({ ...s, title: template.title, body: template.body }));
  };

  const requestBulk = () => {
    if (!bulk.title.trim() || !bulk.body.trim()) { toast.error("Title and message are required"); return; }
    const target = TARGETS.find((t) => t.value === bulk.target)?.label;
    setConfirm({ type: "bulk", target, title: bulk.title, body: bulk.body, scheduledAt: bulk.scheduledAt });
  };

  const requestSingle = () => {
    if (!single.userId.trim())                      { toast.error("User/Driver ID is required"); return; }
    if (!single.title.trim() || !single.body.trim()) { toast.error("Title and message are required"); return; }
    setConfirm({ type: "single", target: `User ID: ${single.userId}`, title: single.title, body: single.body });
  };

  const doSend = async () => {
    const data = confirm;
    setConfirm(null);
    setSending(true);
    try {
      if (data.type === "bulk") {
        await adminAPI.sendBulkNotification({
          target: bulk.target,
          title: bulk.title,
          body: bulk.body,
          ...(bulk.scheduledAt ? { scheduledAt: bulk.scheduledAt } : {}),
        });
        toast.success(bulk.scheduledAt ? "Notification scheduled!" : "Bulk notification sent!");
        pushHistory({ type: "bulk", target: TARGETS.find((t) => t.value === bulk.target)?.label, title: bulk.title });
        setBulk({ target: "all", title: "", body: "", scheduledAt: "" });
      } else {
        await adminAPI.sendNotification({ userId: single.userId, title: single.title, body: single.body });
        toast.success("Notification sent!");
        pushHistory({ type: "single", target: `User: ${single.userId}`, title: single.title });
        setSingle({ userId: "", title: "", body: "" });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const minSchedule = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <>
      {confirm && <ConfirmModal data={confirm} onConfirm={doSend} onCancel={() => setConfirm(null)} />}

      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl shadow p-1">
          {[
            { key: "bulk",   label: "Bulk Notification",   icon: <FaBroadcastTower /> },
            { key: "single", label: "Single Notification", icon: <FaBell /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === t.key ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Quick Templates */}
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Quick Templates</p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => applyTemplate(t, tab === "bulk")}
                className="text-left px-3 py-2 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition text-sm"
              >
                <p className="font-medium text-gray-700">{t.title}</p>
                <p className="text-xs text-gray-400 truncate">{t.body}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Notification */}
        {tab === "bulk" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-5">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <FaBroadcastTower className="text-orange-500" /> Send to Group
            </h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Target Audience</label>
              <div className="grid grid-cols-3 gap-3">
                {TARGETS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setBulk((b) => ({ ...b, target: t.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition text-sm font-medium ${
                      bulk.target === t.value
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span>{t.label}</span>
                    <span className="text-xs font-normal text-gray-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Title</label>
              <input
                type="text"
                maxLength={80}
                placeholder="Notification title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={bulk.title}
                onChange={(e) => setBulk((b) => ({ ...b, title: e.target.value }))}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{bulk.title.length}/80</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Message</label>
              <textarea
                rows={4}
                maxLength={500}
                placeholder="Write your notification message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                value={bulk.body}
                onChange={(e) => setBulk((b) => ({ ...b, body: e.target.value }))}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{bulk.body.length}/500</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                <FaClock className="text-orange-400" /> Schedule (optional)
              </label>
              <input
                type="datetime-local"
                min={minSchedule}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mt-1"
                value={bulk.scheduledAt}
                onChange={(e) => setBulk((b) => ({ ...b, scheduledAt: e.target.value }))}
              />
              {bulk.scheduledAt && (
                <p className="text-xs text-orange-500 mt-1">
                  Will be sent on {new Date(bulk.scheduledAt).toLocaleString()}
                </p>
              )}
            </div>

            {(bulk.title || bulk.body) && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-400 mb-2">Preview</p>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FaBell className="text-orange-500 text-xs" />
                    <span className="text-xs font-semibold text-gray-500">GaonConnect</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{bulk.title || "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{bulk.body || "—"}</p>
                </div>
              </div>
            )}

            <button
              onClick={requestBulk}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition"
            >
              {bulk.scheduledAt ? <FaClock /> : <FaPaperPlane />}
              {sending
                ? "Sending..."
                : bulk.scheduledAt
                ? "Schedule Notification"
                : `Send to ${TARGETS.find((t) => t.value === bulk.target)?.label}`}
            </button>
          </div>
        )}

        {/* Single Notification */}
        {tab === "single" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-5">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <FaBell className="text-orange-500" /> Send to Individual
            </h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">User / Driver ID</label>
              <input
                type="text"
                placeholder="Paste user or driver ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={single.userId}
                onChange={(e) => setSingle((s) => ({ ...s, userId: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Copy the ID from Customers or Drivers page</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Title</label>
              <input
                type="text"
                maxLength={80}
                placeholder="Notification title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={single.title}
                onChange={(e) => setSingle((s) => ({ ...s, title: e.target.value }))}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{single.title.length}/80</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Message</label>
              <textarea
                rows={4}
                maxLength={500}
                placeholder="Write your message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                value={single.body}
                onChange={(e) => setSingle((s) => ({ ...s, body: e.target.value }))}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{single.body.length}/500</p>
            </div>

            {(single.title || single.body) && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-400 mb-2">Preview</p>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FaBell className="text-orange-500 text-xs" />
                    <span className="text-xs font-semibold text-gray-500">GaonConnect</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{single.title || "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{single.body || "—"}</p>
                </div>
              </div>
            )}

            <button
              onClick={requestSingle}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition"
            >
              <FaPaperPlane />
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        )}

        {/* Sent History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-1">
              <FaHistory className="inline mr-1" /> Recently Sent
            </p>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      h.type === "bulk" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {h.type === "bulk" ? "Bulk" : "Single"}
                    </span>
                    <span className="text-sm text-gray-700 truncate font-medium">{h.title}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{h.target}</p>
                    <p className="text-xs text-gray-400">{new Date(h.sentAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Notifications;
