import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import RegistrationInteractive from './components/RegistrationInteractive';

export const metadata: Metadata = {
    title: 'Patient Registration - MediCare',
    description: 'Create your MediCare patient account to access telemedicine services, book appointments with verified doctors, and manage your health records securely.',
};

export default function PatientRegistrationPage() {
    return (
        <>
            <PublicHeader />
            <RegistrationInteractive />
        </>
    );
}