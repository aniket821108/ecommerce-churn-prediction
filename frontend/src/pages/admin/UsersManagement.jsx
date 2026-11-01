import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import Loader from '../../components/common/Loader';
import {
  TrashIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const UsersManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [brokenAvatarIds, setBrokenAvatarIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, search, roleFilter],
    queryFn: () => userService.getAllUsers({ page, limit: 10, search, role: roleFilter }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('User updated successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update user'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('User deactivated successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete user'),
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || {};

  const handleRoleToggle = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Are you sure you want to change ${user.name}'s role to "${newRole.toUpperCase()}"?`)) {
      updateUserMutation.mutate({ id: user._id, data: { role: newRole } });
    }
  };

  const handleStatusToggle = (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) {
      updateUserMutation.mutate({ id: user._id, data: { isActive: !user.isActive } });
    }
  };

  const handleAvatarError = (userId) => {
    setBrokenAvatarIds((prev) => new Set(prev).add(userId));
  };

  if (isLoading && !data) return <Loader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Audit registered users, manage administrative privileges, and govern account standing.
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FunnelIcon className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-500 transition-all outline-none min-h-[40px]"
          >
            <option value="">All Roles</option>
            <option value="user">Customers Only</option>
            <option value="admin">Administrators Only</option>
          </select>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">User Identity</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Contact Details</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Member Since</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Assigned Role</th>
                <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Account Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((user) => {
                const isAdmin = user.role === 'admin';
                const avatarSrc = typeof user.avatar === 'string' ? user.avatar : user.avatar?.url;
                const hasAvatar = avatarSrc && !brokenAvatarIds.has(user._id);
                const initial = (user.name || 'U').charAt(0).toUpperCase();

                return (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    {/* User Identity */}
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0 overflow-hidden"
                          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                        >
                          {hasAvatar ? (
                            <img
                              src={avatarSrc}
                              alt={user.name}
                              onError={() => handleAvatarError(user._id)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initial
                          )}
                        </div>
                        <div className="min-w-0 max-w-[160px] sm:max-w-xs">
                          <p className="font-bold text-slate-900 truncate leading-tight">{user.name}</p>
                          <p className="text-xs text-slate-400 font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-slate-700">{user.phone || 'No phone'}</p>
                        <p className="text-xs text-slate-400">{user.address?.city || 'City unlisted'}</p>
                      </div>
                    </td>

                    {/* Member Since */}
                    <td className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Assigned Role */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-violet-50 text-violet-700 border border-violet-200">
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Customer</span>
                        </span>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Role Button */}
                        <button
                          onClick={() => handleRoleToggle(user)}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                          title={`Switch role to ${isAdmin ? 'Customer' : 'Admin'}`}
                          aria-label={`Toggle role for ${user.name}`}
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                        </button>

                        {/* Toggle Active / Deactivate */}
                        <button
                          onClick={() => handleStatusToggle(user)}
                          className={`p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                            user.isActive
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.isActive ? 'Suspend account' : 'Restore account'}
                          aria-label={`${user.isActive ? 'Suspend' : 'Restore'} ${user.name}`}
                        >
                          {user.isActive ? (
                            <NoSymbolIcon className="w-4 h-4" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently remove ${user.name}? This cannot be undone.`)) {
                              deleteUserMutation.mutate(user._id);
                            }
                          }}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                          title="Delete user"
                          aria-label={`Delete user ${user.name}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="py-16 text-center">
              <UserIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No users match your search query</p>
              <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Showing page <strong className="text-slate-800">{page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs min-h-[36px]"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-xs min-h-[36px]"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
