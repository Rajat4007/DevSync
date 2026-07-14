import React, { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { User, Mail, Upload, Trash2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";

function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const fileInputRef = useRef(null);
  const [name, setName] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

 
  // Photo Upload Logic (with Compression)
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Only Image can be uploaded");
      return;
    }

    try {
      setIsUploading(true); // Compression shuru hote hi loader ghuma do

      //  Image ko chota karna
      const options = {
        maxSizeMB: 0.5, // 500KB se badi file nahi jayegi
        maxWidthOrHeight: 800, // Resolution max 800px (Profile pic ke liye bohot hai)
        useWebWorker: true, // Browser hang na ho isliye background me compress karega
      };

      // File Compress ho rahi hai...
      const compressedFile = await imageCompression(file, options);
      
      console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      // Ab compressed file ko backend bhejenge
      const formData = new FormData();
      formData.append("profilePic", compressedFile);

      const res = await axios.put(`${API_BASE_URL}/api/auth/update-profile-pic`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data", 
          Authorization: `Bearer ${user.token}` 
        },
      });

      const newUserInfo = { ...res.data, token: user.token };
      localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
      if (setUser) setUser(newUserInfo);
      
      alert("Profile picture updated");
    } catch (error) {
      console.error(error);
      alert("Upload failed!");
    } finally {
      setIsUploading(false);
    }
  };

  // Photo Delete
  const handleImageDelete = async () => {
    if (!window.confirm("Do you want to remove Profile Photo")) return;
    try {
      setIsUploading(true);
      const res = await axios.delete(`${API_BASE_URL}/api/auth/delete-profile-pic`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const newUserInfo = { ...res.data, token: user.token };
      localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
      if (setUser) setUser(newUserInfo);
    } catch (error) {
      alert("Delete failed!");
    } finally {
      setIsUploading(false);
    }
  };

  // Update Name Only
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name cannot be empty");

    try {
      setIsSavingDetails(true);
      const res = await axios.put(`${API_BASE_URL}/api/auth/update-profile`, { name }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const newUserInfo = { ...user, name: res.data.name };
      localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
      if (setUser) setUser(newUserInfo);
      alert("Profile updated successfully");
      navigate("/dashboard");
    } catch (error) {
      alert("Profile update failed");
    } finally {
      setIsSavingDetails(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#111118] border border-white/6 rounded-2xl p-8 shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-center tracking-wide">My Profile</h2>

        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-2 border-white/10">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex gap-3">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-xs rounded-lg flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> {isUploading ? "Uploading..." : "Change"}
            </button>
            {user?.profilePic && (
              <button onClick={handleImageDelete} disabled={isUploading} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/2 border border-white/8 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" value={user?.email || ""} disabled className="w-full bg-white/1 border border-white/4 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white/40 outline-none cursor-not-allowed" />
            </div>
          </div>
          <button type="submit" disabled={isSavingDetails} className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-sm font-medium rounded-xl transition-all shadow-lg">
            <Save className="w-4 h-4" /> {isSavingDetails ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;