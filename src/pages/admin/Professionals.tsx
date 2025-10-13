import { AppLayout } from "@/layouts/AppLayout";
import { useAdminProfessionals } from "@/hooks/useAdminProfessionals";
import { ProfessionalCard } from "@/components/admin/ProfessionalCard";
import { AddProfessionalDialog } from "@/components/admin/AddProfessionalDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Award } from "lucide-react";

export default function Professionals() {
  const { data: professionals, isLoading } = useAdminProfessionals();

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Award className="h-8 w-8" />
              Profissionais
            </h1>
            <p className="text-muted-foreground">
              Gerencie todos os personal trainers do sistema
            </p>
          </div>
          <AddProfessionalDialog />
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : professionals && professionals.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {professionals.map((prof) => (
              <ProfessionalCard key={prof.id} professional={prof} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum profissional cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando o primeiro personal trainer
            </p>
            <AddProfessionalDialog />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
