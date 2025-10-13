import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PhysicalAssessmentDialog } from "./PhysicalAssessmentDialog";
import { useClientAssessments } from "@/hooks/usePhysicalAssessments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Activity } from "lucide-react";
import { AssessmentChart } from "./AssessmentChart";

interface AssessmentsTabProps {
  clientId: string;
}

export const AssessmentsTab = ({ clientId }: AssessmentsTabProps) => {
  const { data: assessments = [], isLoading } = useClientAssessments(clientId);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded" />
      <div className="h-64 bg-muted rounded" />
    </div>;
  }

  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Activity className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação registrada</h3>
        <p className="text-muted-foreground mb-4">Registre a primeira avaliação física do cliente</p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Avaliação
        </Button>
        <PhysicalAssessmentDialog
          clientId={clientId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Histórico de Avaliações</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Avaliação
        </Button>
      </div>

      <AssessmentChart assessments={assessments} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Peso (kg)</TableHead>
              <TableHead>Altura (cm)</TableHead>
              <TableHead>IMC</TableHead>
              <TableHead>% Gordura</TableHead>
              <TableHead>% Massa Muscular</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment: any) => (
              <TableRow key={assessment.id}>
                <TableCell>
                  {format(new Date(assessment.assessment_date), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>{assessment.weight || "-"}</TableCell>
                <TableCell>{assessment.height || "-"}</TableCell>
                <TableCell>{assessment.bmi ? assessment.bmi.toFixed(1) : "-"}</TableCell>
                <TableCell>{assessment.body_fat_percentage || "-"}</TableCell>
                <TableCell>{assessment.muscle_mass_percentage || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PhysicalAssessmentDialog
        clientId={clientId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
