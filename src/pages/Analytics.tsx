import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, MapPin, Users } from "lucide-react";

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Insights into accessibility patterns and usage
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="text-primary" size={24} />
                <span className="text-sm text-muted-foreground">Total Markers</span>
              </div>
              <div className="text-3xl font-bold">247</div>
              <div className="text-sm text-accessible-high mt-1">+12% this month</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-primary" size={24} />
                <span className="text-sm text-muted-foreground">Active Users</span>
              </div>
              <div className="text-3xl font-bold">1,429</div>
              <div className="text-sm text-accessible-high mt-1">+23% this month</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="text-primary" size={24} />
                <span className="text-sm text-muted-foreground">Routes Created</span>
              </div>
              <div className="text-3xl font-bold">3,842</div>
              <div className="text-sm text-accessible-high mt-1">+18% this month</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-primary" size={24} />
                <span className="text-sm text-muted-foreground">Avg. Accessibility</span>
              </div>
              <div className="text-3xl font-bold">72%</div>
              <div className="text-sm text-accessible-high mt-1">+5% improvement</div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Route Type Usage */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Route Type Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Accessible Routes</span>
                    <span className="font-semibold">68%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "68%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Normal Routes</span>
                    <span className="font-semibold">32%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground rounded-full" style={{ width: "32%" }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Top Accessible Zones */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Top Accessible Zones</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Model Colony Central</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accessible-high rounded-full" style={{ width: "92%" }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">92</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">College Campus</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accessible-high rounded-full" style={{ width: "85%" }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">85</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Main Market Area</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accessible-medium rounded-full" style={{ width: "71%" }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">71</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Park Surroundings</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accessible-medium rounded-full" style={{ width: "58%" }} />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">58</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Marker Distribution */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Marker Distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">♿</span>
                    <span className="text-sm">Ramps</span>
                  </div>
                  <span className="font-semibold">94</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛗</span>
                    <span className="text-sm">Elevators</span>
                  </div>
                  <span className="font-semibold">42</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🦯</span>
                    <span className="text-sm">Tactile Paths</span>
                  </div>
                  <span className="font-semibold">67</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚶</span>
                    <span className="text-sm">Safe Walkways</span>
                  </div>
                  <span className="font-semibold">31</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🪜</span>
                    <span className="text-sm">Obstacles</span>
                  </div>
                  <span className="font-semibold text-accessible-low">13</span>
                </div>
              </div>
            </Card>

            {/* Obstacle Severity */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Obstacle Severity Clusters</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>High Severity</span>
                    <span className="font-semibold">4 locations</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accessible-low rounded-full" style={{ width: "31%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Medium Severity</span>
                    <span className="font-semibold">7 locations</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accessible-medium rounded-full" style={{ width: "54%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Low Severity</span>
                    <span className="font-semibold">2 locations</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent-leaf rounded-full" style={{ width: "15%" }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
