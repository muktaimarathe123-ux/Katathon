import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Users, BarChart3, Glasses } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  const scrollToMap = () => {
    document.getElementById("map-view")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      {/* Background with enhanced gradient overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/98 via-background/90 to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-leaf/10 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-3xl">
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Navigate with
              <span className="text-primary block mt-2 bg-gradient-to-r from-primary via-primary-light to-accent-leaf bg-clip-text text-transparent">
                Confidence
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 mb-10 leading-relaxed max-w-2xl font-medium">
              Discover accessible routes, find ramps and elevators, and navigate campuses with ease.
              Built by the community, for everyone.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button size="lg" className="gap-2 shadow-large" onClick={scrollToMap}>
              <MapPin size={20} />
              Explore Map
            </Button>
            <Button size="lg" variant="outline" className="gap-2 backdrop-blur-sm" onClick={() => navigate('/community')}>
              <Users size={20} />
              Join Community
            </Button>
            <Button size="lg" variant="secondary" className="gap-2 shadow-md" onClick={() => navigate('/ar-view')}>
              <Glasses size={20} />
              AR Navigation
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-white" onClick={() => navigate('/analytics')}>
              <BarChart3 size={20} />
              Analytics
            </Button>
          </div>

          {/* Enhanced Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div
              onClick={scrollToMap}
              className="group bg-gradient-to-br from-card to-secondary/30 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-large hover:-translate-y-1 cursor-pointer"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Navigation className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Smart Routing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Accessible routes optimized for all abilities</p>
            </div>
            <div
              onClick={() => navigate('/community')}
              className="group bg-gradient-to-br from-card to-secondary/30 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-large hover:-translate-y-1 cursor-pointer"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Crowd-Sourced</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Real-time data from community members</p>
            </div>
            <div
              onClick={() => { scrollToMap(); /* Ideally enable heatmap layer here */ }}
              className="group bg-gradient-to-br from-card to-secondary/30 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-large hover:-translate-y-1 cursor-pointer"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Heat Maps</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Visual accessibility scores for areas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
