import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Plus, Calendar, X,
  Loader2, Wifi, WifiOff, Pencil, Trash2, ChevronRight
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const COLUMNS = [
  { title: "To Do",       status: "To-Do",       color: "text-white/40",  tabBorder: "border-white/40"  },
  { title: "In Progress", status: "In Progress",  color: "text-blue-400",  tabBorder: "border-blue-400"  },
  { title: "Review",      status: "Review",       color: "text-amber-400", tabBorder: "border-amber-400" },
  { title: "Done",        status: "Done",         color: "text-green-400", tabBorder: "border-green-400" },
];

const getPriorityStyle = (p) => {
  if (p === "high")   return "bg-red-500/10 text-red-400 border-red-500/15";
  if (p === "medium") return "bg-amber-500/10 text-amber-400 border-amber-500/15";
  return "bg-green-500/10 text-green-400 border-green-500/15";
};

// ── Desktop: Droppable column wrapper ──────
function DroppableColumn({ id, isOver, children }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2.5 min-h-15 rounded-xl p-1 transition-colors duration-200 ${
        isOver ? "bg-violet-500/5" : ""
      }`}
    >
      {children}
    </div>
  );
}

// ── Desktop: Draggable task card ────
function DraggableCard({ task, isOwner, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: 0.35, zIndex: 999 }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCardUI task={task} isOwner={isOwner} onEdit={onEdit} onDelete={onDelete} isDragging={isDragging} />
    </div>
  );
}

// ── Move To Bottom Sheet for Mobile  ──────
function MoveBottomSheet({ task, onMoveTo, onClose }) {
  const otherColumns = COLUMNS.filter((c) => c.status !== task.status);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-100 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-[#111118] borderborder-white/8 rounded-t-2xl p-5 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">
          Move "{task.title.substring(0, 28)}{task.title.length > 28 ? '...' : ''}" to
        </p>

        <div className="flex flex-col gap-2">
          {otherColumns.map((col) => (
            <button
              key={col.status}
              onClick={() => { onMoveTo(task._id, col.status); onClose(); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/6 bg-white/3 active:bg-white/8 transition-colors cursor-pointer`}
            >
              <span className={`text-[14px] font-semibold ${col.color}`}>{col.title}</span>
              <ChevronRight className={`w-4 h-4 ${col.color}`} />
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-3 text-[13px] font-medium text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Shared Task Card UI ─────
function TaskCardUI({ task, isOwner, onEdit, onDelete, isDragging = false, onMoveTo = null }) {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <div className={`group relative rounded-xl border bg-[#111118] p-4 transition-all duration-200 select-none
        ${isDragging ? "border-violet-500/40 shadow-2xl shadow-black/60" : "border-white/6 hover:border-white/15"}`}
      >
        {/* Priority + action buttons */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityStyle(task.priority)}`}>
            {task.priority || "medium"}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Owner: Edit + Delete */}
            {isOwner && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                  className="p-1 rounded-lg text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                  className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-bold text-white tracking-tight leading-snug group-hover:text-violet-400 transition-colors">
          {task.title}
        </h3>

        {/* Description */}
        <p className="text-[12px] text-white/40 leading-relaxed mt-1 line-clamp-2">
          {task.description}
        </p>

        <div className="border-t border-white/4 my-3" />

        {/* Footer */}
        <div className="flex items-center justify-between text-white/30 text-[11px]">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-white/20" />
            <span>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Today"}
            </span>
          </div>

          {/* Move To button — sirf mobile par aur sirf jab onMoveTo prop ho */}
          {onMoveTo && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSheet(true); }}
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-400/70 hover:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-2.5 py-1 rounded-full transition-colors cursor-pointer active:scale-95"
            >
              Move <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Sheet Portal */}
      {showSheet && onMoveTo && (
        <MoveBottomSheet
          task={task}
          onMoveTo={onMoveTo}
          onClose={() => setShowSheet(false)}
        />
      )}
    </>
  );
}

// ── Main Component ────
function KanbanBoard() {
  const { projectId } = useParams();
  const navigate       = useNavigate(); //
  const { user }      = useContext(AuthContext);

  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isConnected, setIsConnected]   = useState(false);
  const [activeTab, setActiveTab]       = useState("To-Do");
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [overColumnId, setOverColumnId] = useState(null);
  const [projectOwner, setProjectOwner] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [newTitle, setNewTitle]               = useState("");
  const [newDesc, setNewDesc]                 = useState("");
  const [newPriority, setNewPriority]         = useState("medium");
  const [newDueDate, setNewDueDate]           = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail]             = useState("");
  const [inviteMessage, setInviteMessage]         = useState({ text: "", type: "" });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask]         = useState(null);
  const [editTitle, setEditTitle]             = useState("");
  const [editDesc, setEditDesc]               = useState("");
  const [editPriority, setEditPriority]       = useState("medium");
  const [editDueDate, setEditDueDate] = useState("");

  const socketRef = useRef(null);

  // ── dnd-kit sensors for desktop only ───────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Socket ka code ──────
  useEffect(() => {
    if (socketRef.current?.connected) return;
    socketRef.current = io(API_BASE_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    const socket = socketRef.current;

    socket.on("connect", () => { setIsConnected(true); socket.emit("join-project", projectId); });
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("task-updated", (data) => {
      if (!data?.taskId || !data?.newStatus) return;
      setTasks((prev) => prev.map((t) => t._id === data.taskId ? { ...t, status: data.newStatus } : t));
    });
    socket.on("task-added", (data) => {
      if (!data?.task?._id) return;
      setTasks((prev) => prev.some((t) => t._id === data.task._id) ? prev : [...prev, data.task]);
    });
    socket.on("task-edited", (data) => {
      if (!data?.task?._id) return;
      setTasks((prev) => prev.map((t) => t._id === data.task._id ? data.task : t));
    });
    socket.on("task-deleted", (data) => {
      if (!data?.taskId) return;
      setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
    });

     // agar project hi delete ho gaya toh dashboard pe bhej do
    socket.on("project-deleted", (data) => {
      if (data.projectId === projectId) {
        alert("This project has been deleted by the owner.");
        navigate("/dashboard");
      }
    });

    return () => {
      socket.off("connect"); socket.off("disconnect");
      socket.off("task-updated"); socket.off("task-added");
      socket.off("task-edited"); socket.off("task-deleted");
       socket.off("project-deleted"); 
      socket.disconnect();
    };
  }, [projectId]);

  // ── Fetch ────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
        const [tasksRes, projRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/tasks/project/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/projects/${projectId}`,      { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data.tasks || []);
        const proj = projRes.data?.project || projRes.data;
        setProjectOwner(String(proj?.owner?._id || proj?.owner));
      } catch (err) { console.error("Fetch error:", err); }
      finally { setLoading(false); }
    };
    if (projectId) fetchData();
  }, [projectId]);

  // ── Move task (used by both desktop DnD and mobile "Move To") ────────────
  const moveTask = async (taskId, targetStatus) => {
    const original = [...tasks];
    setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: targetStatus } : t));
    try {
      const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
      await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}/status`,
        { status: targetStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socketRef.current?.emit("task-moved", { projectId, taskId, newStatus: targetStatus });
    } catch (err) { console.error("Move failed:", err); setTasks(original); }
  };

  // ── Desktop DnD handlers ───────
  const handleDragStart = ({ active }) => setActiveTaskId(active.id);
  const handleDragOver  = ({ over })   => setOverColumnId(over?.id || null);
  const handleDragEnd   = ({ active, over }) => {
    setActiveTaskId(null); setOverColumnId(null);
    if (!over) return;
    const task = tasks.find((t) => t._id === active.id);
    if (task && task.status !== over.id) moveTask(active.id, over.id);
  };

  // ── Create task ────────
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
      const res = await axios.post(
        `${API_BASE_URL}/api/tasks`,
        { 
          title: newTitle,
          description: newDesc, 
          project: projectId, 
          status: "To-Do", 
          priority: newPriority,
          dueDate:newDueDate||null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsModalOpen(false); setNewTitle(""); setNewDesc(""); setNewPriority("medium");setNewDueDate("");
      setTasks((prev) => [...prev, res.data]);
      socketRef.current?.emit("task-created", { projectId, task: res.data });
    } catch (err) { console.error("Create error:", err.response?.data || err); }
  };

  // ── Edit task ───────
  const openEditModal = (task) => {
    setEditingTask(task); setEditTitle(task.title);
    setEditDesc(task.description || ""); setEditPriority(task.priority || "medium");
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0]:"");
    setIsEditModalOpen(true);
  };
  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingTask) return;
    try {
      const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
      const res = await axios.put(
        `${API_BASE_URL}/api/tasks/${editingTask._id}`,
        { 
          title: editTitle, 
          description: editDesc, 
          priority: editPriority,
          dueDate: editDueDate || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks((prev) => prev.map((t) => t._id === editingTask._id ? res.data : t));
      socketRef.current?.emit("task-edited", { projectId, task: res.data });
      setIsEditModalOpen(false); setEditingTask(null);
    } catch (err) { console.error("Edit error:", err.response?.data || err); }
  };

  // ── Delete task ──────
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    const original = [...tasks];
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    try {
      const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
      await axios.delete(`${API_BASE_URL}/api/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
      socketRef.current?.emit("task-deleted", { projectId, taskId });
    } catch (err) { console.error("Delete error:", err); setTasks(original); }
  };

  // ── Invite ───────
  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteMessage({ text: "Inviting...", type: "loading" });
    try {
      const token = JSON.parse(localStorage.getItem("userInfo"))?.token;
      const res = await axios.post(
        `${API_BASE_URL}/api/projects/${projectId}/invite`,
        { email: inviteEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteMessage({ text: res.data.message || "User added!", type: "success" });
      setTimeout(() => { setIsInviteModalOpen(false); setInviteEmail(""); setInviteMessage({ text: "", type: "" }); }, 2000);
    } catch (err) { setInviteMessage({ text: err.response?.data?.message || "Error", type: "error" }); }
  };

  const isOwner    = String(user?._id || user?.id) === projectOwner;
  const activeTask = tasks.find((t) => t._id === activeTaskId);

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-sans text-white relative">
      <Sidebar />
      <div className="md:pl-60">
        <Navbar pageTitle="Sprint Board" />
        <main className="p-4 md:p-6 flex flex-col h-[calc(100vh-60px)]">

          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="pl-10 md:pl-0">
              <h1 className="text-[15px] md:text-xl font-bold tracking-tight text-white">DevSync Sprint Board</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isConnected
                  ? <><Wifi className="w-3 h-3 text-green-400" /><p className="text-[11px] text-green-400/70">Live • Real-time sync active</p></>
                  : <><WifiOff className="w-3 h-3 text-white/25" /><p className="text-[11px] text-white/25">Connecting...</p></>
                }
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button onClick={() => setIsInviteModalOpen(true)} className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold bg-white/5 hover:bg-white/10 border border-white/5 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer">
                  Invite Team
                </button>
                <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold bg-violet-600 hover:bg-violet-500 text-white px-3 md:px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-lg shadow-violet-900/20">
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Task</span>
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* ════════════════════════════════════════════════════════════
                  MOBILE — Tab view + "Move To" button
              ════════════════════════════════════════════════════════════ */}
              <div className="md:hidden flex flex-col flex-1 min-h-0">

                {/* Tab bar */}
                <div className="flex border-b border-white/6 mb-4 overflow-x-auto">
                  {COLUMNS.map((col) => {
                    const count    = tasks.filter((t) => t.status === col.status).length;
                    const isActive = activeTab === col.status;
                    return (
                      <button
                        key={col.status}
                        onClick={() => setActiveTab(col.status)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-all cursor-pointer ${
                          isActive ? `${col.color} ${col.tabBorder}` : "text-white/30 border-transparent"
                        }`}
                      >
                        {col.title}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
                          isActive
                            ? "bg-white/[0.06]border-white/8 text-white/50"
                            : "bg-white/2 border-white/4 text-white/20"
                        }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Task list for active tab */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pb-4">
                  {tasks.filter((t) => t.status === activeTab).length === 0 ? (
                    <div className="border border-dashed border-white/4 rounded-xl py-16 text-center text-white/10 text-[11px] font-mono">
                      Empty Section
                    </div>
                  ) : (
                    tasks.filter((t) => t.status === activeTab).map((task) => (
                      <TaskCardUI
                        key={task._id}
                        task={task}
                        isOwner={isOwner}
                        onEdit={openEditModal}
                        onDelete={handleDeleteTask}
                        onMoveTo={moveTask}  // ← "Move To" button activate hoga
                      />
                    ))
                  )}
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════
                  DESKTOP — 4 column Drag & Drop (dnd-kit)
              ════════════════════════════════════════════════════════════ */}
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="hidden md:grid grid-cols-4 gap-4 flex-1 items-start min-h-0 overflow-y-auto pb-4">
                  {COLUMNS.map((col) => {
                    const colTasks  = tasks.filter((t) => t.status === col.status);
                    const isGlowing = overColumnId === col.status;
                    return (
                      <div
                        key={col.status}
                        className={`flex flex-col max-h-full rounded-2xl border bg-[#111118]/40 p-4 transition-all duration-200 ${
                          isGlowing ? "border-violet-500/30 bg-violet-500/2" : "border-white/4"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4 px-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[12px] font-bold uppercase tracking-wider ${col.color}`}>{col.title}</span>
                            <span className="text-[11px] font-mono text-white/20 bg-white/3 border border-white/5 px-1.5 py-0.5 rounded-md">
                              {colTasks.length}
                            </span>
                          </div>
                        </div>

                        <DroppableColumn id={col.status} isOver={isGlowing}>
                          {colTasks.map((task) => (
                            <DraggableCard
                              key={task._id}
                              task={task}
                              isOwner={isOwner}
                              onEdit={openEditModal}
                              onDelete={handleDeleteTask}
                            />
                          ))}
                          {colTasks.length === 0 && (
                            <div className="border border-dashed border-white/4 rounded-xl py-8 text-center text-white/10 text-[11px] font-mono">
                              Empty Section
                            </div>
                          )}
                        </DroppableColumn>
                      </div>
                    );
                  })}
                </div>

                {/* Drag overlay */}
                <DragOverlay dropAnimation={null}>
                  {activeTask ? (
                    <div className="rotate-1 scale-105 opacity-90 shadow-2xl shadow-black/60 pointer-events-none">
                      <TaskCardUI task={activeTask} isOwner={false} onEdit={() => {}} onDelete={() => {}} />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </main>
      </div>

      {/* CREATE TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/6 bg-[#111118] p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            <h2 className="text-base font-bold text-white tracking-tight mb-4">Create New Sprint Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Task Title</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Integrate Multer Storage" className="w-full rounded-xl bg-white/3 borderborder-white/8 px-4 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500 transition-colors" required autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Add scope details..." rows="3" className="w-full rounded-xl bg-white/3 borderborder-white/8 px-4 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full rounded-xl bg-[#111118] borderborder-white/8 px-3 py-2.5 text-[13px] text-white outline-none focus:border-violet-500 transition-colors">
                  <option value="low">Low (Green Track)</option>
                  <option value="medium">Medium (Amber Track)</option>
                  <option value="high">High (Red Track)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Due Date <span className="normal-case text-white/20 tracking-normal font-normal">(optional)</span>
                </label>
                <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl bg-white/3 borderborder-white/8 px-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-500 transition-colors scheme-dark"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-[13px] font-medium text-white/60 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer shadow-lg">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/6 bg-[#111118] p-6 shadow-2xl relative">
            <button onClick={() => { setIsInviteModalOpen(false); setInviteMessage({ text: "", type: "" }); }} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            <h2 className="text-base font-bold text-white tracking-tight mb-1">Invite Team Member</h2>
            <p className="text-[12px] text-white/40 mb-5">Add developers to this sprint workspace.</p>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">User Email</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="dev@team.com" className="w-full rounded-xl bg-white/3 borderborder-white/8 px-4 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500 transition-colors" required />
              </div>
              {inviteMessage.text && (
                <div className={`text-[12px] px-3 py-2 rounded-lg border ${inviteMessage.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-400" : inviteMessage.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}>
                  {inviteMessage.text}
                </div>
              )}
              <button type="submit" className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer">Send Invite</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/6 bg-[#111118] p-6 shadow-2xl relative">
            <button onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            <h2 className="text-base font-bold text-white tracking-tight mb-4">Edit Task</h2>
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Task Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-xl bg-white/3 borderborder-white/8 px-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-500 transition-colors" required autoFocus />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows="3" className="w-full rounded-xl bg-white/3 borderborder-white/8 px-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-500 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Priority</label>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="w-full rounded-xl bg-[#111118] borderborder-white/8 px-3 py-2.5 text-[13px] text-white outline-none focus:border-violet-500 transition-colors">
                  <option value="low">Low (Green Track)</option>
                  <option value="medium">Medium (Amber Track)</option>
                  <option value="high">High (Red Track)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Due Date <span className="normal-case text-white/20 tracking-normal font-normal">(optional)</span>
                </label>
                <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl bg-white/3 borderborder-white/8 px-4 py-2.5 text-[13px] text-white outline-none focus:border-violet-500 transition-colors scheme-dark"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }} className="px-4 py-2 rounded-xl text-[13px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer shadow-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default KanbanBoard;
