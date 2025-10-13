import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { RoleCard } from "@/components/RoleCard";
import { Crown, Dumbbell, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      
      <main>
        <Hero />
        
        <Features />
        
        {/* Roles Section */}
        <section id="roles" className="py-24">
          <div className="container px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Feito Para <span className="bg-gradient-primary bg-clip-text text-transparent">Todos</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Escolha sua jornada e comece a transformação hoje
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <RoleCard
                title="Cliente"
                description="Alcance seus objetivos com treinos personalizados"
                icon={Users}
                features={[
                  "Acesso a treinos personalizados",
                  "Acompanhamento de progresso",
                  "Chat direto com seu trainer",
                  "Histórico de treinos completo",
                  "Metas e conquistas",
                ]}
                variant="default"
              />

              <RoleCard
                title="Personal Trainer"
                description="Gerencie seus clientes de forma profissional"
                icon={Dumbbell}
                features={[
                  "Dashboard completo de clientes",
                  "Criação de treinos ilimitados",
                  "Análise de desempenho",
                  "Agendamento integrado",
                  "Ferramentas de comunicação",
                ]}
                variant="primary"
              />

              <RoleCard
                title="Administrador"
                description="Controle total da plataforma"
                icon={Crown}
                features={[
                  "Gestão de usuários e permissões",
                  "Relatórios e analytics",
                  "Configurações do sistema",
                  "Suporte e monitoramento",
                  "Backup e segurança",
                ]}
                variant="accent"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-10" />
          <div className="container px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Pronto Para Começar?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Junte-se a centenas de profissionais que já transformam vidas através da nossa plataforma
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button className="px-8 py-4 rounded-lg bg-gradient-primary text-primary-foreground font-bold text-lg shadow-glow hover:shadow-xl hover:scale-105 transition-all duration-300">
                  Cadastre-se Gratuitamente
                </button>
                <button className="px-8 py-4 rounded-lg border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground font-bold text-lg transition-all duration-300">
                  Falar com Vendas
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Junior Mello Treinamentos</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
