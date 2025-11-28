import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation2, TrendingDown, AlertTriangle } from "lucide-react";

const RouteComparison = () => {
  // Mock data - in production, this would come from TomTom API + ML scoring
  const routes = {
    normal: {
      distance: "1.2 km",
      duration: "15 min",
      obstacles: 3,
      score: 45,
    },
    accessible: {
      distance: "1.4 km",
      duration: "18 min",
      obstacles: 0,
      score: 28,
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Route Comparison</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Normal Route */}
          <Card className="p-6 space-y-4 border-2 border-muted">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">Normal Route</h3>
                <p className="text-sm text-muted-foreground">Standard navigation path</p>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                {routes.normal.distance}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Navigation2 className="text-muted-foreground" size={18} />
                <span className="text-sm">Duration: {routes.normal.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-accessible-medium" size={18} />
                <span className="text-sm">Obstacles: {routes.normal.obstacles}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="text-muted-foreground" size={18} />
                <span className="text-sm">Accessibility Score: {routes.normal.score}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-muted-foreground rounded-full" 
                  style={{ width: `${Math.min(routes.normal.score, 100)}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Accessible Route */}
          <Card className="p-6 space-y-4 border-2 border-primary bg-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold">Accessible Route</h3>
                  <Badge className="bg-primary">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Optimized for accessibility</p>
              </div>
              <Badge className="bg-primary">
                {routes.accessible.distance}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Navigation2 className="text-primary" size={18} />
                <span className="text-sm">Duration: {routes.accessible.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-accessible-high" size={18} />
                <span className="text-sm">Obstacles: {routes.accessible.obstacles}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="text-primary" size={18} />
                <span className="text-sm">Accessibility Score: {routes.accessible.score}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-primary/20">
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${Math.min(routes.accessible.score, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Score Calculation:</strong> Lower score is better. 
            Formula: (distance × 0.4) + (elevation × 0.3) + (obstacles × 10) - (user rating × 2)
          </p>
        </div>
      </div>
    </section>
  );
};

export default RouteComparison;
