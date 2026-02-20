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
          className="group bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-elevation-1 hover:shadow-elevation-3 hover:-translate-y-1.5 hover:border-primary/20 transition-all duration-300 flex flex-col"
        >
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${item.color} mb-5 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
          >
            <Icon name={item.icon as any} size={28} className="text-white" />
          </div>

          <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>

          <p className="text-sm font-medium text-text-secondary leading-relaxed">
            {item.description}
          </p>
        </a>
      ))}
    </div>
  );
};

export default QuickAccessPanel;
