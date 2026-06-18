import React, { useContext, useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import {
  GitBranch,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Plus,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function Sidebar() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false); // ← hamburger state

  const socketRef = useRef(null); // ✅ yeh line add karo — line 55 ke aas paas yahi missing thi

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const tokenInfo = localStorage.getItem("userInfo");
        const token = tokenInfo ? JSON.parse(tokenInfo)?.token : null;
        const res = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.projects || [];
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // ✅ NAYA — Socket setup: saare projects ke rooms join karo + delete listen karo
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(API_BASE_URL, { transports: ["websocket"] });
    const socket = socketRef.current;

    socket.on("connect", () => {
      if (user?._id) {
        socket.emit("join-user", user._id); // ✅ personal room join karo
      }
      projects.forEach((p) => socket.emit("join-project", p._id));
    });

    // Jab koi bhi project delete ho jisme yeh user hai
    socket.on("project-deleted", (data) => {
      setProjects((prev) => prev.filter((p) => p._id !== data.projectId));
    });

    // ✅ NAYA — invite hone par naya project add ho jaye
    socket.on("project-added", (data) => {
      if (!data?.project?._id) return;
      setProjects((prev) =>
        prev.some((p) => p._id === data.project._id)
          ? prev
          : [...prev, data.project],
      );
    });

    // ✅ NAYA — Dashboard pe baithe member ke liye bhi project list se hatao
    socket.on("project-removed", (data) => {
      if (!data?.projectId) return;
      setProjects((prev) => prev.filter((p) => p._id !== data.projectId));
    });

    return () => {
      socket.off("connect");
      socket.off("project-deleted");
      socket.off("project-added");
      socket.off("project-removed");
      socket.disconnect();
    };
  }, [user, projects.length]); // projects.length badlne par rooms re-join honge

  // Close sidebar when route changes on mobile
  const handleNavClick = () => setMobileOpen(false);

  const SidebarContent = () => (
    <>
      {/* Branding */}
      <div className="h-[60px] border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">
            Dev<span className="text-violet-400">Sync</span>
          </span>
        </div>
        {/* Close button — only on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavLink
          to="/dashboard"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-200 ${
              isActive
                ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20"
                : "text-white/40 hover:text-white hover:bg-white/[0.03]"
            }`
          }
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </NavLink>

        {/* Projects accordion */}
        <div className="pt-2">
          <button
            onClick={() => setProjectsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FolderKanban className="w-3.5 h-3.5" />
              Projects
            </span>
            {projectsOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {projectsOpen && (
            <div className="mt-1 space-y-0.5">
              {loadingProjects ? (
                <div className="flex items-center gap-2 px-4 py-2.5 text-white/20 text-[12px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </div>
              ) : projects.length === 0 ? (
                <p className="px-4 py-2 text-[12px] text-white/20 font-mono">
                  No projects yet
                </p>
              ) : (
                projects.map((project) => (
                  <NavLink
                    key={project._id}
                    to={`/project/${project._id}`}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-colors duration-200 truncate ${
                        isActive
                          ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                          : "text-white/35 hover:text-white hover:bg-white/[0.03]"
                      }`
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: project.color || "#7c3aed" }}
                    />
                    <span className="truncate">{project.name}</span>
                  </NavLink>
                ))
              )}

              <button
                onClick={() => {
                  navigate("/dashboard?new=true"); // ✅ query param se signal bhejo
                  handleNavClick();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-[12px] font-medium text-white/20 hover:text-white/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      {/* <div className="p-3 border-t border-white/[0.06] shrink-0">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div> */}
    </>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR — always visible on md+ ── */}
      <aside className="hidden md:flex w-[240px] border-r border-white/[0.06] bg-[#0e0e15] flex-col h-screen fixed top-0 left-0 z-50">
        <SidebarContent />
      </aside>

      {/* ── MOBILE: Hamburger button (top-left, inside Navbar area) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-[14px] left-4 z-[60] w-8 h-8 flex items-center justify-center rounded-lg bg-[#0e0e15] border border-white/[0.08] text-white/60 hover:text-white transition-colors cursor-pointer"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* ── MOBILE: Backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE: Slide-in drawer ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-[60] h-screen w-[260px] bg-[#0e0e15] border-r border-white/[0.06] flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

export default Sidebar;
