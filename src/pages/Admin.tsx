import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const getTypeInfo = (type: string) => {
  switch (type) {
    case "ramp":
      return { icon: "♿", label: "Ramp" };
    case "lift":
    case "elevator":
      return { icon: "🛗", label: "Lift/Elevator" };
    case "tactile_path":
      return { icon: "🦯", label: "Tactile Path" };
    case "safe_path":
      return { icon: "🚶", label: "Safe Walkway" };
    case "obstacle":
    case "stairs":
    case "steep_slope":
    case "broken_sidewalk":
    case "narrow_path":
      return { icon: "🪜", label: "Obstacle" };
    default:
      return { icon: "📍", label: "Location" };
  }
};

const Admin = () => {
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8000/api/submissions?status=all");
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/submissions/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success(`Submission ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleApprove = async (submission: any) => {
    await updateStatus(submission.id, "approved");
  };

  const handleReject = async (id: string) => {
    await updateStatus(id, "rejected");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = submissions?.filter((s: any) => s.status === "pending").length || 0;
  const approvedCount = submissions?.filter((s: any) => s.status === "approved").length || 0;
  const rejectedCount = submissions?.filter((s: any) => s.status === "rejected").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Review and approve community submissions
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="text-accessible-medium" size={32} />
                <div>
                  <div className="text-3xl font-bold">{pendingCount}</div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-accessible-high" size={32} />
                <div>
                  <div className="text-3xl font-bold">
                    {approvedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <XCircle className="text-accessible-low" size={32} />
                <div>
                  <div className="text-3xl font-bold">
                    {rejectedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Submissions Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions?.map((submission: any) => {
                  const { icon } = getTypeInfo(submission.type);
                  return (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="text-2xl">{icon}</div>
                      </TableCell>
                      <TableCell className="font-medium">{submission.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {Array.from({ length: submission.rating || 0 }).map((_, i) => (
                            <span key={i}>⭐</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{submission.created_at ? formatDistanceToNow(new Date(submission.created_at), { addSuffix: true }) : "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.status === "approved" ? "default" :
                              submission.status === "rejected" ? "destructive" :
                                "outline"
                          }
                        >
                          {submission.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(!submission.status || submission.status === "pending") && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(submission)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(submission.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {submissions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No submissions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
