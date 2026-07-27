import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  KanbanSquare,
  Loader2,
  X,
  FolderKanban,
  Trash2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const COLORS = ["#8b5cf6", "#3b82f6", "#f59e0b", "#10b981"];

const getToken = () => {
  const info = localStorage.getItem("userInfo");
  return info ? JSON.parse(info)?.token : null;
};

function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0 });

  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const socketRef = useRef(null);

  // 1. Function ko bahr nikl lenge  (useCallback ke sath taaki memory leak na ho)
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingProjects(true);
      setChartLoading(true);

      const projRes = await axios.get(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const fetchedProjects = Array.isArray(projRes.data)
        ? projRes.data
        : projRes.data.projects || [];

      if (fetchedProjects.length === 0) {
        setProjects([]);
        setStats({ total: 0, inProgress: 0, completed: 0 }); // Stats reset
        setPieData([]);
        setBarData([]);
        setLoadingProjects(false);
        setChartLoading(false);
        return;
      }

      const tasksPromises = fetchedProjects.map((p) =>
        axios
          .get(`${API_BASE_URL}/api/tasks/project/${p._id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          })
          .catch(() => ({ data: [] })),
      );

      const tasksResponses = await Promise.all(tasksPromises);

      let allTasks = [];
      const bData = [];
      
      const projectsWithCounts = fetchedProjects.map((proj, index) => {
        const projectTasks = Array.isArray(tasksResponses[index].data)
          ? tasksResponses[index].data
          : tasksResponses[index].data.tasks || [];
        
        allTasks = [...allTasks, ...projectTasks];

        bData.push({
          name: proj.name.substring(0, 10) + (proj.name.length > 10 ? "..." : ""),
          tasks: projectTasks.length,
        });

        return {
          ...proj,
          taskCount: projectTasks.length 
        };
      });

      setProjects(projectsWithCounts);
      setBarData(bData);

      const doneTasks = allTasks.filter((t) => t.status === "Done").length;
      const inProgTasks = allTasks.filter((t) => t.status === "In Progress").length;

      setStats({
        total: allTasks.length,
        inProgress: inProgTasks,
        completed: doneTasks,
      });

      const statusCounts = { "To-Do": 0, "In Progress": 0, Review: 0, Done: 0 };
      allTasks.forEach((t) => {
        if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
      });

      setPieData([
        { name: "To Do", value: statusCounts["To-Do"] },
        { name: "In Progress", value: statusCounts["In Progress"] },
        { name: "Review", value: statusCounts["Review"] },
        { name: "Done", value: statusCounts["Done"] },
      ]);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingProjects(false);
      setChartLoading(false);
    }
  }, [user]);

  // 2. Initial Data Load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 3. Query params handler
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsModalOpen(true);
      setSearchParams({}); 
    }
  }, [searchParams]);

  // 4. SOCKET SETUP (Ab seedha fetchDashboardData call hoga)
  useEffect(() => {
    if (!user) return;
    socketRef.current = io(API_BASE_URL, { transports: ["websocket"] });
    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("join-user", user._id || user.id);
    });

    // Jab koi dusre browser se project delete ya add kare, ya task add kare, toh sab refresh kar do!
    socket.on("project-removed", () => fetchDashboardData());
    socket.on("project-added", () => fetchDashboardData());
    socket.on("dashboard-updated", () => fetchDashboardData()); 

    return () => {
      socket.off("connect");
      socket.off("project-removed");
      socket.off("project-added");
      socket.off("dashboard-updated");
      socket.disconnect();
    };
  }, [user, fetchDashboardData]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setCreating(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/projects`,
        { name: newProjectName, description: newProjectDesc },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      const created = res.data?.project || res.data;
      
      setNewProjectName("");
      setNewProjectDesc("");
      setIsModalOpen(false);

      // Navigate apne aap data refetch karwa dega new page par
      navigate(`/project/${created._id}`);
    } catch (err) {
      console.error("Failed to create project:", err.response?.data || err);
    } finally {
      setCreating(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111118] border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-white text-[12px] font-semibold">{`${payload[0].name} : ${payload[0].value} Tasks`}</p>
        </div>
      );
    }
    return null;
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project and ALL its Tasks? This action cannot be undone.")) return;

    setDeletingId(projectId);
    try {
      await axios.delete(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      
      fetchDashboardData();
    } catch (err) {
      console.error("Delete failed: ", err.response?.data || err);
      alert("Failed to delete project. Are you sure you are the owner?");
    } finally {
      setDeletingId(null);
    }
  };

  const isProjectOwner = (project) => {
    if (!user || !project) return false;
    const ownerRaw = project.owner || project.createdBy;
    if (!ownerRaw) return false;
    const ownerId = typeof ownerRaw === "object" ? (ownerRaw._id || ownerRaw.id) : ownerRaw;
    const currentUserId = user._id || user.id;
    if (!ownerId || !currentUserId) return false;
    return String(ownerId) === String(currentUserId);
  };

  const cardAccents = [
    "border-violet-500/20 hover:border-violet-500/40",
    "border-blue-500/20 hover:border-blue-500/40",
    "border-emerald-500/20 hover:border-emerald-500/40",
    "border-amber-500/20 hover:border-amber-500/40",
    "border-pink-500/20 hover:border-pink-500/40",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-sans text-white">
      <Sidebar />

      <div className="md:pl-60">
        <Navbar pageTitle="Project Dashboard" />

        <main className="p-4 md:p-6 max-w-6xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "Developer"} 👋
            </h1>
            <p className="text-[13px] text-white/40 mt-0.5">
              Here's your sprint velocity overview.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Tasks", value: stats.total },
              { label: "In Progress", value: stats.inProgress },
              { label: "Completed", value: stats.completed },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/6 bg-[#111118] p-5 relative overflow-hidden group">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-white/35">
                  {metric.label}
                </div>
                <div className="text-3xl font-bold text-white mt-2">
                  {metric.value}
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-violet-600/2 rounded-full blur-md group-hover:bg-violet-600/6 transition-all duration-300" />
              </div>
            ))}
          </div>

          {!chartLoading && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="rounded-2xl border border-white/6 bg-[#111118] p-5">
                <h3 className="text-[13px] font-bold text-white mb-4 uppercase tracking-wider">
                  Task Distribution
                </h3>
                <div className="h-55 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-[11px] font-medium text-white/50">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/6 bg-[#111118] p-5">
                <h3 className="text-[13px] font-bold text-white mb-4 uppercase tracking-wider">
                  Tasks per Project
                </h3>
                <div className="h-55 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#ffffff40" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#ffffff40" }} />
                      <Tooltip cursor={{ fill: "#ffffff05" }} contentStyle={{ backgroundColor: "#111118", borderColor: "#ffffff10", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }} itemStyle={{ color: "#fff" }} />
                      <Bar dataKey="tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-white tracking-tight">Your Projects</h2>
            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-lg shadow-violet-900/20">
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div onClick={() => setIsModalOpen(true)} className="rounded-2xl border border-dashed border-white/8 bg-[#111118]/40 p-12 text-center cursor-pointer hover:border-violet-500/30 hover:bg-violet-500/2 transition-all duration-200 group">
              <FolderKanban className="w-8 h-8 text-white/10 group-hover:text-violet-400/40 mx-auto mb-3 transition-colors" />
              <p className="text-[13px] font-medium text-white/20 group-hover:text-white/40 transition-colors">
                No projects yet — click to create one
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, i) => {
                const showDelete = isProjectOwner(project);

                return (
                  <div key={project._id} onClick={() => navigate(`/project/${project._id}`)} className={`rounded-2xl border bg-[#111118] p-5 cursor-pointer transition-all duration-200 hover:bg-[#111118]/80 group ${cardAccents[i % cardAccents.length]}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
                        <KanbanSquare className="w-4 h-4 text-violet-400" />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-white/20 bg-white/3 border border-white/5 px-2 py-1 rounded-lg">
                          {project.taskCount ?? 0} tasks
                        </span>

                        {showDelete && (
                          <button onClick={(e) => handleDeleteProject(e, project._id)} disabled={deletingId === project._id} className="relative z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white bg-red-600 hover:bg-red-500 transition-all cursor-pointer shadow-lg shadow-red-900/30" title="Delete project">
                            {deletingId === project._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold tracking-wider">DELETE</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-[14px] font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-[12px] text-white/35 mt-1 line-clamp-2 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>

                    <div className="mt-4 pt-3 border-t border-white/4 flex items-center justify-between text-[11px] text-white/25">
                      <span>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recently created"}
                      </span>
                      <span className="text-violet-400/50 group-hover:text-violet-400 transition-colors font-medium">
                        Open Board →
                      </span>
                    </div>
                  </div>
                );
              })}

              <div onClick={() => setIsModalOpen(true)} className="rounded-2xl border border-dashed border-white/6 bg-transparent p-5 cursor-pointer hover:border-violet-500/25 hover:bg-violet-500/2 transition-all duration-200 group flex flex-col items-center justify-center gap-2 min-h-35">
                <Plus className="w-5 h-5 text-white/15 group-hover:text-violet-400/50 transition-colors" />
                <span className="text-[12px] text-white/15 group-hover:text-white/30 transition-colors font-medium">
                  New Project
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/6 bg-[#111118] p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-white tracking-tight mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Project Name *</label>
                <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g., DevSync Backend Sprint" className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500 transition-colors" required autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Description <span className="normal-case text-white/20 tracking-normal font-normal">(*)</span></label>
                <textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} placeholder="What is this project about?" rows="3" className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500 transition-colors resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-[13px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={creating} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-colors cursor-pointer shadow-lg">
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;