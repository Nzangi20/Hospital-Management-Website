// src/pages/DoctorPatientsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';
import {
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    CalendarIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const DoctorPatientsPage = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMyPatients();
    }, []);

    const fetchMyPatients = async () => {
        setLoading(true);
        try {
            // Get all appointments and extract unique patients
            const response = await appointmentsAPI.getAll();
            const appointments = response.data.data || [];

            // Build unique patients from appointments
            const patientMap = new Map();
            appointments.forEach((appt) => {
                const pid = appt.patient_id;
                if (!patientMap.has(pid)) {
                    patientMap.set(pid, {
                        patient_id: pid,
                        first_name: appt.patient_first_name,
                        last_name: appt.patient_last_name,
                        email: appt.patient_email || '',
                        phone: appt.patient_phone || '',
                        appointments: [],
                    });
                }
                patientMap.get(pid).appointments.push(appt);
            });

            setPatients(Array.from(patientMap.values()));
        } catch (error) {
            console.error('Failed to fetch patients', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter((p) => {
        const name = `${p.first_name} ${p.last_name}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
                    <p className="text-gray-500 mt-1">Patients you have attended or are scheduled to see</p>
                </div>
                <div className="text-sm text-gray-500">
                    Total: <span className="font-bold text-gray-800">{patients.length}</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search patients by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                />
            </div>

            {/* Patients Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="spinner"></div>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">No patients found</h3>
                    <p className="text-gray-400 mt-1">
                        {searchQuery ? 'No patients match your search.' : 'You have no patients yet.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => {
                        const totalAppts = patient.appointments.length;
                        const lastAppt = patient.appointments.sort((a, b) =>
                            new Date(b.appointment_date) - new Date(a.appointment_date)
                        )[0];

                        return (
                            <div key={patient.patient_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-teal-50 p-3 rounded-full">
                                        <UserIcon className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{patient.first_name} {patient.last_name}</p>
                                        {patient.phone && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <PhoneIcon className="w-3 h-3" /> {patient.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Visits</span>
                                        <span className="font-semibold text-gray-800">{totalAppts}</span>
                                    </div>
                                    {lastAppt && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Last Visit</span>
                                            <span className="text-gray-700">
                                                {new Date(lastAppt.appointment_date).toLocaleDateString('en-KE')}
                                            </span>
                                        </div>
                                    )}
                                    {lastAppt && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Last Status</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lastAppt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    lastAppt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {lastAppt.status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DoctorPatientsPage;
