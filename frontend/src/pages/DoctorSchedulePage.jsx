// src/pages/DoctorSchedulePage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const DoctorSchedulePage = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchSchedule();
    }, [selectedDate]);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const response = await appointmentsAPI.getAll({ date: selectedDate });
            setAppointments(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch schedule', error);
        } finally {
            setLoading(false);
        }
    };

    const changeDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-KE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            case 'Pending Payment': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Group appointments by time for a timeline view
    const sortedAppointments = [...appointments].sort((a, b) =>
        (a.appointment_time || '').localeCompare(b.appointment_time || '')
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
                    <p className="text-gray-500 mt-1">View your daily appointment schedule</p>
                </div>
            </div>

            {/* Date Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center justify-between">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</p>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="mt-1 text-sm text-teal-600 bg-transparent border-none cursor-pointer text-center"
                    />
                </div>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Appointments Timeline */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner"></div>
                </div>
            ) : sortedAppointments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">No appointments scheduled</h3>
                    <p className="text-gray-400 mt-1">You have no appointments on this date.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedAppointments.map((appt) => (
                        <div key={appt.appointment_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="bg-teal-50 p-3 rounded-lg">
                                        <ClockIcon className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-bold text-gray-900">
                                                {appt.appointment_time ? appt.appointment_time.slice(0, 5) : 'N/A'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appt.status)}`}>
                                                {appt.status}
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-800">
                                            <UserIcon className="w-4 h-4 inline mr-1" />
                                            {appt.patient_first_name} {appt.patient_last_name}
                                        </p>
                                        {appt.reason_for_visit && (
                                            <p className="text-sm text-gray-500 mt-1">Reason: {appt.reason_for_visit}</p>
                                        )}
                                        {appt.symptoms && (
                                            <p className="text-sm text-gray-400 mt-0.5">Symptoms: {appt.symptoms}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-700">KES {appt.consultation_fee || 0}</p>
                                    <p className="text-xs text-gray-400 mt-1">{appt.payment_status}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <p className="text-center text-sm text-gray-400 pt-2">
                        {sortedAppointments.length} appointment{sortedAppointments.length !== 1 ? 's' : ''} on this day
                    </p>
                </div>
            )}
        </div>
    );
};

export default DoctorSchedulePage;
