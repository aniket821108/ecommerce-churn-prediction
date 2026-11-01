import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import useAuthStore from '../store/authStore';
import Loader from '../components/common/Loader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  UserIcon,
  KeyIcon,
  MapPinIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Chandigarh', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry'
];

const TABS = [
  { id: 'profile',   label: 'Personal Info',  icon: UserIcon },
  { id: 'password',  label: 'Security & Auth', icon: KeyIcon },
  { id: 'address',   label: 'Saved Address',  icon: MapPinIcon },
  { id: 'orders',    label: 'Order History',  icon: ShoppingBagIcon },
  { id: 'danger',    label: 'Danger Zone',    icon: ExclamationTriangleIcon },
];

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'delivered': return 'success';
    case 'processing': return 'info';
    case 'shipped': return 'primary';
    case 'pending': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'default';
  }
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updatePassword, logout, loadUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);

  // ── 1. Fetch fresh user data on mount with query cache-busting
  const { data: profileQueryData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await userService.getUserProfile();
      if (res?.data?.user) {
        useAuthStore.getState().setAuth(res.data.user);
      }
      return res;
    },
    staleTime: 30000,
  });

  const activeUser = profileQueryData?.data?.user || user;

  // ── 2. Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  // ── 3. Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // ── 4. Address form state
  const [addressData, setAddressData] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'India',
  });

  // ── 5. Danger zone state
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Synchronize state when activeUser changes
  useEffect(() => {
    if (activeUser) {
      setProfileData({
        name: activeUser.name || '',
        email: activeUser.email || '',
        phone: activeUser.phone || '',
      });
      if (activeUser.address) {
        setAddressData({
          street: activeUser.address.street || '',
          city: activeUser.address.city || '',
          state: activeUser.address.state || '',
          zipCode: activeUser.address.zipCode || '',
          country: activeUser.address.country || 'India',
        });
      }
    }
  }, [activeUser]);

  // ── 6. Query recent orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['userOrders'],
    queryFn: () => userService.getUserOrders({ limit: 5 }),
    enabled: activeTab === 'orders',
  });
  const orders = ordersData?.data?.orders || [];

  // ── 7. Profile mutations
  const profileMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('name', profileData.name);
      fd.append('email', profileData.email);
      fd.append('phone', profileData.phone);
      return userService.updateUserProfile(fd);
    },
    onSuccess: async (res) => {
      if (res?.data?.user) {
        useAuthStore.getState().setAuth(res.data.user);
      }
      await loadUser();
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Personal profile details saved!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const addressMutation = useMutation({
    mutationFn: () => userService.updateUserProfile({ address: addressData }),
    onSuccess: async (res) => {
      if (res?.data?.user) {
        useAuthStore.getState().setAuth(res.data.user);
      }
      await loadUser();
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Default delivery address saved!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save address'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => updatePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    }),
    onSuccess: () => {
      toast.success('Password updated successfully! 🔒');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Password update failed'),
  });

  // ── 8. Avatar Upload Handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarImgError(false);
    setUploadingAvatar(true);

    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await userService.updateUserProfile(fd);

      if (res?.data?.user) {
        useAuthStore.getState().setAuth(res.data.user);
        queryClient.setQueryData(['userProfile'], res);
      }
      await loadUser();
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setAvatarPreview(null);
      try { URL.revokeObjectURL(previewUrl); } catch (_) {}
      toast.success('Profile avatar updated successfully!');
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setAvatarPreview(null);
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Password criteria checklist computation
  const newPassword = passwordData.newPassword;
  const passwordChecks = useMemo(() => [
    { label: 'At least 8 characters long', met: newPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(newPassword) },
    { label: 'One number (0-9)', met: /[0-9]/.test(newPassword) },
    { label: 'One special symbol (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);

  const isPasswordValid = passwordChecks.every((c) => c.met);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!isPasswordValid) {
      toast.error('New password does not meet the security criteria');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    passwordMutation.mutate();
  };

  const rawAvatar = activeUser?.avatar;
  const avatarUrlFromUser = typeof rawAvatar === 'string' ? rawAvatar : rawAvatar?.url;
  const avatarSrc = avatarPreview || (!avatarImgError && avatarUrlFromUser ? avatarUrlFromUser : null);
  const initials = activeUser?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 font-sans space-y-8">
      {/* ── Page Header ── */}
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
          Account Management
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Customer Profile & Settings
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
        {/* ── Left Sidebar (Desktop) / Top Carousel (Mobile) ── */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          {/* User Profile Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center">
            {/* Avatar with Camera Trigger */}
            <div className="relative mb-3.5">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden text-white text-xl font-black relative bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={activeUser?.name || 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarImgError(true)}
                  />
                ) : (
                  <span>{initials}</span>
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                title="Change Avatar"
              >
                <CameraIcon className="w-4 h-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <h3 className="font-black text-slate-900 text-sm tracking-tight">
              {activeUser?.name || 'Customer'}
            </h3>
            <p className="text-xs text-slate-400 font-medium truncate max-w-full">
              {activeUser?.email}
            </p>

            <div className="mt-2.5">
              <Badge
                variant={activeUser?.role === 'admin' ? 'primary' : 'success'}
                size="sm"
                className="capitalize font-bold"
              >
                {activeUser?.role || 'Customer'}
              </Badge>
            </div>

            {/* Account Metadata */}
            <div className="w-full mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <CalendarDaysIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  Member since{' '}
                  <strong className="text-slate-700">
                    {activeUser?.createdAt
                      ? new Date(activeUser.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </strong>
                </span>
              </div>

              {activeUser?.lastLogin && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <ClockIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    Last active{' '}
                    <strong className="text-slate-700">
                      {new Date(activeUser.lastLogin).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <nav className="p-2 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-row lg:flex-col overflow-x-auto gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              const isDanger = tab.id === 'danger';

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 text-left ${
                    isSelected
                      ? isDanger
                        ? 'bg-rose-50 text-rose-700 shadow-2xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                      : isDanger
                      ? 'text-rose-500 hover:bg-rose-50/60'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected && !isDanger ? 'text-white' : ''}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main Tab Panel Content ── */}
        <main className="flex-1 w-full min-w-0">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
            {/* ══ TAB 1: PERSONAL INFORMATION ══ */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Personal Information
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Update your primary account contact details.
                  </p>
                </div>

                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => profileMutation.mutate()}
                      disabled={profileMutation.isPending}
                      variant="primary"
                      size="md"
                      className="px-6 shadow-xs"
                    >
                      {profileMutation.isPending ? 'Saving Details…' : 'Save Personal Details'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB 2: SECURITY & PASSWORD ══ */}
            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Security & Password
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Ensure your account is protected with a cryptographically strong password.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        className="w-full pl-4 pr-11 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.current ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      New Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new strong password"
                        className="w-full pl-4 pr-11 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.new ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Criteria Checklist */}
                    {newPassword.length > 0 && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Password Security Checklist:
                        </p>
                        {passwordChecks.map((check, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs font-medium">
                            {check.met ? (
                              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <span className={check.met ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
                              {check.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Re-enter new password"
                        className="w-full pl-4 pr-11 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.confirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={passwordMutation.isPending}
                      variant="primary"
                      size="md"
                      className="px-6 shadow-xs"
                    >
                      {passwordMutation.isPending ? 'Updating Password…' : 'Update Password'}
                    </Button>
                  </div>
                </form>

                {/* Session Invalidation Card */}
                <div className="pt-4 border-t border-slate-100 max-w-xl">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
                        <span>Active Session Telemetry</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Changing your password automatically revokes all other active sessions via token rotation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB 3: SAVED ADDRESS ══ */}
            {activeTab === 'address' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Saved Delivery Address
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    This default address is automatically loaded at checkout.
                  </p>
                </div>

                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={addressData.street}
                      onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                      placeholder="House / Flat no., Building, Area"
                      className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        State
                      </label>
                      <select
                        value={addressData.state}
                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                        className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 font-medium cursor-pointer"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={addressData.zipCode}
                        onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                        placeholder="6-digit PIN"
                        className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Country
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={addressData.country}
                        className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Formatted Preview Card */}
                  {(addressData.street || addressData.city) && (
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                      <MapPinIcon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-950">
                          Formatted Delivery Destination:
                        </p>
                        <p className="text-xs text-indigo-800 font-medium mt-0.5">
                          {[addressData.street, addressData.city, addressData.state, addressData.zipCode, addressData.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => addressMutation.mutate()}
                      disabled={addressMutation.isPending}
                      variant="primary"
                      size="md"
                      className="px-6 shadow-xs"
                    >
                      {addressMutation.isPending ? 'Saving Address…' : 'Save Default Address'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB 4: ORDERS HISTORY ══ */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      Recent Orders
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Review order tracking, live delivery maps, and tax invoices.
                    </p>
                  </div>
                  <Link
                    to="/orders"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View All Orders →
                  </Link>
                </div>

                {ordersLoading ? (
                  <Loader />
                ) : orders.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingBagIcon className="w-8 h-8 text-indigo-600" />}
                    title="No orders placed yet"
                    description="You haven't placed any orders yet. Discover trending products and fast delivery!"
                    actionLabel="Explore Catalog"
                    actionTo="/shop"
                  />
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <Link
                        key={order._id}
                        to={`/orders/${order._id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all shadow-2xs gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <ShoppingBagIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">
                              Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3.5">
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900">
                              ₹{(order.total || order.totalPrice || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {order.items?.length || 1} item(s)
                            </p>
                          </div>

                          <Badge
                            variant={getStatusBadgeVariant(order.status)}
                            size="sm"
                            className="capitalize font-bold"
                          >
                            {order.status}
                          </Badge>

                          <ChevronRightIcon className="w-4 h-4 text-slate-300 hidden sm:block" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB 5: DANGER ZONE ══ */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-black text-rose-600 tracking-tight">
                    Danger Zone
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Permanent and sensitive account operations.
                  </p>
                </div>

                <div className="space-y-4 max-w-xl">
                  {/* Sign out all devices */}
                  <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-slate-900">
                        Sign Out of All Devices
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Immediately invalidate all active browser sessions and refresh tokens.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Sign out of all devices immediately?')) {
                          logout();
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 shrink-0 font-bold"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1.5" />
                      <span>Sign Out Everywhere</span>
                    </Button>
                  </div>

                  {/* Delete Account */}
                  <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-3">
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        Delete Customer Account
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Permanently purge your account, order archives, and personal data.
                      </p>
                    </div>

                    <p className="text-xs font-semibold text-slate-600">
                      Type <code className="font-mono font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">DELETE</code> to proceed:
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="Type DELETE"
                        className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-rose-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                      />
                      <Button
                        type="button"
                        disabled={deleteConfirm !== 'DELETE'}
                        onClick={() => toast.error('Account deletion is disabled in development mode.')}
                        variant="primary"
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-700 shadow-xs disabled:opacity-30"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        <span>Delete</span>
                      </Button>
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