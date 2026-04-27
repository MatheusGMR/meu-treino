import { useState } from "react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, BookOpen, Grid3x3, Pencil, Plus, Search, Trash2, Library } from "lucide-react";
import {
  ProtocolExercise,
  useDeleteProtocolExercise,
  useProtocolBank,
} from "@/hooks/useProtocolBank";
import { ProtocolExerciseDialog } from "@/components/admin/ProtocolExerciseDialog";
import { VolumeMatrixTab } from "@/components/admin/VolumeMatrixTab";

const ProtocolBank = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [bloco, setBloco] = useState<string>("all");
  const [treino, setTreino] = useState<string>("all");
  const [block, setBlock] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProtocolExercise | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProtocolExercise | null>(null);

  const { data: rows, isLoading } = useProtocolBank({
    bloco: bloco === "all" ? undefined : Number(bloco),
    treino: treino === "all" ? undefined : (treino as "A" | "B"),
    block: block === "all" ? undefined : block,
    kind: kind === "all" ? undefined : (kind as "PAI" | "SUB"),
    search: search || undefined,
  });
  const deleteMut = useDeleteProtocolExercise();

  const grouped = (rows ?? []).reduce<Record<string, ProtocolExercise[]>>((acc, ex) => {
    const key = `Bloco ${ex.bloco_protocolo ?? "?"} · Treino ${ex.treino_letra ?? "—"} · ${ex.block ?? "—"}`;
    (acc[key] ??= []).push(ex);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-background">
      <aside className={collapsed ? "w-16" : "w-64"}>
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Library className="w-6 h-6 text-primary" /> Banco do Protocolo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Cadastro PAI/SUB usado pelo motor determinístico de seleção de exercícios.
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Novo exercício
            </Button>
          </div>

          <Tabs defaultValue="bank">
            <TabsList>
              <TabsTrigger value="bank" className="gap-2">
                <BookOpen className="w-4 h-4" /> Exercícios PAI/SUB
              </TabsTrigger>
              <TabsTrigger value="matrix" className="gap-2">
                <Grid3x3 className="w-4 h-4" /> Matriz de Volume (30 saídas)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bank" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filtros</CardTitle>
                  <CardDescription>
                    Combine filtros para isolar PAI/SUB por bloco, treino e região.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome…"
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={bloco} onValueChange={setBloco}>
                    <SelectTrigger><SelectValue placeholder="Bloco" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os blocos</SelectItem>
                      {[1, 2, 3, 4].map((b) => (
                        <SelectItem key={b} value={String(b)}>Bloco {b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={treino} onValueChange={setTreino}>
                    <SelectTrigger><SelectValue placeholder="Treino" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Treino A & B</SelectItem>
                      <SelectItem value="A">Treino A</SelectItem>
                      <SelectItem value="B">Treino B</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={block} onValueChange={setBlock}>
                    <SelectTrigger><SelectValue placeholder="Bloco didático" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="MOB">MOB · Mobilidade</SelectItem>
                      <SelectItem value="FORT">FORT · Fortalecimento</SelectItem>
                      <SelectItem value="MS">MS · Resistido MMSS</SelectItem>
                      <SelectItem value="MI">MI · Resistido MMII</SelectItem>
                      <SelectItem value="CARD">CARD · Cardio</SelectItem>
                      <SelectItem value="ALONG">ALONG · Alongamento</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={kind} onValueChange={setKind}>
                    <SelectTrigger><SelectValue placeholder="PAI/SUB" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">PAI & SUB</SelectItem>
                      <SelectItem value="PAI">PAI</SelectItem>
                      <SelectItem value="SUB">SUB</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {isLoading ? (
                <Skeleton className="h-64" />
              ) : !rows || rows.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-3">
                    <Library className="w-12 h-12 text-muted-foreground mx-auto" />
                    <h3 className="font-semibold">Banco do Protocolo vazio</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Cadastre exercícios PAI (padrão) e SUB (substituto por dor) para que o motor
                      determinístico consiga montar sessões automaticamente.
                    </p>
                    <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
                      <Plus className="w-4 h-4" /> Cadastrar primeiro exercício
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(grouped).map(([group, items]) => (
                  <Card key={group}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">
                        {group} <span className="text-foreground">· {items.length}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {items.map((ex) => (
                        <div
                          key={ex.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">{ex.name}</p>
                              {ex.kind && (
                                <Badge variant={ex.kind === "PAI" ? "default" : "secondary"} className="text-[10px]">
                                  {ex.kind}
                                </Badge>
                              )}
                              {ex.is_primary && <Badge variant="outline" className="text-[10px]">primário</Badge>}
                              {ex.is_fixed_base && <Badge variant="outline" className="text-[10px]">base fixa</Badge>}
                              {ex.pain_region && (
                                <Badge variant="outline" className="text-[10px]">{ex.pain_region}</Badge>
                              )}
                              {ex.safety_level && (
                                <Badge variant="outline" className="text-[10px]">{ex.safety_level}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ex.external_id || ex.exercise_id || "sem ID JMP"} ·{" "}
                              {ex.primary_muscle || ex.exercise_group}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditing(ex); setDialogOpen(true); }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelete(ex)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="matrix">
              <VolumeMatrixTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ProtocolExerciseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        exercise={editing}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do banco do Protocolo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelete) await deleteMut.mutateAsync(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProtocolBank;
