import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import Loader from '../../components/common/Loader';
import { PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const roleStyle = (role) =>
  role === 'admin'
    ? { bg: '#1e1333', color: '#a78bfa' }
    : { bg: '#1a1a1a', color: '#737373' };

const activeStyle = (isActive) =>
  isActive
    ? { bg: '#0d2015', color: '#4ade80', label: 'Active' }
    : { bg: '#200d0d', color: '#f87171', label: 'Inactive' };

const Chip = ({ bg, color, label }) => (
  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: bg, color }}>
    {label}
  </span>
);

const iconBtn = (hoverColor = '#a78bfa') => ({
  base: { background: 'transparent', color: '#525252', transition: 'all 0.15s' },
  hover: { background: '#1a1a1a', color: hoverColor },
});

const UsersManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, search, roleFilter],
    queryFn: () => userService.getAllUsers({ page, limit: 10, search, role: roleFilter }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['adminUsers']); toast.success('User updated'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => { queryClient.invalidateQueries(['adminUsers']); toast.success('User deactivated'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete'),
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || {};

  const handleRoleToggle = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Change ${user.name}'s role to ${newRole}?`))
      updateUserMutation.mutate({ id: user._id, data: { role: newRole } });
  };

  const handleStatusToggle = (user) =>
    updateUserMutation.mutate({ id: user._id, data: { isActive: !user.isActive } });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#f5f5f5' }}>Users</h2>
          <p className="text-sm mt-0.5" style={{ color: '#525252' }}>Manage accounts and permissions</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e5e5e5', width: '220px' }}
            onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
            onBlur={e => e.currentTarget.style.borderColor = '#2a2a2a'}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#a3a3a3' }}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#111111', border: '1px solid #1f1f1f' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['User', 'Contact', 'Joined', 'Role', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3 text-xs font-medium uppercase tracking-widest ${i === 5 ? 'text-right' : 'text-left'}`}
                    style={{ color: '#404040' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const r = roleStyle(user.role);
                const a = activeStyle(user.isActive);
                return (
                  <tr
                    key={user._id}
                    style={{ borderBottom: '1px solid #161616', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ background: '#1e1333', border: '1px solid #2a2a2a' }}
                        >
                          {user.avatar
                            ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            : <UserIcon className="h-4 w-4" style={{ color: '#7c3aed' }} />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#e5e5e5' }}>{user.name}</p>
                          <p className="text-xs" style={{ color: '#404040' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      <p className="text-sm" style={{ color: '#737373' }}>{user.phone || '—'}</p>
                      <p className="text-xs" style={{ color: '#404040' }}>{user.address?.city || '—'}</p>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm" style={{ color: '#525252' }}>{formatDate(user.createdAt)}</span>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <Chip bg={r.bg} color={r.color} label={user.role} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <Chip bg={a.bg} color={a.color} label={a.label} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRoleToggle(user)}
                          title="Toggle role"
                          className="p-1.5 rounded-lg"
                          style={{ color: '#525252' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#a78bfa'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg text-xs font-bold"
                          style={{ color: '#525252' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = user.isActive ? '#fbbf24' : '#4ade80'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}
                        >
                          {user.isActive ? '●' : '○'}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete ${user.name}?`)) deleteUserMutation.mutate(user._id); }}
                          title="Delete"
                          className="p-1.5 rounded-lg"
                          style={{ color: '#525252' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#f87171'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#525252'; }}
                        >
                          <TrashIcon className="h-4 w-4" />
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
              <p className="text-sm" style={{ color: '#404040' }}>No users found.</p>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid #1a1a1a' }}>
            <span className="text-xs" style={{ color: '#525252' }}>Page {page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30"
                style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}>
                Prev
              </button>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30"
                style={{ background: '#1a1a1a', color: '#a3a3a3', border: '1px solid #2a2a2a' }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
