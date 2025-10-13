import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AssessmentChartProps {
  assessments: any[];
}

export const AssessmentChart = ({ assessments }: AssessmentChartProps) => {
  const chartData = [...assessments]
    .reverse()
    .map((assessment) => ({
      date: format(new Date(assessment.assessment_date), "dd/MM", { locale: ptBR }),
      peso: assessment.weight || null,
      gordura: assessment.body_fat_percentage || null,
      imc: assessment.bmi ? Number(assessment.bmi.toFixed(1)) : null,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução das Medidas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" name="Peso (kg)" />
            <Line type="monotone" dataKey="gordura" stroke="hsl(var(--destructive))" name="% Gordura" />
            <Line type="monotone" dataKey="imc" stroke="hsl(var(--accent))" name="IMC" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
