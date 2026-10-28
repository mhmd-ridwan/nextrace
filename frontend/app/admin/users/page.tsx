"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  User,
  Users,
  KeyRound,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  Edit2,
  ArrowLeft,
  Lock,
  Mail,
  UserCog,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth, getRoleBadge, AuthUser, UserRole } from "@/lib/auth";

export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Notifications
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  // Form states - Add User
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("analyst");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Form states - Edit User
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("analyst");
  const [editIsActive, setEditIsActive] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Form states - Reset Password
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [showResetPasswordVal, setShowResetPasswordVal] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);

  // Form states - Delete
  const [submittingDelete, setSubmittingDelete] = useState(false);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === "admin") {
      fetchUsers();
    }
  }, [isAuthenticated, currentUser]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  };

  // Generate secure random password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Open Edit Modal
  const handleOpenEdit = (target: AuthUser) => {
    setSelectedUser(target);
    setEditFullName(target.full_name || "");
    setEditEmail(target.email);
    setEditRole(target.role);
    setEditIsActive(target.is_active);
    setShowEditModal(true);
  };

  // Open Reset Password Modal
  const handleOpenReset = (target: AuthUser) => {
    setSelectedUser(target);
    setResetPasswordVal(generateRandomPassword());
    setShowResetModal(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (target: AuthUser) => {
    setSelectedUser(target);
    setShowDeleteModal(true);
  };

  // Submit Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPassword) return;

    setSubmittingAdd(true);
    try {
      await api.createUser({
        username: newUsername.trim().toLowerCase(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        full_name: newFullName.trim() || undefined,
        role: newRole,
      });

      showToast("success", `Pengguna baru '${newUsername}' berhasil didaftarkan.`);
      setShowAddModal(false);
      setNewUsername("");
      setNewEmail("");
      setNewFullName("");
      setNewPassword("");
      setNewRole("analyst");
      await fetchUsers();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Gagal mendaftarkan pengguna.");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Submit Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmittingEdit(true);
    try {
      await api.updateUser(selectedUser.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        is_active: editIsActive,
      });

      showToast("success", `Data pengguna '${selectedUser.username}' berhasil diperbarui.`);
      setShowEditModal(false);
      await fetchUsers();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Gagal memperbarui pengguna.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal) return;

    setSubmittingReset(true);
    try {
      await api.adminResetPassword(selectedUser.id, resetPasswordVal);
      showToast("success", `Kata sandi untuk '${selectedUser.username}' berhasil di-reset.`);
      setShowResetModal(false);
      setResetPasswordVal("");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Gagal me-reset kata sandi.");
    } finally {
      setSubmittingReset(false);
    }
  };

  // Submit Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSubmittingDelete(true);
    try {
      await api.deleteUser(selectedUser.id);
      showToast("success", `Pengguna '${selectedUser.username}' telah dihapus dari sistem.`);
      setShowDeleteModal(false);
      await fetchUsers();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Gagal menghapus pengguna.");
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q));

      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const analysts = users.filter((u) => u.role === "analyst").length;
    const viewers = users.filter((u) => u.role === "viewer").length;
    const active = users.filter((u) => u.is_active).length;
    return { total, admins, analysts, viewers, active };
  }, [users]);

  // Unauthorized view
  if (!authLoading && currentUser?.role !== "admin") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-[60vh] flex items-center justify-center">
        <div className="bg-[var(--s1)] border border-[var(--hi)]/30 rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-[var(--hi)]/15 border border-[var(--hi)]/30 flex items-center justify-center mx-auto text-[var(--hi)]">
            <Shield className="w-7 h-7 stroke-[1.8]" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[var(--ink)] tracking-tight">
              Akses Khusus Administrator
            </h2>
            <p className="text-[13px] text-[var(--mute)] mt-1.5 leading-relaxed">
              Halaman manajemen pengguna, kata sandi, dan peran hanya dapat diakses oleh akun dengan tingkat hak akses Administrator.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--s2)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--ink)] text-[13px] font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-6">

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 ${
            toast.type === "success"
              ? "bg-[#10b981]/15 border-[#10b981]/30 text-[#10b981]"
              : "bg-[var(--hi)]/15 border-[var(--hi)]/30 text-[var(--hi)]"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2]" />
          )}
          <span className="text-[13px] font-medium text-[var(--ink)]">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-[var(--mute)] hover:text-[var(--ink)] ml-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--hi)]" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT &bull; KONTROL AKSES PENGGUNA &bull; RBAC AUDIT
            </span>
          </div>
          <h1 className="text-[20px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[var(--acc)] stroke-[2]" />
            <span>Manajemen Pengguna &amp; Hak Akses</span>
            <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-[var(--hi)]/15 text-[var(--hi)] font-semibold border border-[var(--hi)]/30">
              ADMIN ONLY
            </span>
          </h1>
          <p className="text-[12.5px] text-[var(--mute)] mt-1">
            Pengelolaan identitas analis, pengaturan peran sistem (*Role-Based Access Control*), dan pemulihan kata sandi forensik.
          </p>
        </div>

        <button
          onClick={() => {
            setNewUsername("");
            setNewEmail("");
            setNewFullName("");
            setNewPassword(generateRandomPassword());
            setNewRole("analyst");
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 bg-[var(--acc)] hover:opacity-90 active:scale-[0.99] text-[#0e1012] font-bold text-[13px] rounded-lg px-4 py-2.5 transition-all duration-150 shrink-0 cursor-pointer shadow-sm select-none"
        >
          <UserPlus className="w-4 h-4 stroke-[2.2]" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* ── Metrics Overview Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl p-4">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-[12px] font-medium">Total Akun</span>
            <Users className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div className="text-[24px] font-bold font-mono tabular-nums text-[var(--ink)]">
            {stats.total}
          </div>
          <span className="text-[11px] text-[var(--lo)] font-medium">
            {stats.active} akun aktif
          </span>
        </div>

        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl p-4">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-[12px] font-medium">Administrator</span>
            <span className="w-2 h-2 rounded-full bg-[var(--hi)]" />
          </div>
          <div className="text-[24px] font-bold font-mono tabular-nums text-[var(--hi)]">
            {stats.admins}
          </div>
          <span className="text-[11px] text-[var(--mute)]">Akses penuh sistem</span>
        </div>

        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl p-4">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-[12px] font-medium">Analis Siber</span>
            <span className="w-2 h-2 rounded-full bg-[var(--acc)]" />
          </div>
          <div className="text-[24px] font-bold font-mono tabular-nums text-[var(--acc)]">
            {stats.analysts}
          </div>
          <span className="text-[11px] text-[var(--mute)]">Investigasi &amp; Kasus</span>
        </div>

        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl p-4">
          <div className="flex items-center justify-between text-[var(--mute)] mb-2">
            <span className="text-[12px] font-medium">Viewer / Auditor</span>
            <span className="w-2 h-2 rounded-full bg-[var(--lo)]" />
          </div>
          <div className="text-[24px] font-bold font-mono tabular-nums text-[var(--lo)]">
            {stats.viewers}
          </div>
          <span className="text-[11px] text-[var(--mute)]">Hak baca (read-only)</span>
        </div>
      </div>

      {/* ── Table & Search Controls ── */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-[var(--line)] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mute)] stroke-[1.8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan username, email, nama..."
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-lg pl-9 pr-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:border-[var(--acc)] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mute)] hover:text-[var(--ink)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--mute)]">
              <Filter className="w-3.5 h-3.5 stroke-[1.8]" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-[var(--ink)] focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[var(--s1)] text-[var(--ink)]">Semua Peran</option>
                <option value="admin" className="bg-[var(--s1)] text-[var(--ink)]">Admin</option>
                <option value="analyst" className="bg-[var(--s1)] text-[var(--ink)]">Analyst</option>
                <option value="viewer" className="bg-[var(--s1)] text-[var(--ink)]">Viewer</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--mute)]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[var(--ink)] focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[var(--s1)] text-[var(--ink)]">Semua Status</option>
                <option value="active" className="bg-[var(--s1)] text-[var(--ink)]">Hanya Aktif</option>
                <option value="inactive" className="bg-[var(--s1)] text-[var(--ink)]">Hanya Nonaktif</option>
              </select>
            </div>

            <button
              onClick={fetchUsers}
              title="Segarkan data pengguna"
              className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)] transition-colors"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--s2)] text-[var(--mute)] uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--mute)]">
                    <div className="w-5 h-5 border-2 border-[var(--line)] border-t-[var(--acc)] rounded-full animate-spin mx-auto mb-2" />
                    Memuat data akun pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--mute)]">
                    Tidak ditemukan pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadge = getRoleBadge(u.role);
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--s2)]/60 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-[var(--acc)]/15 border border-[var(--acc)]/30 grid place-items-center font-bold text-[11.5px] font-mono text-[var(--acc)] shrink-0 uppercase">
                            {u.username.slice(0, 2)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[var(--ink)] font-mono">
                                {u.username}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/30 font-medium">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11.5px] text-[var(--mute)] block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Full Name */}
                      <td className="py-3.5 px-4 text-[var(--ink)]">
                        {u.full_name || <span className="text-[var(--mute)] italic">—</span>}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border"
                          style={{
                            color: roleBadge.color,
                            borderColor: `${roleBadge.color}40`,
                            backgroundColor: `${roleBadge.color}15`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: roleBadge.color }}
                          />
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11.5px] text-[var(--lo)] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--lo)]" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11.5px] text-[var(--hi)] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--hi)]" /> Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {/* Edit User / Role */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Ubah peran & profil"
                            className="p-1.5 rounded-md hover:bg-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                          >
                            <Edit2 className="w-4 h-4 stroke-[1.8]" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenReset(u)}
                            title="Reset kata sandi"
                            className="p-1.5 rounded-md hover:bg-[var(--line)] text-[var(--mute)] hover:text-[var(--acc)] transition-colors"
                          >
                            <KeyRound className="w-4 h-4 stroke-[1.8]" />
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(u)}
                            disabled={isCurrent}
                            title={isCurrent ? "Tidak dapat menghapus akun sendiri" : "Hapus akun"}
                            className="p-1.5 rounded-md hover:bg-[var(--hi)]/15 text-[var(--mute)] hover:text-[var(--hi)] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4 stroke-[1.8]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TAMBAH PENGGUNA BARU
      ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--acc)]/15">
                  <UserPlus className="w-4 h-4 text-[var(--acc)] stroke-[2]" />
                </div>
                <h3 className="text-[15px] font-bold text-[var(--ink)]">
                  Tambah Pengguna Baru
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[var(--mute)] hover:text-[var(--ink)] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                  Username (Wajib)
                </label>
                <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 focus-within:border-[var(--acc)]">
                  <User className="w-4 h-4 text-[var(--mute)] shrink-0" />
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="misal: analis_andi"
                    required
                    pattern="^[a-zA-Z0-9_\-]+$"
                    className="w-full bg-transparent border-0 outline-none text-[var(--ink)] placeholder:text-[var(--mute)]"
                  />
                </div>
                <small className="text-[11px] text-[var(--mute)]">Hanya huruf, angka, garis bawah, atau strip.</small>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                  Email (Wajib)
                </label>
                <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 focus-within:border-[var(--acc)]">
                  <Mail className="w-4 h-4 text-[var(--mute)] shrink-0" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="andi@instansi.go.id"
                    required
                    className="w-full bg-transparent border-0 outline-none text-[var(--ink)] placeholder:text-[var(--mute)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                  Nama Lengkap (Opsional)
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Andi Pratama, S.Kom"
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 text-[var(--ink)] placeholder:text-[var(--mute)] focus:border-[var(--acc)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                  Peran &amp; Hak Akses (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "analyst", "viewer"] as UserRole[]).map((r) => {
                    const badge = getRoleBadge(r);
                    const isSelected = newRole === r;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setNewRole(r)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-[var(--acc)] bg-[var(--acc)]/10 text-[var(--ink)]"
                            : "border-[var(--line)] bg-[var(--bg)] text-[var(--mute)] hover:bg-[var(--s2)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[11px] font-bold uppercase font-mono"
                            style={{ color: badge.color }}
                          >
                            {badge.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--acc)]" />}
                        </div>
                        <span className="text-[10px] text-[var(--mute)] block leading-tight">
                          {r === "admin" ? "Kontrol Penuh" : r === "analyst" ? "Investigasi" : "Read-only"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                    Kata Sandi Awal (Wajib)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[11px] text-[var(--acc)] hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Acak Sandi Kuat
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 focus-within:border-[var(--acc)]">
                  <Lock className="w-4 h-4 text-[var(--mute)] shrink-0" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-transparent border-0 outline-none text-[var(--ink)] font-mono text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-[var(--mute)] hover:text-[var(--ink)]"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-[12.5px] rounded-lg border border-[var(--line)] text-[var(--mute)] hover:bg-[var(--s2)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--acc)] text-[#0e1012] font-bold text-[12.5px] rounded-lg hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {submittingAdd ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: UBAH DATA & PERAN PENGGUNA
      ───────────────────────────────────────────────────────────── */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--acc)]/15">
                  <UserCog className="w-4 h-4 text-[var(--acc)] stroke-[2]" />
                </div>
                <h3 className="text-[15px] font-bold text-[var(--ink)]">
                  Ubah Pengguna: {selectedUser.username}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[var(--mute)] hover:text-[var(--ink)] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 text-[var(--ink)] focus:border-[var(--acc)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 text-[var(--ink)] focus:border-[var(--acc)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider mb-1">
                  Peran Sistem (Role)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "analyst", "viewer"] as UserRole[]).map((r) => {
                    const badge = getRoleBadge(r);
                    const isSelected = editRole === r;
                    const isSelf = selectedUser.id === currentUser?.id;
                    return (
                      <button
                        type="button"
                        key={r}
                        disabled={isSelf && r !== "admin"}
                        onClick={() => setEditRole(r)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-[var(--acc)] bg-[var(--acc)]/10 text-[var(--ink)]"
                            : "border-[var(--line)] bg-[var(--bg)] text-[var(--mute)] hover:bg-[var(--s2)]"
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[11px] font-bold uppercase font-mono"
                            style={{ color: badge.color }}
                          >
                            {badge.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--acc)]" />}
                        </div>
                        <span className="text-[10px] text-[var(--mute)] block leading-tight">
                          {r === "admin" ? "Kontrol Penuh" : r === "analyst" ? "Investigasi" : "Read-only"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedUser.id === currentUser?.id && (
                  <small className="text-[11px] text-[var(--mute)] mt-1 block">
                    * Anda tidak dapat mengubah peran akun admin Anda sendiri.
                  </small>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg)] border border-[var(--line)]">
                <div>
                  <span className="font-semibold text-[var(--ink)] block text-[12.5px]">
                    Status Akun Aktif
                  </span>
                  <span className="text-[11px] text-[var(--mute)]">
                    Akun nonaktif tidak dapat melakukan login ke platform
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  disabled={selectedUser.id === currentUser?.id}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--acc)] focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 text-[12.5px] rounded-lg border border-[var(--line)] text-[var(--mute)] hover:bg-[var(--s2)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 bg-[var(--acc)] text-[#0e1012] font-bold text-[12.5px] rounded-lg hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {submittingEdit ? "Menyimpan..." : "Perbarui Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RESET KATA SANDI
      ───────────────────────────────────────────────────────────── */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--s1)] border border-[var(--line)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[var(--hi)]/15">
                  <KeyRound className="w-4 h-4 text-[var(--hi)] stroke-[2]" />
                </div>
                <h3 className="text-[15px] font-bold text-[var(--ink)]">
                  Reset Kata Sandi: {selectedUser.username}
                </h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-[var(--mute)] hover:text-[var(--ink)] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4 text-[13px]">
              <p className="text-[12.5px] text-[var(--mute)]">
                Sebagai Administrator, Anda dapat mengganti kata sandi pengguna tanpa memerlukan kata sandi lama mereka. Berikan kata sandi baru ini kepada pengguna bersangkutan.
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[var(--mute)] uppercase tracking-wider">
                    Kata Sandi Baru
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetPasswordVal(generateRandomPassword())}
                    className="text-[11px] text-[var(--acc)] hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Acak Sandi Baru
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-2 focus-within:border-[var(--acc)]">
                  <Lock className="w-4 h-4 text-[var(--mute)] shrink-0" />
                  <input
                    type={showResetPasswordVal ? "text" : "password"}
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-transparent border-0 outline-none text-[var(--ink)] font-mono text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordVal(!showResetPasswordVal)}
                    className="text-[var(--mute)] hover:text-[var(--ink)]"
                  >
                    {showResetPasswordVal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3.5 py-2 text-[12.5px] rounded-lg border border-[var(--line)] text-[var(--mute)] hover:bg-[var(--s2)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReset || !resetPasswordVal}
                  className="px-4 py-2 bg-[var(--hi)] text-white font-bold text-[12.5px] rounded-lg hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {submittingReset ? "Memproses..." : "Reset Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: KONFIRMASI HAPUS PENGGUNA
      ───────────────────────────────────────────────────────────── */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--s1)] border border-[var(--hi)]/40 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4 text-[13px]">
            <div className="w-12 h-12 rounded-full bg-[var(--hi)]/15 border border-[var(--hi)]/30 flex items-center justify-center mx-auto text-[var(--hi)]">
              <Trash2 className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-[16px] font-bold text-[var(--ink)]">
                Hapus Pengguna?
              </h3>
              <p className="text-[12.5px] text-[var(--mute)]">
                Apakah Anda yakin ingin menghapus akun <b className="text-[var(--ink)] font-mono">{selectedUser.username}</b>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 text-[12.5px] rounded-lg border border-[var(--line)] text-[var(--mute)] hover:bg-[var(--s2)] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submittingDelete}
                className="flex-1 py-2 bg-[var(--hi)] text-white font-bold text-[12.5px] rounded-lg hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
              >
                {submittingDelete ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
