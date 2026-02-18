import {
    HomeIcon,
    UserGroupIcon,
    CalendarIcon,
    DocumentTextIcon,
    ClipboardDocumentCheckIcon,
    CreditCardIcon,
    Cog6ToothIcon,
    BeakerIcon,
    ArchiveBoxIcon
} from '@heroicons/react/24/outline';

export const navigation = {
    Patient: [
        { name: 'Dashboard', href: '/patient/dashboard', icon: HomeIcon },
        { name: 'Book Appointment', href: '/book-appointment', icon: CalendarIcon },
        { name: 'Medical Records', href: '/medical-records', icon: DocumentTextIcon },
        { name: 'Prescriptions', href: '/prescriptions', icon: ClipboardDocumentCheckIcon },
        { name: 'Billing', href: '/billing', icon: CreditCardIcon },
    ],
    Doctor: [
        { name: 'Dashboard', href: '/doctor/dashboard', icon: HomeIcon },
        { name: 'My Schedule', href: '/doctor/schedule', icon: CalendarIcon },
        { name: 'Appointments', href: '/doctor/appointments', icon: UserGroupIcon },
        { name: 'Patients', href: '/doctor/patients', icon: UserGroupIcon },
    ],
    Receptionist: [
        { name: 'Dashboard', href: '/receptionist/dashboard', icon: HomeIcon },
        { name: 'Appointments', href: '/receptionist/dashboard', icon: CalendarIcon },
        { name: 'Walk-in Booking', href: '/book-appointment', icon: UserGroupIcon },
        { name: 'Billing', href: '/billing', icon: CreditCardIcon },
    ],
    Admin: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
        { name: 'Manage Users', href: '/admin/users', icon: UserGroupIcon },
        { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
    ],
    Pharmacist: [
        { name: 'Dashboard', href: '/pharmacist/dashboard', icon: HomeIcon },
        { name: 'Inventory', href: '/pharmacist/inventory', icon: ArchiveBoxIcon },
        { name: 'Prescriptions', href: '/pharmacist/prescriptions', icon: BeakerIcon },
    ],
};
