// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';
import {
  HeartIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const features = [
    {
      icon: CalendarIcon,
      title: 'Easy Appointment Booking',
      description: 'Schedule appointments with your preferred doctors in just a few clicks.'
    },
    {
      icon: ClipboardDocumentListIcon,
      title: 'Digital Medical Records',
      description: 'Access your complete medical history and prescriptions anytime, anywhere.'
    },
    {
      icon: UserGroupIcon,
      title: 'Expert Doctors',
      description: 'Connect with qualified healthcare professionals across various specializations.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Private',
      description: 'Your health data is protected with industry-standard security measures.'
    },
    {
      icon: ClockIcon,
      title: '24/7 Access',
      description: 'Manage your healthcare needs anytime with our digital platform.'
    },
    {
      icon: HeartIcon,
      title: 'Patient-Centered Care',
      description: 'Comprehensive healthcare management focused on your wellbeing.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <HeartIcon className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-display font-bold text-primary-600">
                MediCare Plus
              </span>
            </div>
            <div className="flex space-x-4">
              <Link to="/login" className="btn-outline">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 mb-6 animate-fade-in">
            Your Health,
            <span className="text-primary-600"> Our Priority</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Modern healthcare management system providing seamless access to quality medical services.
            Book appointments, access medical records, and manage your health journey all in one place.
          </p>
          <Link to="/register" className="btn-primary text-lg px-8 py-3">
            Get Started
          </Link>
          <Link to="/login" className="btn-outline text-lg px-8 py-3">
            Find Doctors
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white rounded-3xl shadow-xl my-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Why Choose MediCare Plus?
          </h2>
          <p className="text-lg text-gray-600">
            Comprehensive healthcare solutions designed for modern patients
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <feature.icon className="h-12 w-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-primary-100">Happy Patients</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">150+</div>
              <div className="text-primary-100">Expert Doctors</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-primary-100">Specializations</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-display font-bold mb-4">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl mb-8 text-primary-50">
            Join thousands of patients managing their healthcare digitally
          </p>
          <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg text-lg inline-block">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <HeartIcon className="h-6 w-6 text-primary-400" />
                <span className="text-xl font-display font-bold text-white">
                  MediCare Plus
                </span>
              </div>
              <p className="text-sm">
                Your trusted partner in modern healthcare management.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="hover:text-primary-400">Find Doctors</Link></li>
                <li><Link to="/login" className="hover:text-primary-400">Patient Portal</Link></li>
                <li><Link to="/about" className="hover:text-primary-400">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Services</h3>
              <ul className="space-y-2 text-sm">
                <li>Online Appointments</li>
                <li>Medical Records</li>
                <li>Prescriptions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>Email: info@medicareplus.com</li>
                <li>Phone: +1 (555) 123-4567</li>
                <li>24/7 Emergency: 911</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 MediCare Plus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
