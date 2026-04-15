import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dumbbell, Users } from "lucide-react";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";
import { toast } from "sonner";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"client" | "personal">("client");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, fullName, role);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    
    if (role === "client") {
      toast.success("Cadastro realizado! Agora queremos conhecer você melhor 😊");
      navigate("/client/anamnesis");
    } else {
      toast.success("Cadastro realizado com sucesso!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-lg border border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={meuTreinoLogo} 
              alt="Meu Treino"
              className="h-20 w-auto object-contain rounded-xl"
            />
          </div>
          <CardTitle className="text-2xl text-foreground">Criar Conta</CardTitle>
          <CardDescription>Escolha seu perfil e comece sua jornada</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                placeholder="João Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <Label>Tipo de Perfil</Label>
              <RadioGroup value={role} onValueChange={(value: any) => setRole(value)}>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                  <RadioGroupItem value="client" id="client" />
                  <Label htmlFor="client" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold">Cliente</p>
                      <p className="text-xs text-muted-foreground">Treinar e acompanhar progresso</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Dumbbell className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold">Personal Trainer</p>
                      <p className="text-xs text-muted-foreground">Gerenciar clientes e treinos</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold hover:-translate-y-0.5 transition-all duration-200 hover:shadow-lg" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Já tem uma conta?{" "}
              <Link to="/auth/login" className="text-primary hover:underline font-semibold">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
