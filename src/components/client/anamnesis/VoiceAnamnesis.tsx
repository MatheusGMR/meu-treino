import { useState, useCallback, useRef } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react";
import { AnamnesisCompletionScreen } from "@/components/client/AnamnesisCompletionScreen";

const AGENT_ID = "agent_2701kn7m5mm3fz990vpxgs8a9gwz";

const JUNIOR_SYSTEM_PROMPT = `Você é o Júnior, um assistente de anamnese por voz da plataforma Meu Treino. Sua missão é conduzir uma conversa natural e acolhedora com o cliente para coletar todas as informações necessárias para montar o treino personalizado.

REGRAS IMPORTANTES:
- Seja simpático, empático e profissional
- Faça uma pergunta por vez, aguardando a resposta antes de prosseguir
- Adapte a linguagem ao nível do cliente
- Se o cliente não souber responder, ajude com exemplos
- Não pule nenhum pilar — todos são importantes
- Ao final, faça um breve resumo e agradeça

ROTEIRO DE PERGUNTAS (siga esta ordem):

**PILAR 1 - IDENTIFICAÇÃO:**
1. Qual a sua idade?
2. Qual o seu gênero? (Masculino, Feminino, Não-binário, Prefiro não dizer)
3. Qual a sua profissão?
4. Qual seu contato preferido? (WhatsApp ou email)
5. Quantas horas por dia você fica sentado? (Menos de 2h, 2-4h, 4-6h, 6-8h, Mais de 8h)

**PILAR 2 - COMPOSIÇÃO CORPORAL:**
6. Qual o seu peso atual em quilos?
7. Qual a sua altura em centímetros?
8. Como você se enxerga hoje? (Abaixo do peso, Peso normal, Sobrepeso, Obesidade, Não sei avaliar)
9. Quais regiões do corpo você gostaria de melhorar? (Peito, Costas, Ombros, Braços, Abdômen, Quadríceps, Posterior de coxa, Glúteos, Panturrilhas, Mobilidade, Postura)

**PILAR 3 - HISTÓRICO DE TREINO:**
10. Você treina atualmente? (Sim/Não)
11. Com que frequência treina por semana?
12. Que tipos de treino já fez? (Musculação, Funcional, Crossfit, Corrida, Lutas, Pilates, Yoga, HIIT, Esportes coletivos)
13. Se está parado, há quanto tempo? (Menos de 1 mês, 1-3 meses, 3-6 meses, 6-12 meses, Mais de 1 ano)

**PILAR 4 - LIMITAÇÕES E SEGURANÇA:**
14. Sente alguma dor atualmente? Se sim, descreva.
15. De 0 a 10, qual a intensidade dessa dor?
16. Já teve alguma lesão? Se sim, qual?
17. Já fez alguma cirurgia? Se sim, qual?
18. Possui alguma restrição médica?
19. Possui liberação médica para treinar?
20. Tem problemas em articulações? (Lombar, Joelho, Quadril, Ombro, Cervical, Tornozelo, Nenhum)

**PILAR 5 - OBJETIVOS:**
21. Qual o seu objetivo principal? (Emagrecimento, Hipertrofia, Condicionamento, Saúde, Performance, Mobilidade)
22. Tem algum objetivo secundário?
23. Em quanto tempo espera alcançar? (30 dias, 3 meses, 6 meses, 1 ano, Sem prazo)
24. De 1 a 5, qual a prioridade disso na sua vida?
25. Treina para algum evento específico? (Casamento, competição, viagem, etc.)

**PILAR 6 - HÁBITOS E COMPORTAMENTO:**
26. Quantas horas dorme por noite?
27. Como avalia sua alimentação? (Muito ruim, Ruim, Regular, Boa, Muito boa)
28. Quanto de água bebe por dia?
29. Qual seu nível de estresse? (Baixo, Moderado, Alto)
30. Consome álcool ou cigarro?
31. O que mais te motiva a treinar? (Resultados, Saúde, Estética, Disciplina, Bem-estar, Performance)
32. Prefere instruções detalhadas ou direto ao ponto?

**PILAR 7 - LOGÍSTICA:**
33. Onde pretende treinar? (Academia, Condomínio, Casa, Estúdio, Ar livre)
34. Quanto tempo disponível por sessão? (30min, 45min, 60min, Mais de 60min)
35. Qual horário prefere? (Manhã, Tarde, Noite, Flexível)
36. Que tipo de treino prefere? (Musculação, Funcional, Cardio, Mobilidade, HIIT, Mix combinado)

**PILAR 8 - COMENTÁRIOS FINAIS:**
37. Tem mais alguma coisa que gostaria de contar que não foi perguntado?

Ao finalizar, diga algo como: "Muito obrigado pelas respostas! Agora vou processar tudo para montar o melhor treino pra você. Pode encerrar a conversa quando quiser."

PRIMEIRA MENSAGEM: Comece se apresentando: "Olá! Eu sou o Júnior, assistente da plataforma Meu Treino. Vou te fazer algumas perguntas pra gente conhecer melhor você e montar o treino ideal. Vamos lá?"`;

const VoiceAnamnesisInner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [trialWorkoutReady, setTrialWorkoutReady] = useState(false);
  const messagesRef = useRef<Array<{ role: string; content: string }>>([]);
  const conversationStartedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const showCompletionRef = useRef(false);
  const connectedAtRef = useRef<number>(0);
  const [lastMessage, setLastMessage] = useState("");

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Júnior");
      conversationStartedRef.current = true;
      connectedAtRef.current = Date.now();
    },
    onDisconnect: () => {
      console.log("Disconnected from Júnior");
      const connectionDuration = Date.now() - connectedAtRef.current;
      // Only process if the conversation lasted at least 5 seconds
      if (
        conversationStartedRef.current &&
        !isProcessingRef.current &&
        !showCompletionRef.current &&
        connectionDuration > 5000
      ) {
        handleConversationEnd();
      } else if (connectionDuration <= 5000 && conversationStartedRef.current) {
        console.log("Connection too brief, ignoring disconnect");
      }
      conversationStartedRef.current = false;
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript" && message.user_transcription_event?.user_transcript) {
        const text = message.user_transcription_event.user_transcript;
        messagesRef.current.push({ role: "user", content: text });
        setLastMessage(text);
      }
      if (message.type === "agent_response" && message.agent_response_event?.agent_response) {
        const text = message.agent_response_event.agent_response;
        messagesRef.current.push({ role: "assistant", content: text });
        setLastMessage(text);
      }
    },
    onError: (error: any) => {
      console.error("Conversation error:", error);
      toast({
        variant: "destructive",
        title: "Erro na conversa",
        description: "Ocorreu um erro. Tente novamente.",
      });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        { body: { agentId: AGENT_ID } }
      );

      if (error || !data?.signed_url) {
        throw new Error("Não foi possível conectar ao Júnior");
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
        overrides: {
          agent: {
            prompt: {
              prompt: JUNIOR_SYSTEM_PROMPT,
            },
            firstMessage: "Olá! Eu sou o Júnior, assistente da plataforma Meu Treino. Vou te fazer algumas perguntas pra gente conhecer melhor você e montar o treino ideal. Vamos lá?",
          },
        },
      });
    } catch (error: any) {
      console.error("Failed to start:", error);
      toast({
        variant: "destructive",
        title: "Erro ao conectar",
        description: error.message || "Verifique a permissão do microfone.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const handleConversationEnd = async () => {
    if (messagesRef.current.length < 3) {
      toast({
        title: "Conversa muito curta",
        description: "Converse um pouco mais com o Júnior para completar a anamnese.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "process-voice-anamnesis",
        { body: { messages: messagesRef.current } }
      );

      if (error) throw error;

      // Calculate profile
      let retries = 3;
      let profileCalculated = false;
      while (retries > 0 && !profileCalculated) {
        const { error: profileCalcError } = await supabase.functions.invoke(
          "calculate-anamnesis-profile",
          { body: { clientId: user!.id } }
        );
        if (profileCalcError) {
          retries--;
          if (retries === 0) {
            toast({
              title: "Erro ao processar",
              description: "Não foi possível calcular seu perfil. Entre em contato com seu personal.",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          profileCalculated = true;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["has-workout", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["anamnesis-status", user?.id] });

      setShowCompletion(true);
      setIsGeneratingWorkout(true);

      // Generate trial workout
      try {
        await supabase.functions.invoke("generate-trial-workout", {
          body: { clientId: user!.id },
        });
      } catch (e) {
        console.error("Trial workout error:", e);
      }

      // Send welcome email
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            clientId: user!.id,
            platformUrl: window.location.origin + "/auth/login",
          },
        });
      } catch (e) {
        console.error("Email error:", e);
      }

      await queryClient.invalidateQueries({ queryKey: ["has-workout", user?.id] });
      setTrialWorkoutReady(true);
      setIsGeneratingWorkout(false);
    } catch (error: any) {
      console.error("Processing error:", error);
      toast({
        title: "Erro ao processar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const userName = user?.user_metadata?.full_name || "Aluno";

  if (showCompletion) {
    return (
      <AnamnesisCompletionScreen
        userName={userName}
        isGeneratingWorkout={isGeneratingWorkout}
        trialWorkoutReady={trialWorkoutReady}
        onContinue={() => navigate("/client/dashboard", { replace: true })}
      />
    );
  }

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-accent flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Avatar / Visual */}
        <div className="relative mx-auto w-40 h-40">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              isSpeaking
                ? "bg-white/20 animate-ping"
                : isConnected
                ? "bg-white/10"
                : "bg-white/5"
            }`}
          />
          <div
            className={`absolute inset-2 rounded-full transition-all duration-500 ${
              isSpeaking
                ? "bg-white/30 scale-110"
                : isConnected
                ? "bg-white/15"
                : "bg-white/10"
            }`}
          />
          <div className="absolute inset-4 rounded-full bg-white/20 flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="w-16 h-16 text-white animate-spin" />
            ) : isConnected ? (
              <Mic className={`w-16 h-16 text-white transition-transform duration-300 ${isSpeaking ? "scale-125" : ""}`} />
            ) : (
              <MicOff className="w-16 h-16 text-white/60" />
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isProcessing
              ? "Processando..."
              : isConnected
              ? isSpeaking
                ? "Júnior está falando..."
                : "Sua vez de falar"
              : "Júnior"}
          </h2>
          <p className="text-white/70 text-sm">
            {isProcessing
              ? "Estamos analisando suas respostas. Aguarde um momento..."
              : isConnected
              ? "Responda naturalmente — o Júnior vai guiar a conversa"
              : "Seu assistente de anamnese por voz"}
          </p>
        </div>

        {/* Transcript preview */}
        {isConnected && lastMessage && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-h-32 overflow-y-auto">
            <p className="text-white/80 text-sm text-left">
              {lastMessage}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isConnected && !isProcessing ? (
            <Button
              size="lg"
              onClick={startConversation}
              disabled={isConnecting}
              className="rounded-full w-20 h-20 bg-white text-primary hover:bg-white/90 shadow-2xl"
            >
              {isConnecting ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Phone className="w-8 h-8" />
              )}
            </Button>
          ) : isConnected ? (
            <Button
              size="lg"
              onClick={stopConversation}
              variant="destructive"
              className="rounded-full w-20 h-20 shadow-2xl"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
          ) : null}
        </div>

        {!isConnected && !isProcessing && (
          <p className="text-white/50 text-xs">
            {isConnecting ? "Conectando ao Júnior..." : "Toque para iniciar a conversa"}
          </p>
        )}
      </div>
    </div>
  );
};

export const VoiceAnamnesis = () => (
  <ConversationProvider>
    <VoiceAnamnesisInner />
  </ConversationProvider>
);
