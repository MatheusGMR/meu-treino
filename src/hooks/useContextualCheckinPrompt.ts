import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CheckinContext =
  | "manha_util"
  | "manha_fds"
  | "tarde_util"
  | "tarde_fds"
  | "noite_util"
  | "noite_fds"
  | "madrugada";

interface ContextualPrompt {
  contexto: CheckinContext;
  pergunta: string;
  hora: string; // HH:MM:SS local America/Sao_Paulo
  dia_util: boolean;
  loading: boolean;
}

const PROMPTS: Record<CheckinContext, string> = {
  manha_util: "Bom dia! Como acordou hoje? Dormiu bem antes do trabalho?",
  manha_fds: "Bom dia! Como está se sentindo neste fim de semana?",
  tarde_util: "Como está sendo o dia de trabalho? Cansaço, dor, estresse?",
  tarde_fds: "Como está a tarde? Animado pro treino?",
  noite_util: "Dia puxado? Conta como está chegando pro treino.",
  noite_fds: "Como foi o dia? Pronto pra movimentar?",
  madrugada: "Treino noturno! Como está o corpo agora?",
};

function detectContext(date: Date, rotinaHibrida: boolean): {
  contexto: CheckinContext;
  hora: string;
  dia_util: boolean;
} {
  // Converte para America/Sao_Paulo
  const sp = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const h = sp.getHours();
  const dow = sp.getDay(); // 0=dom, 6=sab
  const dia_util = dow >= 1 && dow <= 5;
  const hora = `${String(h).padStart(2, "0")}:${String(sp.getMinutes()).padStart(2, "0")}:00`;

  let contexto: CheckinContext;
  if (h >= 0 && h < 5) contexto = "madrugada";
  else if (h >= 5 && h < 12) contexto = dia_util ? "manha_util" : "manha_fds";
  else if (h >= 12 && h < 18) contexto = dia_util ? "tarde_util" : "tarde_fds";
  else contexto = dia_util ? "noite_util" : "noite_fds";

  // Se rotina_tipo do cliente é "hibrida" (trabalha fim de semana), trata fds como útil
  if (rotinaHibrida && !dia_util && contexto !== "madrugada") {
    contexto = contexto.replace("_fds", "_util") as CheckinContext;
  }

  return { contexto, hora, dia_util };
}

export function useContextualCheckinPrompt(): ContextualPrompt {
  const { user } = useAuth();
  const [rotinaHibrida, setRotinaHibrida] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    supabase
      .from("anamnesis")
      .select("rotina_tipo")
      .eq("client_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRotinaHibrida(data?.rotina_tipo === "hibrida");
        setLoading(false);
      });
  }, [user?.id]);

  const { contexto, hora, dia_util } = detectContext(new Date(), rotinaHibrida);
  return { contexto, pergunta: PROMPTS[contexto], hora, dia_util, loading };
}
