import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { 
  UserCircleIcon, 
  CameraIcon, 
  ShieldCheckIcon, 
  MapPinIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';

// Validation Schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().length(10, 'Phone number must be 10 digits').optional().or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase and number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Profile = () => {
  const { user, updateProfile, updatePassword } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar?.url || null);

  const isAdmin = user?.role === 'admin';

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || { street: '', city: '', state: '', zipCode: '' },
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
  });

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); // Show preview immediately
    }
  };

  const onProfileSubmit = async (data) => {
    setLoading(true);
    try {
      // ⚠️ IMPORTANT: Use FormData to send Image + Text
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('phone', data.phone);
      
      // Append Address fields individually
      if (data.address) {
        formData.append('address[street]', data.address.street || '');
        formData.append('address[city]', data.address.city || '');
        formData.append('address[state]', data.address.state || '');
        formData.append('address[zipCode]', data.address.zipCode || '');
      }

      // Append Image if selected
      if (selectedImage) {
        formData.append('avatar', selectedImage);
      }

      await updateProfile(formData); // Your store needs to handle FormData
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setLoading(true);
    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      
      {/* 1. Header Banner */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-b-3xl shadow-lg mb-16">
        <div className="absolute -bottom-12 left-8 md:left-12 flex items-end">
          
          {/* Profile Image Circle */}
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserCircleIcon className="h-full w-full text-gray-300" />
              )}
            </div>
            
            {/* Camera Icon Button */}
            <label htmlFor="profile-upload" className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm transition">
              <CameraIcon className="h-5 w-5" />
            </label>
            <input 
              type="file" 
              id="profile-upload" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="mb-2 ml-4">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">{user?.name}</h1>
            <div className="flex items-center text-blue-100 text-sm font-medium">
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
              <span className="uppercase tracking-wider">{user?.role} Account</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Left Sidebar (Navigation & Info) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <nav className="flex flex-col">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'profile' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserCircleIcon className="h-5 w-5 mr-3" />
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'security' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FingerPrintIcon className="h-5 w-5 mr-3" />
                Security & Password
              </button>
            </nav>
          </div>

          {/* ✅ ROLE BASED SECTION: Only Visible to Admins */}
          {isAdmin && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold flex items-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 mr-2 text-yellow-400" />
                Admin Controls
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                You have elevated privileges. Ensure 2FA is enabled for security.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Admin ID</span>
                  <span className="font-mono">{user?._id?.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Permissions</span>
                  <span className="text-green-400">Full Access</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">Active</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 3. Right Content (Forms) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h2>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        {...profileForm.register('name')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="John Doe"
                      />
                      {profileForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                        <input
                          {...profileForm.register('email')}
                          disabled
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                        <input
                          {...profileForm.register('phone')}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      {profileForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.phone.message}</p>}
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Shipping Address
                      </h3>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        {...profileForm.register('address.street')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="123 Main St, Apt 4B"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        {...profileForm.register('address.city')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        {...profileForm.register('address.state')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="NY"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        {...profileForm.register('address.zipCode')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-70 flex items-center"
                    >
                      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Change Password</h2>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="max-w-lg">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        {...passwordForm.register('currentPassword')}
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                      {passwordForm.formState.errors.currentPassword && <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        {...passwordForm.register('newPassword')}
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                      {passwordForm.formState.errors.newPassword && <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        {...passwordForm.register('confirmPassword')}
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                      {passwordForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-black transition shadow-md disabled:opacity-70 flex items-center"
                    >
                      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;