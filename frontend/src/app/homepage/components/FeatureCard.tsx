import Icon from '@/components/ui/AppIcon';

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    gradient: string;
}

const FeatureCard = ({ icon, title, description, gradient }: FeatureCardProps) => {
    return (
        <div className="group relative bg-card rounded-2xl p-8 shadow-elevation-1 hover:shadow-elevation-3 transition-base border border-border">
            <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-base`} />

            <div className="relative space-y-4">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${gradient} bg-opacity-10`}>
                    <Icon name={icon as any} variant="solid" size={28} className="text-primary" />
                </div>

                <h3 className="text-xl font-heading font-semibold text-text-primary">
                    {title}
                </h3>

                <p className="text-text-secondary leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default FeatureCard;