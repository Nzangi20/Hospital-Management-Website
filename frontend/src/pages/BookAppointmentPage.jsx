import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsAPI, appointmentsAPI, paymentAPI, patientsAPI } from '../services/api'; // Added patientsAPI
import { useAuth } from '../context/AuthContext'; // Added useAuth
import { toast } from 'react-toastify';
import {
  UserIcon, CalendarIcon, CreditCardIcon, CheckCircleIcon,
  MapPinIcon, ClockIcon, CurrencyDollarIcon, UserGroupIcon
} from '@heroicons/react/24/outline';

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user
  const isReceptionist = user?.role === 'Receptionist';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Data States
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [patients, setPatients] = useState([]); // For receptionist

  // Selection States
  const [selectedPatient, setSelectedPatient] = useState(null); // Selected patient
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [appointmentId, setAppointmentId] = useState(null);
  const [transactionRef, setTransactionRef] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, waiting, success, failed
  const [receiptData, setReceiptData] = useState(null);
  const [pollingTimer, setPollingTimer] = useState(null);

  // Define steps dynamically
  const steps = [
    ...(isReceptionist ? [{ id: 0, name: 'Patient', icon: UserGroupIcon }] : []),
    { id: 1, name: 'Specialty', icon: UserIcon },
    { id: 2, name: 'Doctor', icon: UserIcon },
    { id: 3, name: 'Schedule', icon: CalendarIcon },
    { id: 4, name: 'Details', icon: MapPinIcon },
    { id: 5, name: 'Payment', icon: CreditCardIcon },
    { id: 6, name: 'Confirm', icon: CheckCircleIcon },
  ];

  useEffect(() => {
    fetchSpecialties();
    if (isReceptionist) {
      fetchPatients();
      setCurrentStep(0); // Start at patient selection for receptionist
    }
  }, [isReceptionist]);

  const fetchPatients = async () => {
    try {
      const res = await patientsAPI.getAll();
      setPatients(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load patients');
    }
  };

  const fetchSpecialties = async () => {
    try {
      const res = await doctorsAPI.getSpecializations();
      setSpecialties(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load specialties');
    }
  };

  const fetchDoctors = async (specialty) => {
    setLoading(true);
    try {
      const res = await doctorsAPI.getAll({ specialization: specialty });
      setDoctors(res.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load doctors');
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId, date) => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.getAvailableSlots(doctorId, date);
      setAvailableSlots(res.data.data.availableSlots);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load slots');
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setCurrentStep(1);
  };

  const handleSpecialtySelect = (spec) => {
    setSelectedSpecialty(spec);
    fetchDoctors(spec);
    setCurrentStep(2);
  };

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    fetchSlots(doc.doctor_id, dateStr);
    setCurrentStep(3);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchSlots(selectedDoctor.doctor_id, date);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setCurrentStep(4);
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        doctorId: selectedDoctor.doctor_id,
        appointmentDate: selectedDate || new Date().toISOString().split('T')[0],
        appointmentTime: selectedTime,
        reasonForVisit: reason,
        symptoms: symptoms
      };

      if (!payload.appointmentDate) {
        toast.error('Please select an appointment date');
        setLoading(false);
        return;
      }

      // Add patientId if Receptionist is booking
      if (isReceptionist) {
        if (!selectedPatient) {
          toast.error('Please select a patient first');
          return;
        }
        payload.patientId = selectedPatient.patient_id;
      }

      // Create Pending Appointment
      const res = await appointmentsAPI.create(payload);

      setAppointmentId(res.data.data.appointment_id);
      setCurrentStep(5);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create appointment');
      setLoading(false);
    }
  };

  // Poll for payment status
  const pollPaymentStatus = (ref) => {
    setPaymentStatus('waiting');
    const interval = setInterval(async () => {
      try {
        const statusRes = await paymentAPI.checkStatus(ref);
        const data = statusRes.data.data;

        if (data.status === 'Success') {
          clearInterval(interval);
          setPollingTimer(null);
          setPaymentStatus('success');
          setReceiptData(data);
          setLoading(false);
          setCurrentStep(6);
          toast.success('Payment confirmed! Appointment booked.');
        } else if (data.status === 'Failed') {
          clearInterval(interval);
          setPollingTimer(null);
          setPaymentStatus('failed');
          setLoading(false);
          toast.error('Payment failed or was cancelled. Please try again.');
        }
        // If still Pending, continue polling
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    setPollingTimer(interval);

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPollingTimer(null);
      if (paymentStatus === 'waiting') {
        setPaymentStatus('failed');
        setLoading(false);
        toast.error('Payment timed out. Please try again.');
      }
    }, 120000);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPaymentStatus('idle');
    try {
      // 1. Initiate Payment (sends real STK Push)
      const initRes = await paymentAPI.initiate({
        appointmentId,
        amount: selectedDoctor.consultation_fee,
        paymentMethod,
        phoneNumber
      });

      const ref = initRes.data.data.transactionRef;
      setTransactionRef(ref);

      if (paymentMethod === 'M-Pesa') {
        // STK Push sent — start polling for callback result
        toast.success('STK Push sent! Check your phone.');
        pollPaymentStatus(ref);
      } else {
        // Non-M-Pesa: process immediately
        const procRes = await paymentAPI.process({ transactionRef: ref });
        if (procRes.data.success) {
          setPaymentStatus('success');
          setCurrentStep(6);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      const msg = error.response?.data?.message || 'Payment failed. Please try again.';
      toast.error(msg);
      setLoading(false);
      setPaymentStatus('failed');
    }
  };

  // --- Render Steps ---

  const renderStepPatient = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Select Patient (Walk-in)</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((p) => (
          <div
            key={p.patient_id}
            onClick={() => handlePatientSelect(p)}
            className={`p-4 border rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 ${selectedPatient?.patient_id === p.patient_id ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : 'border-gray-200'}`}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <UserIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold">{p.first_name} {p.last_name}</p>
                <p className="text-sm text-gray-500">{p.phone}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {patients.length === 0 && <p>No patients found.</p>}
    </div>
  );

  const renderStep1 = () => (
    <div className='space-y-4'>
      {isReceptionist && selectedPatient && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-xs text-blue-600 font-bold uppercase">Booking For:</span>
            <p className="font-medium text-blue-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
          </div>
          <button onClick={() => setCurrentStep(0)} className="text-sm text-blue-600 hover:underline">Change</button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {specialties.map((spec) => (
          <button
            key={spec}
            onClick={() => handleSpecialtySelect(spec)}
            className="p-6 bg-white border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition flex flex-col items-center shadow-sm"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-3 text-teal-600">
              <UserIcon className="w-6 h-6" />
            </div>
            <span className="font-semibold text-gray-700">{spec}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <button onClick={() => setCurrentStep(1)} className="text-sm text-gray-500 hover:text-teal-600 mb-4">← Back to Specialties</button>
      {doctors.map((doc) => (
        <div key={doc.doctor_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Dr. {doc.first_name} {doc.last_name}</h3>
            <p className="text-teal-600 font-medium">{doc.medical_role}</p>
            <p className="text-sm text-gray-500 mt-1">{doc.qualification} • {doc.experience_years} Years Exp.</p>
            <p className="text-sm text-gray-500 mt-1">Fee: <span className="font-bold text-gray-800">KES {doc.consultation_fee}</span></p> {/* Fixed: consultation_fee */}
          </div>
          <button
            onClick={() => handleDoctorSelect(doc)}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
          >
            Select
          </button>
        </div>
      ))}
      {doctors.length === 0 && !loading && <p className="text-center text-gray-500">No doctors found for this specialty.</p>}
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <button onClick={() => setCurrentStep(2)} className="text-sm text-gray-500 hover:text-teal-600 mb-4">← Back to Doctors</button>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={handleDateChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {loading ? (
              <div className="col-span-full flex justify-center py-4">
                <div className="spinner-sm"></div>
              </div>
            ) : availableSlots.length > 0 ? availableSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => handleTimeSelect(slot)}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition ${selectedTime === slot
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {slot.slice(0, 5)}
              </button>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-3">No slots available for this date.</p>
                <button
                  onClick={() => {
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const nextDayStr = nextDay.toISOString().split('T')[0];
                    setSelectedDate(nextDayStr);
                    fetchSlots(selectedDoctor.doctor_id, nextDayStr);
                  }}
                  className="text-teal-600 text-sm font-medium hover:underline"
                >
                  Check Next Day &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <button onClick={() => setCurrentStep(3)} className="text-sm text-gray-500 hover:text-teal-600 mb-4">← Back to Schedule</button>
      <h2 className="text-xl font-bold mb-6">Patient Details</h2>
      <form onSubmit={handleDetailsSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="e.g. Regular Checkup"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms (Optional)</label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-32"
            placeholder="Describe how you are feeling..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold text-lg disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );

  const renderStep5 = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6 text-center">Payment Details</h2>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center">
        <span className="text-gray-600">Total Amount</span>
        <span className="text-2xl font-bold text-teal-700">KES {selectedDoctor.consultation_fee}</span>
      </div>

      {/* Waiting for M-Pesa confirmation */}
      {paymentStatus === 'waiting' && (
        <div className="text-center py-8">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Waiting for M-Pesa Confirmation</h3>
          <p className="text-green-700 mb-1">An STK push has been sent to <strong>{phoneNumber}</strong></p>
          <p className="text-sm text-gray-500">Please enter your M-Pesa PIN on your phone to complete the payment.</p>
          <p className="text-xs text-gray-400 mt-4 animate-pulse">Checking payment status...</p>
        </div>
      )}

      {/* Payment failed */}
      {paymentStatus === 'failed' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✗</span>
          </div>
          <h3 className="text-lg font-bold text-red-700 mb-2">Payment Failed</h3>
          <p className="text-sm text-gray-500 mb-4">The payment was not completed. Please try again.</p>
          <button
            onClick={() => setPaymentStatus('idle')}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Payment form (idle state) */}
      {(paymentStatus === 'idle') && (
        <form onSubmit={handlePayment} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setPaymentMethod('M-Pesa')}
                className={`p-4 border rounded-lg cursor-pointer flex items-center justify-center space-x-2 ${paymentMethod === 'M-Pesa' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <span className="font-bold text-green-700">M-Pesa</span>
              </div>
              <div
                onClick={() => setPaymentMethod('Card')}
                className={`p-4 border rounded-lg cursor-pointer flex items-center justify-center space-x-2 ${paymentMethod === 'Card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <span className="font-bold text-blue-700">Card</span>
              </div>
            </div>
          </div>

          {paymentMethod === 'M-Pesa' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone Number</label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="07XXXXXXXX"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          )}

          {paymentMethod === 'Card' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input type="text" required placeholder="XXXX XXXX XXXX XXXX" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input type="text" placeholder="MM/YY" className="w-full p-3 border rounded-lg" />
                <input type="text" placeholder="CVC" className="w-full p-3 border rounded-lg" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
          >
            {loading ? 'Sending STK Push...' : paymentMethod === 'M-Pesa' ? `Pay KES ${selectedDoctor.consultation_fee} via M-Pesa` : `Pay KES ${selectedDoctor.consultation_fee}`}
          </button>
        </form>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
      {/* Receipt Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Payment Confirmed!</h2>
        <p className="text-gray-500 text-sm mt-1">Your appointment has been booked successfully.</p>
      </div>

      {/* Receipt */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 mb-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-700">MedTouch HMS</h3>
          <p className="text-xs text-gray-400">PAYMENT RECEIPT</p>
        </div>
        <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Patient</span>
            <span className="font-medium">{receiptData?.patientName || (isReceptionist && selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : user?.firstName + ' ' + user?.lastName)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Doctor</span>
            <span className="font-medium">{receiptData?.doctorName || `Dr. ${selectedDoctor?.first_name} ${selectedDoctor?.last_name}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Specialization</span>
            <span className="font-medium">{receiptData?.specialization || selectedDoctor?.medical_role}</span>
          </div>
          <div className="border-t border-gray-100 my-2"></div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">{receiptData?.appointmentDate ? new Date(receiptData.appointmentDate).toLocaleDateString('en-KE') : selectedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-medium">{receiptData?.appointmentTime?.slice(0, 5) || selectedTime?.slice(0, 5)}</span>
          </div>
          <div className="border-t border-gray-100 my-2"></div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-bold text-green-700 text-lg">KES {receiptData?.amount || selectedDoctor?.consultation_fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method</span>
            <span className="font-medium">{paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Transaction Ref</span>
            <span className="font-mono text-xs">{transactionRef}</span>
          </div>
          {receiptData?.mpesaReceipt && (
            <div className="flex justify-between">
              <span className="text-gray-500">M-Pesa Receipt</span>
              <span className="font-mono text-xs font-bold text-green-700">{receiptData.mpesaReceipt}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-bold">PAID</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate(isReceptionist ? '/receptionist/dashboard' : '/patient/dashboard')}
        className="w-full px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold"
      >
        Go to Dashboard
      </button>
    </div>
  );

  return (
    <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">{isReceptionist ? 'New Walk-in Appointment' : 'Book an Appointment'}</h1>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.id;
              return (
                <div key={step.id} className="flex flex-col items-center bg-gray-50 px-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${isActive ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isActive ? 'text-teal-700' : 'text-gray-400'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          {currentStep === 0 && renderStepPatient()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
