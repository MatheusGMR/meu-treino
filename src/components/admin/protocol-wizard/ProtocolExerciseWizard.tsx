import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ProtocolExercise,
  useProtocolBank,
  useUpsertProtocolExercise,
} from "@/hooks/useProtocolBank";
import {
  BlockCode,
  EquipCode,
  LevelCode,
  SafetyCode,
  SEG_MAP,
} from "@/lib/protocol/exerciseTaxonomy";
import { WizardStepper } from "./WizardStepper";
import { StepNome } from "./StepNome";
import { StepBloco } from "./StepBloco";
import { StepEquipamento } from "./StepEquipamento";
import { StepNivel } from "./StepNivel";
import { StepDetalhes } from "./StepDetalhes";
import { StepConfirmar } from "./StepConfirmar";
import { StepSucesso } from "./StepSucesso";

interface Props {
  exercise?: ProtocolExercise | null;
  onClose: () => void;
  /** true = exercício do Protocolo JMP; false = biblioteca regular. Default: true */
  protocolOnly?: boolean;
}

type FormState = Partial<ProtocolExercise> & {
  movement_vector?: string | null;
  _level?: LevelCode | "";
};

export const ProtocolExerciseWizard = ({ exercise, onClose, protocolOnly = true }: Props) => {
  const upsert = useUpsertProtocolExercise();
  const { data: allBank } = useProtocolBank();

  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [form, setForm] = useState<FormState>({});

  // Inicializa o formulário (modo edição preenche tudo, modo novo zera)
  useEffect(() => {
    if (exercise) {
      // Edição: preenche o que tiver e marca todos os passos como done
      setForm({
        ...exercise,
        movement_vector: (exercise as any).movement_vector ?? null,
        _level: ((exercise as any).difficulty_code as LevelCode) ?? "",
      });
      setGeneratedId(exercise.external_id ?? "");
      setDone([0, 1, 2, 3, 4]);
      setStep(5);
    } else {
      setForm({
        name: "",
        block: null,
        kind: "PAI",
        pain_region: "L0",
        treino_letra: null,
        bloco_protocolo: 1,
        is_primary: false,
        is_fixed_base: false,
        safety_level: null,
        protocol_only: protocolOnly,
        exercise_group: "Outro",
        exercise_type: "Musculação",
        parent_exercise_id: null,
        video_url: null,
        primary_muscle: "",
        movement_vector: null,
        _level: "",
      });
      setStep(0);
      setDone([]);
      setSaved(false);
      setGeneratedId("");
    }
  }, [exercise]);

  const patch = (p: Partial<FormState>) => setForm((prev) => ({ ...prev, ...p }));
  const markDone = (s: number) => setDone((prev) => [...new Set([...prev, s])]);

  const possibleParents = useMemo(
    () =>
      (allBank ?? []).filter(
        (e) =>
          e.kind === "PAI" && e.bloco_protocolo === form.bloco_protocolo && e.id !== form.id
      ),
    [allBank, form.bloco_protocolo, form.id]
  );

  const fetchNextId = async (
    block: BlockCode,
    equip: EquipCode,
    safety: SafetyCode,
    level: LevelCode
  ) => {
    const { data, error } = await supabase.rpc("next_protocol_exercise_seq" as any, {
      _block: block,
      _equip: equip,
      _safety: safety,
      _level: level,
    });
    if (error || !data) {
      // fallback local
      return `${block}${equip}${safety}${level}001`;
    }
    return String(data);
  };

  const goNext = async () => {
    markDone(step);
    if (step === 4) {
      // gera ID antes de mostrar Confirmar
      const id = await fetchNextId(
        form.block as BlockCode,
        ((form as any)._equip ?? "") as EquipCode || (form as any)._equip,
        form.safety_level as SafetyCode,
        form._level as LevelCode
      );
      setGeneratedId(exercise?.external_id ?? id);
    }
    setStep((s) => s + 1);
  };

  const handleEquipChange = (equip: EquipCode, safety: SafetyCode) => {
    const segDesc = SEG_MAP[equip];
    patch({
      safety_level: safety,
      ...(({ _equip: equip } as any) as Partial<FormState>),
    });
    // hack-friendly: armazena _equip dentro do form
    setForm((prev) => ({ ...prev, safety_level: safety, _equip: equip } as any));
  };

  const handleSave = async () => {
    const payload: any = {
      ...form,
      external_id: generatedId,
      difficulty_code: form._level,
      protocol_only: protocolOnly,
    };
    delete payload._level;
    delete payload._equip;
    await upsert.mutateAsync(payload);
    setSaved(true);
  };

  const reset = () => {
    setStep(0);
    setDone([]);
    setSaved(false);
    setGeneratedId("");
    setForm({
      name: "",
      block: null,
      kind: "PAI",
      pain_region: "L0",
      treino_letra: null,
      bloco_protocolo: 1,
      is_primary: false,
      is_fixed_base: false,
      safety_level: null,
      protocol_only: true,
      exercise_group: "Outro",
      exercise_type: "Musculação",
      parent_exercise_id: null,
      video_url: null,
      primary_muscle: "",
      movement_vector: null,
      _level: "",
    });
  };

  const block = (form.block ?? "") as BlockCode | "";
  const equip = ((form as any)._equip ?? "") as EquipCode | "";
  const safety = (form.safety_level ?? "") as SafetyCode | "";
  const level = (form._level ?? "") as LevelCode | "";

  return (
    <div className="space-y-5">
      {!saved && <WizardStepper current={step} done={done} onJump={(s) => setStep(s)} />}

      <div className="rounded-2xl border border-border bg-card p-5">
        {step === 0 && (
          <StepNome
            value={form.name ?? ""}
            onChange={(v) => patch({ name: v })}
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <StepBloco
            value={block}
            onChange={(b) =>
              setForm((prev) => ({
                ...prev,
                block: b as any,
                _equip: undefined,
                safety_level: null,
              } as any))
            }
            onPrev={() => setStep(0)}
            onNext={goNext}
          />
        )}
        {step === 2 && block && (
          <StepEquipamento
            block={block}
            equip={equip}
            onChange={handleEquipChange}
            onPrev={() => setStep(1)}
            onNext={goNext}
          />
        )}
        {step === 3 && (
          <StepNivel
            value={level}
            onChange={(l) => patch({ _level: l })}
            onPrev={() => setStep(2)}
            onNext={goNext}
          />
        )}
        {step === 4 && (
          <StepDetalhes
            form={form}
            onChange={patch}
            possibleParents={possibleParents}
            onPrev={() => setStep(3)}
            onNext={goNext}
          />
        )}
        {step === 5 && !saved && block && equip && safety && level && (
          <StepConfirmar
            form={
              { ...form, _block: block, _equip: equip, _safety: safety, _level: level } as any
            }
            generatedId={generatedId}
            onPrev={() => setStep(4)}
            onSave={handleSave}
            saving={upsert.isPending}
          />
        )}
        {step === 5 && saved && (
          <StepSucesso generatedId={generatedId} onAddAnother={reset} onClose={onClose} />
        )}
      </div>
    </div>
  );
};
