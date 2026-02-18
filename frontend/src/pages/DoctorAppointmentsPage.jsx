// src/pages/DoctorAppointmentsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    FunnelIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const DoctorAppointmentsPage = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await appointmentsAPI.getAll();
            setAppointments(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch appointments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await appointmentsAPI.update(id, { status: newStatus });
            toast.success(`Appointment ${newStatus.toLowerCase()}`);
            fetchAppointments();
        } catch (error) {
            toast.error('Failed to update appointment');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            case 'Pending Payment': return 'bg-yellow-100 text-yellow-800';
            case 'In Progress': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredAppointments = statusFilter === 'all'
        ? appointments
        : appointments.filter((a) => a.status === statusFilter);

    const statuses = ['all', 'Scheduled', 'Pending Payment', 'Completed', 'Cancelled'];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-gray-500 mt-1">Manage all your patient appointments</p>
                </div>
                <div className="text-sm text-gray-500">
                    Total: <span className="font-bold text-gray-800">{appointments.length}</span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${statusFilter === s
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {s === 'all' ? 'All' : s}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner"></div>
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">No appointments found</h3>
                    <p className="text-gray-400 mt-1">
                        {statusFilter === 'all' ? 'You have no appointments yet.' : `No ${statusFilter} appointments.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map((appt) => (
                        <div key={appt.appointment_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-50 p-3 rounded-lg">
                                        <UserIcon className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-lg">
                                            {appt.patient_first_name} {appt.patient_last_name}
                                        </p>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="w-4 h-4" />
                                                {new Date(appt.appointment_date).toLocaleDateString('en-KE')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ClockIcon className="w-4 h-4" />
                                                {appt.appointment_time ? appt.appointment_time.slice(0, 5) : 'N/A'}
                                            </span>
                                        </div>
                                        {appt.reason_for_visit && (
                                            <p className="text-sm text-gray-500 mt-1">Reason: {appt.reason_for_visit}</p>
                                        )}
                                        {appt.symptoms && (
                                            <p className="text-sm text-gray-400 mt-0.5">Symptoms: {appt.symptoms}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appt.status)}`}>
                                        {appt.status}
                                    </span>
                                    <p className="text-sm font-semibold text-gray-700">KES {appt.consultation_fee || 0}</p>
                                    {appt.status === 'Scheduled' && (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleStatusChange(appt.appointment_id, 'Completed')}
                                                className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" /> Complete
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(appt.appointment_id, 'Cancelled')}
                                                className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition"
                                            >
                                                <XCircleIcon className="w-4 h-4" /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorAppointmentsPage;
