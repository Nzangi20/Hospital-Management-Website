// src/pages/DoctorsPage.jsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors`);
      console.log('Doctors fetched:', response.data);
      setDoctors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Our Doctors</h1>

        {doctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No doctors found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.doctor_id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">
                  Dr. {doctor.first_name} {doctor.last_name}
                </h3>
                <p className="text-primary-600 font-medium mb-2">
                  {doctor.specialization}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {doctor.experience_years} years experience
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {doctor.qualification}
                </p>
                <p className="text-lg font-bold text-primary-600 mb-4">
                  KES {doctor.consultation_fee}
                </p>
                <Link
                  to={`/book-appointment?doctor=${doctor.doctor_id}`}
                  className="btn-primary w-full text-center block"
                >
                  Book Appointment
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsPage;