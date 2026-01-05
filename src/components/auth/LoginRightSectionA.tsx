import { Zap, Shield, Globe } from "lucide-react";

export const LoginRightSectionA = () => {
    return (
        <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
            <div className="max-w-lg">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                    The best way to reach humans instead of spam folders
                </h2>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-1">Lightning fast delivery</h3>
                            <p className="text-muted-foreground text-sm">
                                Send transactional emails in milliseconds with our globally distributed infrastructure.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-1">Enterprise-grade security</h3>
                            <p className="text-muted-foreground text-sm">
                                SOC 2 compliant with end-to-end encryption and advanced threat protection.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-1">Global reach</h3>
                            <p className="text-muted-foreground text-sm">
                                Deliver emails to any inbox worldwide with our optimized routing system.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-muted border-2 border-background"
                            />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Trusted by <span className="font-semibold text-foreground">50,000+</span> developers
                    </p>
                </div>
            </div>
        </div>
    );
};
