import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { Lock, Save, AlertTriangle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Settings() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Password Change Logic
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) return alert("Password must be at least 6 characters long");

    try {
      setIsSaving(true);
      await axios.put(`${API_BASE_URL}/api/auth/update-profile`, { password }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setPassword("");
      alert("Password successfully updated");
      navigate("/dashboard");
    } catch (error) {
      alert("Failed to update password.");
    } finally {
      setIsSaving(false);
    }
  };

  // Account Delete Logic
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Do you want to DELETE your Account Permanently??"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/auth/delete-account`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      alert("Account permanently deleted. Goodbye!");
      if (logout) logout();
      navigate("/login");
    } catch (error) {
      alert("Failed to delete account.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        
        {/* Update Password Section */}
        <div className="bg-[#111118] border border-white/6 rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold mb-6 tracking-wide flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-400" /> Security Settings
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="text-xs text-white/40 block mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-white/2 border border-white/8 focus:border-violet-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors" 
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <button type="submit" disabled={isSaving || !password} className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-sm font-medium rounded-xl transition-all disabled:opacity-50">
              <Save className="w-4 h-4" /> {isSaving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Danger Zone (Delete Account) */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
          <h2 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h2>
          <p className="text-xs text-red-400/70 mb-5 leading-relaxed">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>

      </div>
    </div>
  );
}

export default Settings;