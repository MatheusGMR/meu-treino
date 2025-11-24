import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reassignClientSchema, type ReassignClient } from "@/lib/schemas/reassignmentSchema";
import { useReassignClient } from "@/hooks/useReassignClient";
import { useAdminProfessionals } from "@/hooks/useAdminProfessionals";
import { useAuth } from "@/hooks/useAuth";
import { Crown } from "lucide-react";

interface ReassignClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  currentProfessionalId?: string;
}

export const ReassignClientDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  currentProfessionalId,
}: ReassignClientDialogProps) => {
  const { data: professionals } = useAdminProfessionals();
  const { user } = useAuth();
  const reassignMutation = useReassignClient();

  const form = useForm<ReassignClient>({
    resolver: zodResolver(reassignClientSchema),
    defaultValues: {
      client_id: clientId,
      new_personal_id: "",
      change_reason: "",
    },
  });

  const onSubmit = async (data: ReassignClient) => {
    await reassignMutation.mutateAsync({
      ...data,
      change_reason: data.change_reason,
    });
    form.reset();
    onOpenChange(false);
  };

  const availableProfessionals = professionals?.filter(
    (prof) => prof.id !== currentProfessionalId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reatribuir Cliente</DialogTitle>
          <DialogDescription>
            Atribuir <strong>{clientName}</strong> a um novo profissional
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_personal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Profissional</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um profissional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {user && (
                        <SelectItem value={user.id}>
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            Eu mesmo (Admin)
                          </div>
                        </SelectItem>
                      )}
                      {availableProfessionals?.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.full_name} ({prof.active_clients_count} clientes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="change_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Transferência</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explique o motivo da reatribuição..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={reassignMutation.isPending}>
                {reassignMutation.isPending ? "Reatribuindo..." : "Confirmar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
