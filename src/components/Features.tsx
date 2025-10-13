import { Activity, BarChart3, Calendar, MessageSquare, Target, Users } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Treinos Personalizados",
    description: "Crie e gerencie programas de treino adaptados para cada cliente",
  },
  {
    icon: BarChart3,
    title: "Acompanhamento de Progresso",
    description: "Visualize evolução com gráficos e métricas detalhadas",
  },
  {
    icon: Calendar,
    title: "Agendamento Inteligente",
    description: "Organize sessões e mantenha sua agenda sempre atualizada",
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    description: "Centralize informações e histórico de todos os seus alunos",
  },
  {
    icon: MessageSquare,
    title: "Comunicação Direta",
    description: "Chat integrado para melhor conexão trainer-cliente",
  },
  {
    icon: Activity,
    title: "Métricas em Tempo Real",
    description: "Acompanhe desempenho e resultados instantaneamente",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Recursos <span className="bg-gradient-primary bg-clip-text text-transparent">Completos</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Tudo que você precisa para levar seus treinos ao próximo nível
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-card transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
