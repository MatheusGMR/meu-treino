import { useState, useCallback, useRef, useEffect } from "react";
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
  const [conversationStarted, setConversationStarted] = useState(false);
  const [statusText, setStatusText] = useState("Preparando...");

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Júnior");
      setConversationStarted(true);
      setStatusText("Conectado");
    },
    onDisconnect: () => {
      console.log("Disconnected from Júnior");
      if (conversationStarted && !isProcessing && !showCompletion) {
        handleConversationEnd();
      }
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript" && message.user_transcription_event?.user_transcript) {
        messagesRef.current.push({
          role: "user",
          content: message.user_transcription_event.user_transcript,
        });
      }
      if (message.type === "agent_response" && message.agent_response_event?.agent_response) {
        messagesRef.current.push({
          role: "assistant",
          content: message.agent_response_event.agent_response,
        });
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
    setStatusText("Processando suas respostas...");

    try {
      // Process voice data
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
          {/* Pulse ring when agent speaks */}
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
        {isConnected && messagesRef.current.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-h-32 overflow-y-auto">
            <p className="text-white/80 text-sm text-left">
              {messagesRef.current[messagesRef.current.length - 1]?.content}
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
