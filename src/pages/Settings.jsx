import React, { useEffect, useState } from "react";
import { getAuth, updateProfile, sendPasswordResetEmail, signOut } from "firebase/auth";
import { app } from "../firebase";

const Settings = () => {
  const auth = getAuth(app);
  const [user, setUser] = useState(null);
  const [newName, setNewName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setNewName(firebaseUser?.displayName || "");
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;

    try {
      await updateProfile(auth.currentUser, {
        displayName: newName,
      });
      setFeedback("Name updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setFeedback("Failed to update name.");
    }
  };

  const handleChangePassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      setFeedback("Password reset email sent!");
    } catch (err) {
      console.error(err);
      setFeedback("Failed to send reset email.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setFeedback("Failed to log out.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: "#e82c2a" }}>
          User Settings
        </h1>

        {user ? (
          <div className="space-y-5">
            {/* Name Section */}
            <div className="bg-gray-50 rounded-md p-4 shadow-sm border">
              <h2 className="text-gray-600 text-sm">Name</h2>
              {isEditing ? (
                <div className="flex gap-2 mt-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                    placeholder="Enter name"
                  />
                  <button
                    onClick={handleUpdateName}
                    className="px-4 py-2 bg-[#e82c2a] text-white rounded-md hover:bg-red-600"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center mt-2">
                  <p className="text-lg font-medium text-gray-800">{user.displayName || "N/A"}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-[#e82c2a] underline hover:text-red-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Email Section */}
            <div className="bg-gray-50 rounded-md p-4 shadow-sm border">
              <h2 className="text-gray-600 text-sm">Email</h2>
              <p className="text-lg font-medium text-gray-800 mt-2">{user.email}</p>
            </div>

            {/* Change Password */}
            <button
              onClick={handleChangePassword}
              className="w-full text-[#e82c2a] border border-[#e82c2a] hover:bg-[#e82c2a] hover:text-white py-2 rounded-md transition"
            >
              Change Password
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-[#e82c2a] text-white py-2 rounded-md hover:bg-red-700 transition"
            >
              Logout
            </button>

            {feedback && <p className="text-center text-sm text-green-600">{feedback}</p>}
          </div>
        ) : (
          <p className="text-center text-gray-600">Loading user info...</p>
        )}
      </div>
    </div>
  );
};

export default Settings;
