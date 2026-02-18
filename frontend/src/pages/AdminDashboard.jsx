// src/pages/AdminDashboard.jsx — Full Admin Dashboard with Manage Users & Settings
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';

// Map URL paths to tab IDs and back
const pathToTab = {
  '/admin/dashboard': 'dashboard',
  '/admin/users': 'users',
  '/admin/settings': 'settings',
};
const tabToPath = {
  dashboard: '/admin/dashboard',
  users: '/admin/users',
  settings: '/admin/settings',
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = pathToTab[location.pathname] || 'dashboard';
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '',
    role: 'Patient', phone: '', specialization: '', licenseNumber: ''
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, rolesRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getRoles()
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      email: '', password: '', firstName: '', lastName: '',
      role: 'Patient', phone: '', specialization: '', licenseNumber: ''
    });
    setShowModal(true);
  };

  const handleEditUser = (u) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      password: '',
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role_name,
      phone: u.phone || '',
      specialization: '',
      licenseNumber: ''
    });
    setShowModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await adminAPI.updateUser(editingUser.user_id, updateData);
        toast.success('User updated successfully');
      } else {
        await adminAPI.createUser(formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await adminAPI.toggleUserStatus(userId);
      toast.success(res.data.message);
      loadDashboard();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deactivated');
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchTerm ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role_name === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto py-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg shadow-sm p-1 border">
          {[
            { id: 'dashboard', label: '📊 Dashboard', icon: '' },
            { id: 'users', label: '👥 Manage Users', icon: '' },
            { id: 'settings', label: '⚙️ Settings', icon: '' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(tabToPath[tab.id])}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-500', icon: '👥' },
                { label: 'Patients', value: stats.totalPatients, color: 'bg-green-500', icon: '🩺' },
                { label: 'Doctors', value: stats.totalDoctors, color: 'bg-purple-500', icon: '👨‍⚕️' },
                { label: 'Active Users', value: stats.activeUsers, color: 'bg-teal-500', icon: '✅' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white text-xl`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <p className="text-sm text-gray-500">Total Appointments</p>
                <p className="text-3xl font-bold mt-1">{stats.totalAppointments}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <p className="text-sm text-gray-500">Today's Appointments</p>
                <p className="text-3xl font-bold mt-1 text-orange-600">{stats.todayAppointments}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold mt-1 text-green-600">KES {Number(stats.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { navigate('/admin/users'); setTimeout(handleCreateUser, 100); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                  + Add New User
                </button>
                <button onClick={() => navigate('/admin/users')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                  View All Users
                </button>
                <button onClick={() => navigate('/admin/settings')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                  System Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm p-4 border flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 flex-1">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Roles</option>
                  {roles.map(r => (
                    <option key={r.role_id} value={r.role_name}>{r.role_name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleCreateUser} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm whitespace-nowrap">
                + Add User
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map(u => (
                      <tr key={u.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                              {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role_name === 'Admin' ? 'bg-red-100 text-red-700' :
                            u.role_name === 'Doctor' ? 'bg-purple-100 text-purple-700' :
                              u.role_name === 'Receptionist' ? 'bg-blue-100 text-blue-700' :
                                u.role_name === 'Pharmacist' ? 'bg-orange-100 text-orange-700' :
                                  'bg-green-100 text-green-700'
                            }`}>
                            {u.role_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditUser(u)} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                              Edit
                            </button>
                            <button onClick={() => handleToggleStatus(u.user_id)} className={`px-3 py-1.5 text-xs rounded-lg ${u.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}>
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => handleDeleteUser(u.user_id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">No users found matching your criteria.</div>
              )}
              <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Hospital Information */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">🏥 Hospital Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                  <input type="text" defaultValue="MedTouch Hospital" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input type="email" defaultValue="admin@hospital.com" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="text" defaultValue="+254 700 000 000" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" defaultValue="Nairobi, Kenya" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <button onClick={() => toast.success('Hospital info saved')} className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                Save Changes
              </button>
            </div>

            {/* Consultation Fees */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">💰 Consultation Fees (KES)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">General Consultation</label>
                  <input type="number" defaultValue="1500" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialist Consultation</label>
                  <input type="number" defaultValue="3000" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Fee</label>
                  <input type="number" defaultValue="5000" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <button onClick={() => toast.success('Fee schedule saved')} className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                Save Changes
              </button>
            </div>

            {/* Working Hours */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">🕐 Working Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                  <input type="time" defaultValue="08:00" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                  <input type="time" defaultValue="18:00" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Duration (minutes)</label>
                  <input type="number" defaultValue="30" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                  <input type="text" defaultValue="Monday - Saturday" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <button onClick={() => toast.success('Working hours saved')} className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                Save Changes
              </button>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h3 className="text-lg font-semibold mb-4">ℹ️ System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Application Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Environment</span>
                  <span className="font-medium">Development</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Database</span>
                  <span className="font-medium text-green-600">Connected</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Total Users</span>
                  <span className="font-medium">{stats?.totalUsers || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmitUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text" required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text" required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder={editingUser ? 'Leave blank to keep current' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {roles.map(r => (
                    <option key={r.role_id} value={r.role_name}>{r.role_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="+254..."
                />
              </div>

              {formData.role === 'Doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., General Practice, Cardiology"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
