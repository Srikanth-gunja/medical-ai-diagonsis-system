import FeatureCard from './FeatureCard';

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

const FeaturesSection = () => {
  const features: Feature[] = [
    {
      icon: 'CalendarDaysIcon',
      title: 'Easy Appointment Booking',
      description:
        'Schedule appointments with top-rated doctors in seconds. Choose your preferred time slot and get instant confirmation with automated reminders.',
      gradient: 'bg-gradient-to-br from-primary to-accent',
    },
    {
      icon: 'SparklesIcon',
      title: 'AI Symptom Assessment',
      description:
        'Get instant preliminary diagnosis with our advanced AI chatbot. Receive personalized doctor recommendations based on your symptoms and medical history.',
      gradient: 'bg-gradient-to-br from-accent to-primary',
    },
    {
      icon: 'VideoCameraIcon',
      title: 'Secure Video Consultations',
      description:
        'Connect with licensed doctors through encrypted video calls. Enjoy secure consultations from the comfort of your home with real-time chat support.',
      gradient: 'bg-gradient-to-br from-primary to-success',
    },
    {
      icon: 'DocumentTextIcon',
      title: 'Medical Record Management',
      description:
        'Access your complete medical history, prescriptions, and lab results in one secure location. Export records to PDF and share with healthcare providers instantly.',
      gradient: 'bg-gradient-to-br from-success to-accent',
    },
    {
      icon: 'ChatBubbleLeftRightIcon',
      title: 'Real-Time Messaging',
      description:
        'Communicate with your doctor during appointment windows through secure chat. Get quick answers to follow-up questions with message history persistence.',
      gradient: 'bg-gradient-to-br from-accent to-warning',
    },
    {
      icon: 'StarIcon',
      title: 'Doctor Ratings & Reviews',
      description:
        'Make informed decisions with verified patient reviews and ratings. Browse doctor profiles with specialties, experience, and patient satisfaction scores.',
      gradient: 'bg-gradient-to-br from-warning to-primary',
    },
  ];

  return (
    <section id="services" className="py-16 lg:py-24 bg-muted/30 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-sm font-medium text-primary">Platform Features</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-text-primary">
            Comprehensive & Professional
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Medical Services
            </span>
          </h2>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Experience comprehensive telemedicine services designed for convenience, security, and
            exceptional patient care.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
