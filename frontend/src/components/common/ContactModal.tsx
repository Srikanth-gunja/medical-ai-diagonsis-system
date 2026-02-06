'use client';

import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/AppIcon';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Contact Us">
            <div className="space-y-6">
                <p className="text-text-secondary">
                    We're here to help! Reach out to us through any of the following channels.
                </p>

                <div className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-xl">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Icon name="EnvelopeIcon" size={20} className="text-primary" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-primary">Email Support</h4>
                            <p className="text-sm text-text-secondary mb-1">For general inquiries and support</p>
                            <a href="mailto:support@medicare.com" className="text-primary hover:underline font-medium">
                                support@medicare.com
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-xl">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                <Icon name="PhoneIcon" size={20} className="text-accent" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-primary">Phone Support</h4>
                            <p className="text-sm text-text-secondary mb-1">Mon-Fri: 9AM - 6PM IST</p>
                            <a href="tel:+91-9876543210" className="text-primary hover:underline font-medium">
                                +91 98765 43210
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-xl">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                <Icon name="MapPinIcon" size={20} className="text-success" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-text-primary">Office Location</h4>
                            <p className="text-sm text-text-secondary">
                                Mangalpally<br />
                                Hyderabad, Telangana 501510
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 text-center">
                    <p className="text-sm text-text-secondary">
                        Need immediate medical attention? <span className="text-red-500 font-bold">Dial 112</span>
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ContactModal;
