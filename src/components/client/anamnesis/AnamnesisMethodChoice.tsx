import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Mic } from "lucide-react";
import logoJmFull from "@/assets/logo-jm-full.png";

interface AnamnesisMethodChoiceProps {
  onChooseWritten: () => void;
  onChooseVoice: () => void;
}

export const AnamnesisMethodChoice = ({ onChooseWritten, onChooseVoice }: AnamnesisMethodChoiceProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img src={logoJmFull} alt="Logo" className="h-16 mx-auto mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Vamos te conhecer melhor! 🎯
          </h1>
          <p className="text-white/80 text-sm sm:text-base">
            Escolha como prefere responder as perguntas da anamnese
          </p>
        </div>

        {/* Voice Option - Primary */}
        <Card
          onClick={onChooseVoice}
          className="cursor-pointer border-2 border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.02] group"
        >
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                Conversar com o Júnior 🎙️
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Nosso assistente de voz fará as perguntas e você responde naturalmente — como uma conversa.
              </p>
              <span className="inline-block mt-2 text-xs font-semibold text-white/60 bg-white/10 px-3 py-1 rounded-full">
                ⚡ Recomendado · ~5 min
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Written Option - Secondary */}
        <Card
          onClick={onChooseWritten}
          className="cursor-pointer border-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01] group"
        >
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/15 transition-colors">
              <ClipboardList className="w-7 h-7 text-white/80" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white/90 mb-1">
                Formulário escrito ✍️
              </h3>
              <p className="text-white/60 text-sm">
                Preencha as perguntas no seu ritmo, de forma escrita.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
