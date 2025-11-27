import { useState, useMemo } from "react";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { IncidentCard } from "@/components/moderation/IncidentCard";
import { ResolveIncidentDialog } from "@/components/moderation/ResolveIncidentDialog";
import { DateRangeFilter } from "@/components/moderation/DateRangeFilter";
import { useIncidents } from "@/lib/hooks/useModerationMutations";
import type { Incident } from "@/lib/api/moderation";

export default function ModerationReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [isAppealReview, setIsAppealReview] = useState(false);

  // Fetch all incidents
  const { data: incidents, isLoading, error } = useIncidents();

  // Filter incidents by tab
  const appealedIncidents = useMemo(() => {
    return (
      incidents?.filter(
        (i) => i.status === "APPEALED" && i.appealReason !== null
      ) || []
    );
  }, [incidents]);

  const automaticReports = useMemo(() => {
    return (
      incidents?.filter(
        (i) => i.reporterId === "0" && i.status === "PENDING"
      ) || []
    );
  }, [incidents]);

  const manualReports = useMemo(() => {
    return (
      incidents?.filter(
        (i) => i.reporterId !== "0" && i.status === "PENDING"
      ) || []
    );
  }, [incidents]);

  // Apply filters to incidents list
  const filterIncidents = (incidentsList: Incident[]) => {
    return incidentsList.filter((incident) => {
      // Search filter (search by product name if available, or incident comment)
      const matchesSearch =
        searchQuery === "" ||
        incident.comment?.toLowerCase().includes(searchQuery.toLowerCase());

      // Incident type filter
      const matchesType =
        incidentTypeFilter === "all" || incident.type === incidentTypeFilter;

      // Date range filter
      const incidentDate = new Date(incident.createdAt);
      const matchesFromDate = !fromDate || incidentDate >= new Date(fromDate);
      const matchesToDate =
        !toDate || incidentDate <= new Date(toDate + "T23:59:59");

      return matchesSearch && matchesType && matchesFromDate && matchesToDate;
    });
  };

  const filteredAppealedIncidents = filterIncidents(appealedIncidents);
  const filteredAutomaticReports = filterIncidents(automaticReports);
  const filteredManualReports = filterIncidents(manualReports);

  const handleReview = (incident: Incident, isAppeal: boolean = false) => {
    setSelectedIncident(incident);
    setIsAppealReview(isAppeal);
    setResolveDialogOpen(true);
  };

  const handleClearDateFilters = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Incident Reports Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and resolve product incident reports and appeals
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by comment or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={incidentTypeFilter}
              onValueChange={setIncidentTypeFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Incident Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DANGEROUS">Dangerous</SelectItem>
                <SelectItem value="FRAUD">Fraud</SelectItem>
                <SelectItem value="INAPPROPRIATE">Inappropriate</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onClear={handleClearDateFilters}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">
            Failed to load incidents. Please try again.
          </p>
        </div>
      )}

      {/* Tabs */}
      {!isLoading && !error && (
        <Tabs defaultValue="appeals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appeals" className="relative">
              Appeals
              {appealedIncidents.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-purple-500 text-white"
                >
                  {appealedIncidents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="manual" className="relative">
              Manual Reports
              {manualReports.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-500 text-white"
                  hidden={manualReports.length === 0}
                >
                  {manualReports.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="automatic" className="relative">
              Automatic Reports
              {automaticReports.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-orange-500 text-white"
                  hidden={automaticReports.length === 0}
                >
                  {automaticReports.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Appeals Tab */}
          <TabsContent value="appeals" className="space-y-4">
            {filteredAppealedIncidents.length > 0 ? (
              <>
                {filteredAppealedIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onReview={(inc) => handleReview(inc, true)}
                    isAppeal={true}
                  />
                ))}
                <div className="text-center text-sm text-muted-foreground mt-6">
                  Showing {filteredAppealedIncidents.length} of{" "}
                  {appealedIncidents.length} appealed incident
                  {appealedIncidents.length !== 1 ? "s" : ""}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {appealedIncidents.length === 0
                    ? "No appealed incidents at this time."
                    : "No appealed incidents match your filters."}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Manual Reports Tab */}
          <TabsContent value="manual" className="space-y-4">
            {filteredManualReports.length > 0 ? (
              <>
                {filteredManualReports.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onReview={(inc) => handleReview(inc, false)}
                    isAppeal={false}
                  />
                ))}
                <div className="text-center text-sm text-muted-foreground mt-6">
                  Showing {filteredManualReports.length} of{" "}
                  {manualReports.length} manual report
                  {manualReports.length !== 1 ? "s" : ""}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {manualReports.length === 0
                    ? "No manual reports at this time."
                    : "No manual reports match your filters."}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Automatic Reports Tab */}
          <TabsContent value="automatic" className="space-y-4">
            {filteredAutomaticReports.length > 0 ? (
              <>
                {filteredAutomaticReports.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onReview={(inc) => handleReview(inc, false)}
                    isAppeal={false}
                  />
                ))}
                <div className="text-center text-sm text-muted-foreground mt-6">
                  Showing {filteredAutomaticReports.length} of{" "}
                  {automaticReports.length} automatic report
                  {automaticReports.length !== 1 ? "s" : ""}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {automaticReports.length === 0
                    ? "No automatic reports at this time."
                    : "No automatic reports match your filters."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Resolve Incident Dialog */}
      <ResolveIncidentDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        incident={selectedIncident}
        isAppeal={isAppealReview}
      />
    </div>
  );
}
