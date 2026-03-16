import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import useAuthStore from '../store/authStore';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// ── Shared styles ─────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  fontSize: '14px', outline: 'none', transition: 'border-color 0.15s',
  background: '#fafafa', border: '1px solid #e5e7eb', color: '#111827',
};
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: '#9ca3af', marginBottom: '6px',
};

const Field = ({ label, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const FocusInput = ({ ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputStyle, borderColor: focused ? '#4f46e5' : '#e5e7eb', background: focused ? '#fff' : '#fafafa' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

// ── Tab definitions ───────────────────────────────────────
const TABS = [
  { id: 'profile',   label: 'Profile',        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'password',  label: 'Password',        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { id: 'address',   label: 'Address',         icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'orders',    label: 'Orders',          icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'danger',    label: 'Danger Zone',     icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
];

// ── Status badge ──────────────────────────────────────────
const statusColor = (status) => {
  const m = { delivered: ['#0d2015','#4ade80'], processing: ['#0d1529','#60a5fa'], shipped: ['#0f1529','#818cf8'], pending: ['#1f1608','#fbbf24'], cancelled: ['#200d0d','#f87171'] };
  return m[status] || ['#f3f4f6','#6b7280'];
};

// ── Main Component ─────────────────────────────────────────
const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updateProfile, updatePassword, logout, loadUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileRef = useRef();

  // ── Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // ── Password form state
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // ── Address form state
  const [addressData, setAddressData] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'India',
  });

  // ── Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // ── Queries
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['userOrders'],
    queryFn: () => userService.getUserOrders({ limit: 5 }),
    enabled: activeTab === 'orders',
  });
  const orders = ordersData?.data?.orders || [];

  // ── Mutations
  const profileMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('name', profileData.name);
      fd.append('email', profileData.email);
      fd.append('phone', profileData.phone);
      if (avatarFile) fd.append('avatar', avatarFile);
      return userService.updateUserProfile(fd);
    },
    onSuccess: async () => {
      await loadUser();           // ✅ re-fetches user from backend → updates Zustand store → avatar persists
      queryClient.invalidateQueries(['userProfile']);
      setAvatarFile(null);        // clear the pending file after save
      toast.success('Profile updated!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => updatePassword(passwordData),
    onSuccess: () => {
      toast.success('Password changed!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Password change failed'),
  });

  const addressMutation = useMutation({
    mutationFn: () => userService.updateUserProfile({ address: addressData }),
    onSuccess: () => toast.success('Address saved!'),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save address'),
  });

  // ── Handlers
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    passwordMutation.mutate();
  };

  const avatarSrc = avatarPreview || (typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url) || null;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Account</p>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
          My Profile
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Sidebar ── */}
        <aside className="lg:w-64 flex-shrink-0">
          {/* Avatar card */}
          <div
            className="rounded-2xl p-6 flex flex-col items-center text-center mb-4"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            {/* Avatar */}
            <div className="relative mb-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden text-white text-xl font-black"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                {avatarSrc
                  ? <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                  : initials
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg flex items-center justify-center text-white transition-transform hover:scale-110"
                style={{ background: '#4f46e5', boxShadow: '0 2px 8px rgba(79,70,229,0.4)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <p className="font-black text-gray-900 text-sm">{user?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate w-full">{user?.email}</p>
            <span
              className="mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize"
              style={{ background: user?.role === 'admin' ? '#f5f3ff' : '#f0fdf4', color: user?.role === 'admin' ? '#7c3aed' : '#16a34a' }}
            >
              {user?.role}
            </span>

            {user?.lastLogin && (
              <p className="text-xs text-gray-400 mt-3">
                Last login: {new Date(user.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>

          {/* Nav tabs */}
          <nav
            className="rounded-2xl overflow-hidden p-1.5"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150 mb-0.5 last:mb-0"
                style={{
                  background: activeTab === tab.id ? (tab.id === 'danger' ? '#fff1f2' : '#eef2ff') : 'transparent',
                  color: activeTab === tab.id ? (tab.id === 'danger' ? '#ef4444' : '#4f46e5') : (tab.id === 'danger' ? '#ef4444' : '#6b7280'),
                  fontWeight: activeTab === tab.id ? 600 : 400,
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1">
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >

            {/* ══ PROFILE TAB ══ */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-base font-black text-gray-900 mb-1">Personal Information</h2>
                <p className="text-sm text-gray-400 mb-6">Update your name, email and phone number.</p>

                <div className="space-y-4">
                  <Field label="Full Name">
                    <FocusInput type="text" value={profileData.name}
                      onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Your full name" />
                  </Field>
                  <Field label="Email Address">
                    <FocusInput type="email" value={profileData.email}
                      onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="you@example.com" />
                  </Field>
                  <Field label="Phone Number">
                    <FocusInput type="tel" value={profileData.phone}
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="10-digit mobile number" />
                  </Field>

                  {/* Member since */}
                  <div className="pt-2 pb-1">
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Member since</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => profileMutation.mutate()}
                    disabled={profileMutation.isPending}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}
                  >
                    {profileMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* ══ PASSWORD TAB ══ */}
            {activeTab === 'password' && (
              <div>
                <h2 className="text-base font-black text-gray-900 mb-1">Change Password</h2>
                <p className="text-sm text-gray-400 mb-6">Choose a strong password with at least 6 characters.</p>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {[
                    { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                    { key: 'newPassword',      label: 'New Password',     placeholder: 'Enter new password' },
                    { key: 'confirmPassword',  label: 'Confirm Password', placeholder: 'Re-enter new password' },
                  ].map(({ key, label, placeholder }) => {
                    const show = showPasswords[key.replace('Password','').replace('confirm','confirm').replace('current','current').replace('new','new')];
                    const showKey = key === 'currentPassword' ? 'current' : key === 'newPassword' ? 'new' : 'confirm';
                    return (
                      <Field key={key} label={label}>
                        <div className="relative">
                          <input
                            type={showPasswords[showKey] ? 'text' : 'password'}
                            value={passwordData[key]}
                            onChange={e => setPasswordData({ ...passwordData, [key]: e.target.value })}
                            placeholder={placeholder}
                            style={{ ...inputStyle, paddingRight: '44px' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(p => ({ ...p, [showKey]: !p[showKey] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d={showPasswords[showKey]
                                  ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                                  : 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                }
                              />
                            </svg>
                          </button>
                        </div>
                      </Field>
                    );
                  })}

                  {/* Password strength hint */}
                  {passwordData.newPassword && (
                    <div className="flex gap-1.5 pt-1">
                      {[1,2,3,4].map(i => {
                        const len = passwordData.newPassword.length;
                        const strength = len < 6 ? 1 : len < 8 ? 2 : len < 12 ? 3 : 4;
                        const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
                        return (
                          <div key={i} className="flex-1 h-1 rounded-full transition-colors duration-300"
                            style={{ background: i <= strength ? colors[strength-1] : '#e5e7eb' }} />
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}
                  >
                    {passwordMutation.isPending ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* ══ ADDRESS TAB ══ */}
            {activeTab === 'address' && (
              <div>
                <h2 className="text-base font-black text-gray-900 mb-1">Saved Address</h2>
                <p className="text-sm text-gray-400 mb-6">This address will be pre-filled at checkout.</p>

                <div className="space-y-4">
                  <Field label="Street Address">
                    <FocusInput type="text" value={addressData.street}
                      onChange={e => setAddressData({ ...addressData, street: e.target.value })}
                      placeholder="House no., street, area" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City">
                      <FocusInput type="text" value={addressData.city}
                        onChange={e => setAddressData({ ...addressData, city: e.target.value })}
                        placeholder="City" />
                    </Field>
                    <Field label="State">
                      <FocusInput type="text" value={addressData.state}
                        onChange={e => setAddressData({ ...addressData, state: e.target.value })}
                        placeholder="State" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="PIN Code">
                      <FocusInput type="text" value={addressData.zipCode}
                        onChange={e => setAddressData({ ...addressData, zipCode: e.target.value })}
                        placeholder="6-digit PIN" />
                    </Field>
                    <Field label="Country">
                      <FocusInput type="text" value={addressData.country}
                        onChange={e => setAddressData({ ...addressData, country: e.target.value })}
                        placeholder="Country" />
                    </Field>
                  </div>

                  {/* Address preview */}
                  {(addressData.street || addressData.city) && (
                    <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                      <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#7c3aed' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm leading-relaxed" style={{ color: '#6d28d9' }}>
                        {[addressData.street, addressData.city, addressData.state, addressData.zipCode, addressData.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => addressMutation.mutate()}
                    disabled={addressMutation.isPending}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}
                  >
                    {addressMutation.isPending ? 'Saving…' : 'Save Address'}
                  </button>
                </div>
              </div>
            )}

            {/* ══ ORDERS TAB ══ */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-black text-gray-900 mb-0.5">Order History</h2>
                    <p className="text-sm text-gray-400">Your 5 most recent orders.</p>
                  </div>
                  <Link to="/orders"
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                    View all →
                  </Link>
                </div>

                {ordersLoading ? <Loader /> : orders.length === 0 ? (
                  <div className="py-16 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f5f3ff' }}>
                      <svg className="w-7 h-7" style={{ color: '#7c3aed' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-700 text-sm">No orders yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start shopping to see your orders here.</p>
                    <Link to="/shop"
                      className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                      Browse Shop
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const [bg, color] = statusColor(order.status);
                      return (
                        <Link
                          key={order._id}
                          to={`/orders/${order._id}`}
                          className="flex items-center justify-between p-4 rounded-xl transition-all duration-150 hover:-translate-y-0.5"
                          style={{ background: '#fafafa', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: '#eef2ff' }}>
                              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</p>
                              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-800">
                              ₹{(order.total || order.totalPrice || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                              style={{ background: bg, color }}>
                              {order.status}
                            </span>
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ DANGER ZONE TAB ══ */}
            {activeTab === 'danger' && (
              <div>
                <h2 className="text-base font-black text-gray-900 mb-1">Danger Zone</h2>
                <p className="text-sm text-gray-400 mb-6">These actions are permanent and cannot be undone.</p>

                <div className="space-y-4">
                  {/* Logout all devices */}
                  <div className="p-5 rounded-xl" style={{ border: '1px solid #fee2e2', background: '#fff5f5' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-0.5">Sign out everywhere</p>
                        <p className="text-xs text-gray-500">Log out of all devices and sessions immediately.</p>
                      </div>
                      <button
                        onClick={() => { if (window.confirm('Sign out of all devices?')) logout(); }}
                        className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                      >
                        Sign Out All
                      </button>
                    </div>
                  </div>

                  {/* Delete account */}
                  <div className="p-5 rounded-xl" style={{ border: '1px solid #fee2e2', background: '#fff5f5' }}>
                    <p className="text-sm font-bold text-gray-900 mb-0.5">Delete Account</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Permanently delete your account and all associated data. This cannot be undone.
                    </p>
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Type <span className="font-mono font-black text-red-500">DELETE</span> to confirm:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="Type DELETE"
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-mono"
                        style={{ border: '1px solid #fca5a5', background: '#fff' }}
                      />
                      <button
                        disabled={deleteConfirm !== 'DELETE'}
                        onClick={() => toast.error('Account deletion is disabled in demo mode.')}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                        style={{ background: '#dc2626' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;