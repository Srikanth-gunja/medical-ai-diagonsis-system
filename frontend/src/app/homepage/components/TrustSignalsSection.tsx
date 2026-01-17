import Icon from '@/components/ui/AppIcon';

interface TrustBadge {
    icon: string;
    title: string;
    description: string;
}

const TrustSignalsSection = () => {
    const trustBadges: TrustBadge[] = [
        {
            icon: "LockClosedIcon",
            title: "End-to-End Encryption",
            description: "Your data is encrypted during transmission and storage"
        },
        {
            icon: "CheckBadgeIcon",
            title: "Verified Doctors",
            description: "All physicians are licensed and admin-verified"
        },
        {
            icon: "SparklesIcon",
            title: "AI-Powered Assistance",
            description: "Smart symptom analysis and doctor recommendations"
        },
        {
            icon: "ClipboardDocumentListIcon",
            title: "Digital Health Records",
            description: "Access your prescriptions and medical history anytime"
        }
    ];

    return (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary">
                        Your Health Data is
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Safe & Secure</span>
                    </h2>

                    <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                        We prioritize your privacy with industry-leading security measures.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trustBadges.map((badge, index) => (
                        <div
                            key={index}
                            className="bg-card rounded-xl p-6 shadow-elevation-1 border border-border text-center space-y-3"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
                                <Icon name={badge.icon as any} variant="solid" size={32} className="text-success" />
                            </div>

                            <h3 className="text-lg font-heading font-semibold text-text-primary">
                                {badge.title}
                            </h3>

                            <p className="text-sm text-text-secondary">
                                {badge.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <div className="inline-flex items-center space-x-6 px-8 py-4 bg-card rounded-full shadow-elevation-2 border border-border">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-success rounded-full animate-pulse-subtle" />
                            <span className="text-sm font-medium text-text-primary">SSL Secured</span>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex items-center space-x-2">
                            <Icon name="LockClosedIcon" variant="solid" size={20} className="text-success" />
                            <span className="text-sm font-medium text-text-primary">Encrypted Storage</span>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex items-center space-x-2">
                            <Icon name="CheckBadgeIcon" variant="solid" size={20} className="text-success" />
                            <span className="text-sm font-medium text-text-primary">Verified Doctors</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustSignalsSection;