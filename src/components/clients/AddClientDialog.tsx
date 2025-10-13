import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addClientSchema, type AddClient } from "@/lib/schemas/clientSchema";
import { useAddClient } from "@/hooks/useClients";
import { format } from "date-fns";

export const AddClientDialog = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const addClient = useAddClient();

  const form = useForm<AddClient>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      start_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = async (data: AddClient) => {
    await addClient.mutateAsync(data);
    setOpen(false);
    form.reset();
    setStep(1);
  };

  const nextStep = async () => {
    const isValid = await form.trigger(
      step === 1 ? ["email", "full_name", "password"] : step === 2 ? ["birth_date", "gender", "phone"] : undefined
    );
    if (isValid) setStep(step + 1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente - Etapa {step} de 3</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input id="full_name" {...form.register("full_name")} />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha Inicial *</Label>
                <Input id="password" type="password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" type="date" {...form.register("birth_date")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Sexo</Label>
                <Select onValueChange={(value) => form.setValue("gender", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                <Input id="emergency_contact" {...form.register("emergency_contact")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                <Input id="emergency_phone" {...form.register("emergency_phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_conditions">Condições Médicas</Label>
                <Textarea id="medical_conditions" {...form.register("medical_conditions")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Objetivos</Label>
                <Textarea id="goals" {...form.register("goals")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início *</Label>
                <Input id="start_date" type="date" {...form.register("start_date")} />
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={nextStep}>
                Próximo
              </Button>
            ) : (
              <Button type="submit" disabled={addClient.isPending}>
                {addClient.isPending ? "Criando..." : "Criar Cliente"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
