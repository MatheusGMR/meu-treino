import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Check, Copy, MessageCircle, Link as LinkIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addClientSchema, type AddClient } from "@/lib/schemas/clientSchema";
import { useAddClient } from "@/hooks/useClients";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export const AddClientDialog = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [successData, setSuccessData] = useState<{ clientId: string; clientName: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const addClient = useAddClient();

  const form = useForm<AddClient>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      start_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const getAnamnesisLink = (clientId: string) => {
    return `${window.location.origin}/client/anamnesis`;
  };

  const getLoginLink = () => {
    return `${window.location.origin}/auth/login`;
  };

  const onSubmit = async (data: AddClient) => {
    try {
      const result = await addClient.mutateAsync(data);
      setSuccessData({
        clientId: result.clientId,
        clientName: data.full_name,
        email: data.email,
      });
      setStep(4); // Go to success/share step
    } catch (err) {
      // Error is handled by onError in the mutation
    }
  };

  const handleCopyLink = () => {
    const loginLink = getLoginLink();
    navigator.clipboard.writeText(loginLink);
    setCopied(true);
    toast({ title: "Link copiado!", description: "O link foi copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!successData) return;
    const loginLink = getLoginLink();
    const message = encodeURIComponent(
      `Olá ${successData.clientName}! 🏋️‍♂️\n\n` +
      `Sua conta foi criada com sucesso no app de treinos.\n\n` +
      `📧 Email: ${successData.email}\n` +
      `🔗 Acesse aqui: ${loginLink}\n\n` +
      `Após o login, você será direcionado para preencher a anamnese — é rápido e essencial para montar o seu treino personalizado!\n\n` +
      `Qualquer dúvida, estou à disposição. 💪`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleClose = () => {
    setOpen(false);
    form.reset();
    setStep(1);
    setSuccessData(null);
    setCopied(false);
  };

  const nextStep = async () => {
    const isValid = await form.trigger(
      step === 1 ? ["email", "full_name", "password"] : step === 2 ? ["birth_date", "gender", "phone"] : undefined
    );
    if (isValid) setStep(step + 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step <= 3 ? `Adicionar Novo Cliente - Etapa ${step} de 3` : "Cliente Criado com Sucesso!"}
          </DialogTitle>
        </DialogHeader>

        {step <= 3 ? (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
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
                <Button
                  type="button"
                  disabled={addClient.isPending}
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {addClient.isPending ? "Criando..." : "Criar Cliente"}
                </Button>
              )}
            </div>
          </form>
        ) : (
          /* Step 4: Success + Share */
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {successData?.clientName} foi cadastrado!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Envie o link de acesso para que o cliente faça login e preencha a anamnese.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Link de acesso:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={getLoginLink()}
                  className="text-sm bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                📧 Email: <span className="font-medium">{successData?.email}</span>
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
              >
                <MessageCircle className="w-5 h-5" />
                Compartilhar via WhatsApp
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Fechar
              </Button>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                💡 Após o login, o cliente será direcionado automaticamente para a anamnese. 
                Ao concluir, você receberá uma notificação e poderá avaliar o perfil e atribuir o treino.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
