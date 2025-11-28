import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ARView = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setHasPermission(true);
                }
            } catch (error) {
                console.error("Error accessing camera:", error);
                toast.error("Failed to access camera. Please enable permissions.");
            }
        };

        startCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden">
            {/* Camera Feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
            />

            {/* UI Overlays */}
            <div className="absolute top-4 left-4 z-10">
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => navigate("/")}
                    className="rounded-full bg-background/80 backdrop-blur-sm"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            </div>

            <div className="absolute top-4 right-4 z-10">
                <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AR Navigation Active</span>
                </div>
            </div>

            {!hasPermission && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
                    <div className="text-center p-6">
                        <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-xl font-bold mb-2">Camera Access Required</h2>
                        <p className="text-muted-foreground mb-4">
                            Please enable camera access to use AR navigation features.
                        </p>
                    </div>
                </div>
            )}

            {/* Mock AR Markers */}
            {hasPermission && (
                <>
                    <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 animate-bounce">
                        <div className="bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-2">
                            <span className="text-xl">♿</span>
                            <div className="text-xs">
                                <div className="font-bold">Ramp Access</div>
                                <div>15m ahead</div>
                            </div>
                        </div>
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[12px] border-t-primary/90 border-r-[8px] border-r-transparent mx-auto mt-[-1px]" />
                    </div>

                    <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 animate-bounce delay-150">
                        <div className="bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-2">
                            <span className="text-xl">🪜</span>
                            <div className="text-xs">
                                <div className="font-bold">Stairs</div>
                                <div>30m right</div>
                            </div>
                        </div>
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[12px] border-t-destructive/90 border-r-[8px] border-r-transparent mx-auto mt-[-1px]" />
                    </div>
                </>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-0 right-0 px-4 flex justify-center z-10">
                <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl w-full max-w-md">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Nearest Accessible Route</span>
                        <span className="text-xs text-muted-foreground">2 min (150m)</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-1/3 rounded-full" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Head straight, then turn right at the ramp.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ARView;
