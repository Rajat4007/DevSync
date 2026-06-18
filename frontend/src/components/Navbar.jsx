import React, { useState, useContext, useRef, useEffect } from "react";
import { Bell, User, LogOut, Settings, CheckCheck, Trash2, CheckCircle2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

function Navbar({ pageTitle }) {
  const { user, logout,setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  // 1. Asli Notifications State
  const [notifications, setNotifications] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    // 👇 YEH SOCKET WALA USE-EFFECT ADD KARO 👇
  useEffect(() => {
    if (!user) return;

    // Socket connect karo
    const socket = io(API_BASE_URL);

    // Backend ko batao ki yeh kaunsa user hai (Personal Room join karwao)
    socket.emit("join-user", user._id || user.id);

    // Jab bhi backend bolega "new-notification", turant notifications fetch kar lo!
    socket.on("new-notification", () => {
      fetchNotifications();
    });

    socket.on("profile-updated", (newProfilePicUrl) => {
      // 1. Apne current 'user' object ko update karo
      const updatedUser = { ...user, profilePic: newProfilePicUrl };
      
      // 2. Local Storage mein naya data save kar do taaki refresh par wapas purani photo na aaye
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      
      // 3. Agar tumhare paas context mein setUser function hai, toh usko call kardo (warna agle refresh par update ho jayega)
      setUser(updatedUser); 
    });

    // Cleanup taaki multiple connection na bane
    return () => {
      socket.disconnect();
    };
  }, [user]);

  // 2. Backend se Notifications laana
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  // Jab page load ho tab notifications lao
  useEffect(() => {
    if (user?.token) {
      fetchNotifications();
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 3. Mark All As Read
  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  // 4. Mark Single As Read (Yahan id MongoDB wali _id hai)
  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error(error);
    }
  };

  // 5. Delete Notification
  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(notifications.filter((n) => n._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // 🔥 Temporary function for testing
  // const sendTestNotification = async () => {
  //   try {
  //     await axios.post(`${API_BASE_URL}/api/notifications/test`, {}, {
  //       headers: { Authorization: `Bearer ${user.token}` },
  //     });
  //     fetchNotifications(); // Nayi notif aane ke baad list refresh kar do
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // Click outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setIsNotificationOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (logout) logout();
    else localStorage.removeItem("userInfo");
    navigate("/login");
    window.location.reload();
  };

  // Date format function (Taaki ISO time acha dikhe)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <header className="h-[60px] border-b border-white/[0.05] bg-[#0a0a0f]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <h2 className="text-[15px] font-bold text-white tracking-wide">
        {pageTitle || "Dashboard"}
      </h2>

      <div className="flex items-center gap-4">
        
        {/* ── TEMPORARY MAGIC BUTTON ── */}
        {/* <button 
          onClick={sendTestNotification}
          className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30 transition-colors"
        >
          + Add Test
        </button> */}
        {/* ── NOTIFICATION LOGIC ── */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsProfileOpen(false);
            }}
            className="relative text-white/40 hover:text-white transition-colors cursor-pointer p-1"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-violet-500 rounded-full border border-[#0a0a0f]"></span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-[#111118] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.02] flex justify-between items-center">
                <span className="text-[13px] font-bold text-white flex items-center gap-2">
                  Notifications 
                  {unreadCount > 0 && (
                    <span className="bg-violet-600 px-1.5 py-0.5 rounded-full text-[10px]">
                      {unreadCount} new
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors cursor-pointer">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-white/40 text-[12px]">
                    All caught up! No new notifications. 🚀
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`px-4 py-3 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group relative ${!notif.isRead ? 'bg-violet-500/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {!notif.isRead ? (
                            <div className="w-2 h-2 bg-violet-500 rounded-full mt-1.5"></div>
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white/20 mt-0.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-[12px] leading-relaxed ${!notif.isRead ? 'text-white/90 font-medium' : 'text-white/50'}`}>
                            {notif.text}
                          </p>
                          <span className="text-[10px] text-white/30 mt-1 block">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex bg-[#111118] border border-white/5 rounded-md shadow-lg overflow-hidden">
                        {!notif.isRead && (
                          <button onClick={() => markAsRead(notif._id)} className="p-1.5 hover:bg-white/10 text-white/60 hover:text-violet-400 transition-colors cursor-pointer" title="Mark as read">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(notif._id)} className="p-1.5 hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

        {/* ── PROFILE & DROPDOWN ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationOpen(false);
            }}
            className="flex items-center gap-2 hover:bg-white/[0.05] p-1 pr-2 rounded-full transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-[12px] font-medium text-white/70 hidden sm:block">
              {user?.name?.split(" ")[0] || "Developer"}
            </span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#111118] border border-white/[0.08] rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
                <p className="text-[13px] font-bold text-white truncate">
                  {user?.name || "Developer"}
                </p>
                <p className="text-[11px] text-white/40 truncate">
                  {user?.email || "dev@sync.com"}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { navigate("/profile"); setIsProfileOpen(false); }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" /> My Profile
                </button>
                <button 
                  onClick={() => { navigate("/settings"); setIsProfileOpen(false); }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" /> Account Settings
                </button>
              </div>

              <div className="border-t border-white/[0.04] py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;