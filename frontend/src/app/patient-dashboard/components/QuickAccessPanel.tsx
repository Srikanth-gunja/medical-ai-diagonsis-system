import Icon from '@/components/ui/AppIcon';

interface QuickAccessItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    href: string;
}

interface QuickAccessPanelProps {
    items: QuickAccessItem[];
}

const QuickAccessPanel = ({ items }: QuickAccessPanelProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
                <a
                    key={item.id}
                    href={item.href}
                    className="group bg-card border border-border rounded-xl p-6 shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-1 transition-base"
                >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${item.color} mb-4`}>
                        <Icon name={item.icon as any} size={24} className="text-white" />
                    </div>

                    <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-primary transition-base">
                        {item.title}
                    </h3>

                    <p className="text-sm text-text-secondary">
                        {item.description}
                    </p>
                </a>
            ))}
        </div>
    );
};

export default QuickAccessPanel;