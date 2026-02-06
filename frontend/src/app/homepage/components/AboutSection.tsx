import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/AppIcon';

const AboutSection = () => {
    return (
        <section id="about" className="py-16 lg:py-24 bg-background scroll-mt-20">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content - Text */}
                    <div className="space-y-8 order-2 lg:order-1">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
                            <span className="text-sm font-medium text-primary">About Us</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-text-primary">
                            Committed to Your
                            <br />
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Health & Well-being
                            </span>
                        </h2>

                        <p className="text-lg text-text-secondary leading-relaxed">
                            At MediCare, we bridge the gap between advanced technology and compassionate care.
                            Our mission is to provide accessible, high-quality healthcare to everyone, everywhere.
                            By combining AI-powered diagnostics with a network of certified medical professionals,
                            we ensure you get the right care at the right time.
                        </p>

                        <div className="space-y-4">
                            {[
                                {
                                    title: '24/7 Availability',
                                    description: 'Access medical care whenever you need it, day or night.',
                                },
                                {
                                    title: 'Expert Specialists',
                                    description: 'Connect with board-certified doctors across various specialties.',
                                },
                                {
                                    title: 'Precision AI',
                                    description: 'Advanced algorithms to assist in accurate early diagnosis.',
                                },
                            ].map((item, index) => (
                                <div key={index} className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Icon name="CheckIcon" size={16} className="text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary">{item.title}</h3>
                                        <p className="text-text-secondary text-sm">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <Link
                                href="/patient-registration"
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:shadow-elevation-2 hover:scale-[1.02] transition-all duration-200"
                            >
                                <span>Learn More About Us</span>
                                <Icon name="ArrowRightIcon" size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Right Content - Image */}
                    <div className="relative order-1 lg:order-2">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 aspect-[4/3] group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                            <Image
                                src="/assets/images/about-team.png"
                                alt="Medical Team"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />


                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl -z-10" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
