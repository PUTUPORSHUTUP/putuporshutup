import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import { AdminSimPanel } from "@/components/AdminSimPanel";
import ProtectedRoute from "@/components/ProtectedRoute";

// --- ADMIN MENU ITEMS ---
export const adminMenuItems = [
  { name: "Overview", icon: "📊", href: "/admin", role: "admin" },
  { name: "Simulation", icon: "🧪", href: "/admin/simulation", role: "admin" },
  { name: "Users", icon: "👥", href: "/admin/users", role: "admin" },
  { name: "Analytics", icon: "📈", href: "/admin/analytics", role: "admin" },
  { name: "Automation", icon: "🤖", href: "/admin/automation", role: "admin" },
];

// --- ADMIN ROUTES COMPONENT ---
export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/simulation" element={
        <ProtectedRoute>
          <AdminSimPanel />
        </ProtectedRoute>
      } />
      {/* Additional admin routes can be added here */}
    </Routes>
  );
}