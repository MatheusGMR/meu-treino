import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useClientAnamnesis } from "@/hooks/useAnamnesis";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Shield,
  Activity,
  Clock,
  ArrowRight,
  Loader2,
  Dumbbell,
  Heart,
  Flame,
  Stretch as StretchIcon,
} from "lucide-react";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";

const NIVEL_LABEL: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediária",
  avancado: "Avançada",
};

const INS_LABEL: Record<string, string> = {
  I1: "Confiante",
  I2: "Um pouco insegura",
  I3: "Precisa de mais apoio",
};

const DOR_LABEL: Record<string, string> = {
  D0: "Sem dor",
  D1: "Leve",
  D2: "Moderada",
  D3: "Limitante",
};

const OnboardingSummary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useFunnelTracking();
  const { data, isLoading } = useClientAnamnesis(user?.id || "");

  useEffect(() => {
    track("onboarding_summary_view");
  }, []);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const a: any = data.anamnesis || {};
  const profile = data.profileDetails;
  const nivel = NIVEL_LABEL[a.nivel_experiencia_norm || a.nivel_experiencia || "iniciante"];
  const seg = INS_LABEL[a.ins_cat] || "—";
  const dor = DOR_LABEL[a.dor_cat] || "Sem dor";
  const tempo = a.tempo_disponivel || "—";
  const objetivo = a.primary_goal || profile?.name || "Saúde e bem-estar";
  const dores: string[] = a.pain_locations || [];

  const sumario =
    `Vamos começar com sessões de ${tempo} ` +
    (a.dor_cat && a.dor_cat !== "D0"
      ? `priorizando o cuidado com ${dores.join(", ") || "os pontos sensíveis"} `
      : `focadas em ${objetivo.toLowerCase()} `) +
    `e no seu ritmo (perfil ${seg.toLowerCase()}).`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <img src={meuTreinoLogo} alt="Meu Treino" className="h-8 rounded-lg" />
      </div>

      <div className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="w-4 h-4" />
              Tudo pronto
            </div>
            <h1 className="text-3xl font-bold">Aqui está o que entendi sobre você 🤝</h1>
            <p className="text-muted-foreground">{sumario}</p>
          </motion.div>

          {/* Cards do agente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            <SummaryCard icon={<Activity className="w-4 h-4" />} label="Experiência" value={nivel} />
            <SummaryCard icon={<Shield className="w-4 h-4" />} label="Segurança" value={seg} />
            <SummaryCard
              icon={<Heart className="w-4 h-4" />}
              label="Dor hoje"
              value={dores.length > 0 ? `${dor} (${dores.join(", ")})` : dor}
            />
            <SummaryCard icon={<Clock className="w-4 h-4" />} label="Tempo" value={tempo} />
            <SummaryCard
              icon={<Target className="w-4 h-4" />}
              label="Objetivo"
              value={objetivo}
              full
            />
          </motion.div>

          {/* Plano */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Seu plano: Protocolo Destravamento</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {profile?.description ||
                    "Programa progressivo de 36 sessões pensado para te tirar do zero com segurança e devolver o prazer de treinar."}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <PlanStat label="Duração" value="36 sessões" />
                  <PlanStat
                    label="Frequência"
                    value={profile?.recommended_frequency || "3x por semana"}
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                    A estrutura de cada sessão
                  </p>
                  <div className="space-y-2">
                    <BlockRow icon={<StretchIcon className="w-4 h-4" />} title="Mobilidade" desc="Aquece e prepara o corpo" />
                    <BlockRow icon={<Heart className="w-4 h-4" />} title="Fortalecimento" desc="Cuida das regiões sensíveis" />
                    <BlockRow icon={<Dumbbell className="w-4 h-4" />} title="Resistido" desc="Constrói força com segurança" />
                    <BlockRow icon={<Flame className="w-4 h-4" />} title="Alongamento" desc="Recupera e relaxa" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              className="w-full h-14 text-base gap-2"
              onClick={() => navigate("/client/checkout")}
            >
              Liberar meu protocolo
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Você poderá complementar suas informações depois, no seu perfil.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon,
  label,
  value,
  full,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  full?: boolean;
}) => (
  <Card className={full ? "col-span-2" : ""}>
    <CardContent className="p-4 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-semibold text-foreground text-sm">{value}</p>
    </CardContent>
  </Card>
);

const PlanStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-card/60 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-bold text-foreground">{value}</p>
  </div>
);

const BlockRow = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-card/60 border border-border">
    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  </div>
);

export default OnboardingSummary;
