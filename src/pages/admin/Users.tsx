import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function Users() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldAlert className="h-8 w-8" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários e suas permissões no sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Em Desenvolvimento</CardTitle>
            <CardDescription>
              Esta funcionalidade está em desenvolvimento e será disponibilizada em breve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidades planejadas:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Listar todos os usuários do sistema</li>
              <li>Gerenciar roles (admin, personal, client)</li>
              <li>Adicionar/remover roles de usuários</li>
              <li>Desativar contas de usuários</li>
              <li>Ver log de atividades por usuário</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
