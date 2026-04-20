export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_alerts: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type_enum"]
          client_id: string
          created_at: string
          description: string | null
          id: string
          payload: Json | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity_enum"]
          status: Database["public"]["Enums"]["alert_status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          alert_type: Database["public"]["Enums"]["alert_type_enum"]
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          payload?: Json | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity_enum"]
          status?: Database["public"]["Enums"]["alert_status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type_enum"]
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payload?: Json | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity_enum"]
          status?: Database["public"]["Enums"]["alert_status_enum"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_communication_templates: {
        Row: {
          active: boolean | null
          created_at: string
          evitar: string[] | null
          id: string
          ins_cat: Database["public"]["Enums"]["inseguranca_categoria"] | null
          moment: Database["public"]["Enums"]["template_moment_enum"]
          perfil_primario:
            | Database["public"]["Enums"]["perfil_comportamental"]
            | null
          reforcar: string[] | null
          template: string
          tone: string | null
          updated_at: string
          verbos_chave: string[] | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          evitar?: string[] | null
          id?: string
          ins_cat?: Database["public"]["Enums"]["inseguranca_categoria"] | null
          moment: Database["public"]["Enums"]["template_moment_enum"]
          perfil_primario?:
            | Database["public"]["Enums"]["perfil_comportamental"]
            | null
          reforcar?: string[] | null
          template: string
          tone?: string | null
          updated_at?: string
          verbos_chave?: string[] | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          evitar?: string[] | null
          id?: string
          ins_cat?: Database["public"]["Enums"]["inseguranca_categoria"] | null
          moment?: Database["public"]["Enums"]["template_moment_enum"]
          perfil_primario?:
            | Database["public"]["Enums"]["perfil_comportamental"]
            | null
          reforcar?: string[] | null
          template?: string
          tone?: string | null
          updated_at?: string
          verbos_chave?: string[] | null
        }
        Relationships: []
      }
      agent_videos: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          mandatory_at_session: number | null
          recommended_for_dor_cat:
            | Database["public"]["Enums"]["dor_categoria"]
            | null
          recommended_for_ins_cat:
            | Database["public"]["Enums"]["inseguranca_categoria"]
            | null
          title: string
          updated_at: string
          video_code: string
          youtube_url: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          mandatory_at_session?: number | null
          recommended_for_dor_cat?:
            | Database["public"]["Enums"]["dor_categoria"]
            | null
          recommended_for_ins_cat?:
            | Database["public"]["Enums"]["inseguranca_categoria"]
            | null
          title: string
          updated_at?: string
          video_code: string
          youtube_url?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          mandatory_at_session?: number | null
          recommended_for_dor_cat?:
            | Database["public"]["Enums"]["dor_categoria"]
            | null
          recommended_for_ins_cat?:
            | Database["public"]["Enums"]["inseguranca_categoria"]
            | null
          title?: string
          updated_at?: string
          video_code?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      ai_agent_config: {
        Row: {
          config_type: string
          created_at: string | null
          id: string
          macro_instructions: Json | null
          owner_id: string
          personality: string | null
          system_prompt: string | null
          tone: string | null
          updated_at: string | null
        }
        Insert: {
          config_type?: string
          created_at?: string | null
          id?: string
          macro_instructions?: Json | null
          owner_id: string
          personality?: string | null
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string | null
        }
        Update: {
          config_type?: string
          created_at?: string | null
          id?: string
          macro_instructions?: Json | null
          owner_id?: string
          personality?: string | null
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_knowledge_files: {
        Row: {
          config_id: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_files_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_config"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis: {
        Row: {
          abandono_previo: boolean | null
          activity_level: string | null
          age: number | null
          alcool_cigarro: string | null
          alert_medical: boolean | null
          alimentacao: string | null
          altura_cm: number | null
          autoimagem: string | null
          autonomia: Database["public"]["Enums"]["autonomia_nivel"] | null
          calculated_at: string | null
          calculated_profile: string | null
          cirurgias: string | null
          client_id: string
          comentarios_finais: string | null
          completed_at: string | null
          compromisso: number | null
          condicao: Database["public"]["Enums"]["condicao_medica_flag"][] | null
          consumo_agua: string | null
          contato: string | null
          created_at: string | null
          current_body_type: number | null
          daily_sitting_hours: number | null
          desired_body_type: number | null
          dimension_scores: Json | null
          discipline_level: string | null
          dor_cat: Database["public"]["Enums"]["dor_categoria"] | null
          dor_local: string[] | null
          escala_dor: number | null
          estresse: string | null
          evento_especifico: string | null
          experiencia_previa: boolean | null
          frequencia_atual: string | null
          frequencia_esperada: number | null
          gender: string | null
          handles_challenges: string | null
          has_children: boolean | null
          has_injury_or_surgery: boolean | null
          has_joint_pain: boolean | null
          horario_preferido: string | null
          id: string
          imc_calculado: number | null
          imc_categoria: string | null
          injury_details: string | null
          injury_type: string | null
          ins_cat: Database["public"]["Enums"]["inseguranca_categoria"] | null
          lesoes: string | null
          liberacao_medica: string | null
          local_treino: string | null
          medical_restrictions: string[] | null
          medical_restrictions_details: string | null
          medicamento: string | null
          motivacao: string | null
          motivacao_real: string | null
          nivel_experiencia: string | null
          nutrition_quality: string | null
          objetivo_secundario: string | null
          pain_details: string | null
          pain_locations: string[] | null
          perfil_primario:
            | Database["public"]["Enums"]["perfil_comportamental"]
            | null
          periodo_preferido:
            | Database["public"]["Enums"]["periodo_preferido"]
            | null
          peso_kg: number | null
          prazo: string | null
          preferencia_instrucao: string | null
          previous_weight_training: boolean | null
          primary_goal: string | null
          prioridade: number | null
          profession: string | null
          profile_confidence_score: number | null
          regioes_que_deseja_melhorar: string[] | null
          restricao_medica: string | null
          rotina_tipo: Database["public"]["Enums"]["rotina_tipo"] | null
          secondary_goals: string[] | null
          sleep_quality: string | null
          sono_horas: string | null
          tempo_disponivel: string | null
          time_without_training: string | null
          tipo_treino_preferido: string | null
          tipos_de_treino_feitos: string[] | null
          training_location: string | null
          treina_atualmente: boolean | null
          updated_at: string | null
          user_vocab: string[] | null
          wants_personalized_plan: boolean | null
          water_intake: string | null
          work_shift: string | null
          work_type: string | null
          workout_preference: string | null
        }
        Insert: {
          abandono_previo?: boolean | null
          activity_level?: string | null
          age?: number | null
          alcool_cigarro?: string | null
          alert_medical?: boolean | null
          alimentacao?: string | null
          altura_cm?: number | null
          autoimagem?: string | null
          autonomia?: Database["public"]["Enums"]["autonomia_nivel"] | null
          calculated_at?: string | null
          calculated_profile?: string | null
          cirurgias?: string | null
          client_id: string
          comentarios_finais?: string | null
          completed_at?: string | null
          compromisso?: number | null
          condicao?:
            | Database["public"]["Enums"]["condicao_medica_flag"][]
            | null
          consumo_agua?: string | null
          contato?: string | null
          created_at?: string | null
          current_body_type?: number | null
          daily_sitting_hours?: number | null
          desired_body_type?: number | null
          dimension_scores?: Json | null
          discipline_level?: string | null
          dor_cat?: Database["public"]["Enums"]["dor_categoria"] | null
          dor_local?: string[] | null
          escala_dor?: number | null
          estresse?: string | null
          evento_especifico?: string | null
          experiencia_previa?: boolean | null
          frequencia_atual?: string | null
          frequencia_esperada?: number | null
          gender?: string | null
          handles_challenges?: string | null
          has_children?: boolean | null
          has_injury_or_surgery?: boolean | null
          has_joint_pain?: boolean | null
          horario_preferido?: string | null
          id?: string
          imc_calculado?: number | null
          imc_categoria?: string | null
          injury_details?: string | null
          injury_type?: string | null
          ins_cat?: Database["public"]["Enums"]["inseguranca_categoria"] | null
          lesoes?: string | null
          liberacao_medica?: string | null
          local_treino?: string | null
          medical_restrictions?: string[] | null
          medical_restrictions_details?: string | null
          medicamento?: string | null
          motivacao?: string | null
          motivacao_real?: string | null
          nivel_experiencia?: string | null
          nutrition_quality?: string | null
          objetivo_secundario?: string | null
          pain_details?: string | null
          pain_locations?: string[] | null
          perfil_primario?:
            | Database["public"]["Enums"]["perfil_comportamental"]
            | null
          periodo_preferido?:
            | Database["public"]["Enums"]["periodo_preferido"]
            | null
          peso_kg?: number | null
          prazo?: string | null
          preferencia_instrucao?: string | null
          previous_weight_training?: boolean | null
          primary_goal?: string | null
          prioridade?: number | null
          profession?: string | null
          profile_confidence_score?: number | null
          regioes_que_deseja_melhorar?: string[] | null
          restricao_medica?: string | null
          rotina_tipo?: Database["public"]["Enums"]["rotina_tipo"] | null
          secondary_goals?: string[] | null
          sleep_quality?: string | null
          sono_horas?: string | null
          tempo_disponivel?: string | null
          time_without_training?: string | null
          tipo_treino_preferido?: string | null
          tipos_de_treino_feitos?: string[] | null
          training_location?: string | null
          treina_atualmente?: boolean | null
          updated_at?: string | null
          user_vocab?: string[] | null
          wants_personalized_plan?: boolean | null
          water_intake?: string | null
          work_shift?: string | null
          work_type?: string | null
          workout_preference?: string | null
        }
        Update: {
          abandono_previo?: boolean | null
          activity_level?: string | null
          age?: number | null
          alcool_cigarro?: string | null
          alert_medical?: boolean | null
          alimentacao?: string | null
          altura_cm?: number | null
          autoimagem?: string | null
          autonomia?: Database["public"]["Enums"]["autonomia_nivel"] | null
          calculated_at?: string | null
          calculated_profile?: string | null
          cirurgias?: string | null
          client_id?: string
          comentarios_finais?: string | null
          completed_at?: string | null
          compromisso?: number | null
          condicao?:
            | Database["public"]["Enums"]["condicao_medica_flag"][]
            | null
          consumo_agua?: string | null
          contato?: string | null
          created_at?: string | null
          current_body_type?: number | null
          daily_sitting_hours?: number | null
          desired_body_type?: number | null
          dimension_scores?: Json | null
          discipline_level?: string | null
          dor_cat?: Database["public"]["Enums"]["dor_categoria"] | null
          dor_local?: string[] | null
          escala_dor?: number | null
          estresse?: string | null
          evento_especifico?: string | null
          experiencia_previa?: boolean | null
          frequencia_atual?: string | null
          frequencia_esperada?: number | null
          gender?: string | null
          handles_challenges?: string | null
          has_children?: boolean | null
          has_injury_or_surgery?: boolean | null
          has_joint_pain?: boolean | null
          horario_preferido?: string | null
          id?: string
          imc_calculado?: number | null
          imc_categoria?: string | null
          injury_details?: string | null
          injury_type?: string | null
          ins_cat?: Database["public"]["Enums"]["inseguranca_categoria"] | null
          lesoes?: string | null
          liberacao_medica?: string | null
          local_treino?: string | null
          medical_restrictions?: string[] | null
          medical_restrictions_details?: string | null
          medicamento?: string | null
          motivacao?: string | null
          motivacao_real?: string | null
          nivel_experiencia?: string | null
          nutrition_quality?: string | null
          objetivo_secundario?: string | null
          pain_details?: string | null
          pain_locations?: string[] | null
          perfil_primario?:
            | Database["public"]["Enums"]["perfil_comportamental"]
            | null
          periodo_preferido?:
            | Database["public"]["Enums"]["periodo_preferido"]
            | null
          peso_kg?: number | null
          prazo?: string | null
          preferencia_instrucao?: string | null
          previous_weight_training?: boolean | null
          primary_goal?: string | null
          prioridade?: number | null
          profession?: string | null
          profile_confidence_score?: number | null
          regioes_que_deseja_melhorar?: string[] | null
          restricao_medica?: string | null
          rotina_tipo?: Database["public"]["Enums"]["rotina_tipo"] | null
          secondary_goals?: string[] | null
          sleep_quality?: string | null
          sono_horas?: string | null
          tempo_disponivel?: string | null
          time_without_training?: string | null
          tipo_treino_preferido?: string | null
          tipos_de_treino_feitos?: string[] | null
          training_location?: string | null
          treina_atualmente?: boolean | null
          updated_at?: string | null
          user_vocab?: string[] | null
          wants_personalized_plan?: boolean | null
          water_intake?: string | null
          work_shift?: string | null
          work_type?: string | null
          workout_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_profiles: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          profile_number: number
          recommended_frequency: string | null
          recommended_intensity: string | null
          recommended_training_type: string[] | null
          risk_factors: string[] | null
          strategy: string
          typical_combination: Json
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          name: string
          profile_number: number
          recommended_frequency?: string | null
          recommended_intensity?: string | null
          recommended_training_type?: string[] | null
          risk_factors?: string[] | null
          strategy: string
          typical_combination: Json
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          profile_number?: number
          recommended_frequency?: string | null
          recommended_intensity?: string | null
          recommended_training_type?: string[] | null
          risk_factors?: string[] | null
          strategy?: string
          typical_combination?: Json
        }
        Relationships: []
      }
      anamnesis_recommendations: {
        Row: {
          category: string
          created_at: string | null
          id: string
          priority: string
          profile_id: string | null
          recommendation: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          priority: string
          profile_id?: string | null
          recommendation: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          priority?: string
          profile_id?: string | null
          recommendation?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          client_id: string
          created_at: string | null
          id: string
          new_personal_id: string | null
          old_personal_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          client_id: string
          created_at?: string | null
          id?: string
          new_personal_id?: string | null
          old_personal_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          client_id?: string
          created_at?: string | null
          id?: string
          new_personal_id?: string | null
          old_personal_id?: string | null
        }
        Relationships: []
      }
      client_assignments: {
        Row: {
          client_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          personal_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["client_status"] | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          personal_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          personal_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_exercise_first_use: {
        Row: {
          client_id: string
          exercise_id: string
          first_session_id: string | null
          first_used_at: string
          id: string
          video_shown: boolean | null
          video_shown_at: string | null
        }
        Insert: {
          client_id: string
          exercise_id: string
          first_session_id?: string | null
          first_used_at?: string
          id?: string
          video_shown?: boolean | null
          video_shown_at?: string | null
        }
        Update: {
          client_id?: string
          exercise_id?: string
          first_session_id?: string | null
          first_used_at?: string
          id?: string
          video_shown?: boolean | null
          video_shown_at?: string | null
        }
        Relationships: []
      }
      client_payment_configs: {
        Row: {
          active: boolean | null
          client_id: string
          created_at: string | null
          id: string
          monthly_price: number
          personal_id: string
          stripe_price_id: string | null
        }
        Insert: {
          active?: boolean | null
          client_id: string
          created_at?: string | null
          id?: string
          monthly_price: number
          personal_id: string
          stripe_price_id?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string
          created_at?: string | null
          id?: string
          monthly_price?: number
          personal_id?: string
          stripe_price_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_payment_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payment_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payment_configs_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payment_configs_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_protocol_progress: {
        Row: {
          bloco_atual: number
          client_id: string
          client_workout_id: string | null
          concluido_em: string | null
          created_at: string
          dor_consecutiva: number
          frequencia_semanal: number
          id: string
          iniciado_em: string
          sessao_atual: number
          status: string
          total_sessoes: number
          ultima_sessao_completed_at: string | null
          updated_at: string
        }
        Insert: {
          bloco_atual?: number
          client_id: string
          client_workout_id?: string | null
          concluido_em?: string | null
          created_at?: string
          dor_consecutiva?: number
          frequencia_semanal?: number
          id?: string
          iniciado_em?: string
          sessao_atual?: number
          status?: string
          total_sessoes?: number
          ultima_sessao_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          bloco_atual?: number
          client_id?: string
          client_workout_id?: string | null
          concluido_em?: string | null
          created_at?: string
          dor_consecutiva?: number
          frequencia_semanal?: number
          id?: string
          iniciado_em?: string
          sessao_atual?: number
          status?: string
          total_sessoes?: number
          ultima_sessao_completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_subscriptions: {
        Row: {
          client_id: string
          config_id: string
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          personal_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          config_id: string
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          personal_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          config_id?: string
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          personal_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "client_payment_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_subscriptions_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workouts: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          client_id: string | null
          completed_sessions: number | null
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string | null
          total_sessions: number | null
          workout_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          client_id?: string | null
          completed_sessions?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          total_sessions?: number | null
          workout_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          client_id?: string | null
          completed_sessions?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          total_sessions?: number | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_workouts_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workouts_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_settings: {
        Row: {
          active: boolean | null
          commission_percentage: number | null
          created_at: string | null
          id: string
          personal_id: string | null
        }
        Insert: {
          active?: boolean | null
          commission_percentage?: number | null
          created_at?: string | null
          id?: string
          personal_id?: string | null
        }
        Update: {
          active?: boolean | null
          commission_percentage?: number | null
          created_at?: string | null
          id?: string
          personal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_settings_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: true
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_settings_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkin_sessions: {
        Row: {
          ai_raw_response: Json | null
          ai_summary: string | null
          checkin_date: string
          client_id: string
          contexto_pergunta: string | null
          created_at: string
          dia_util: boolean
          disposicao: Database["public"]["Enums"]["disposicao_categoria"] | null
          dor_cat_dia: Database["public"]["Enums"]["dor_categoria"] | null
          dor_local_dia: string[] | null
          hora_checkin: string
          id: string
          pergunta_exibida: string | null
          schedule_id: string | null
          tempo_cat: Database["public"]["Enums"]["tempo_categoria"] | null
          transcription: string | null
          vocab_capturado: string[] | null
        }
        Insert: {
          ai_raw_response?: Json | null
          ai_summary?: string | null
          checkin_date?: string
          client_id: string
          contexto_pergunta?: string | null
          created_at?: string
          dia_util?: boolean
          disposicao?:
            | Database["public"]["Enums"]["disposicao_categoria"]
            | null
          dor_cat_dia?: Database["public"]["Enums"]["dor_categoria"] | null
          dor_local_dia?: string[] | null
          hora_checkin?: string
          id?: string
          pergunta_exibida?: string | null
          schedule_id?: string | null
          tempo_cat?: Database["public"]["Enums"]["tempo_categoria"] | null
          transcription?: string | null
          vocab_capturado?: string[] | null
        }
        Update: {
          ai_raw_response?: Json | null
          ai_summary?: string | null
          checkin_date?: string
          client_id?: string
          contexto_pergunta?: string | null
          created_at?: string
          dia_util?: boolean
          disposicao?:
            | Database["public"]["Enums"]["disposicao_categoria"]
            | null
          dor_cat_dia?: Database["public"]["Enums"]["dor_categoria"] | null
          dor_local_dia?: string[] | null
          hora_checkin?: string
          id?: string
          pergunta_exibida?: string | null
          schedule_id?: string | null
          tempo_cat?: Database["public"]["Enums"]["tempo_categoria"] | null
          transcription?: string | null
          vocab_capturado?: string[] | null
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          adapted_session_data: Json | null
          ai_suggestions: Json | null
          checkin_date: string
          client_id: string
          created_at: string
          id: string
          mood_summary: string | null
          suggestion_accepted: boolean | null
          transcription: string | null
        }
        Insert: {
          adapted_session_data?: Json | null
          ai_suggestions?: Json | null
          checkin_date?: string
          client_id: string
          created_at?: string
          id?: string
          mood_summary?: string | null
          suggestion_accepted?: boolean | null
          transcription?: string | null
        }
        Update: {
          adapted_session_data?: Json | null
          ai_suggestions?: Json | null
          checkin_date?: string
          client_id?: string
          created_at?: string
          id?: string
          mood_summary?: string | null
          suggestion_accepted?: boolean | null
          transcription?: string | null
        }
        Relationships: []
      }
      daily_workout_schedule: {
        Row: {
          abandon_reason: string | null
          client_id: string | null
          client_workout_id: string | null
          completed: boolean | null
          completed_at: string | null
          completed_exercises_count: number | null
          created_at: string | null
          difficulty_rating: string | null
          id: string
          scheduled_for: string
          session_id: string | null
          session_order: number | null
          total_weight_lifted: number | null
        }
        Insert: {
          abandon_reason?: string | null
          client_id?: string | null
          client_workout_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completed_exercises_count?: number | null
          created_at?: string | null
          difficulty_rating?: string | null
          id?: string
          scheduled_for: string
          session_id?: string | null
          session_order?: number | null
          total_weight_lifted?: number | null
        }
        Update: {
          abandon_reason?: string | null
          client_id?: string | null
          client_workout_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          completed_exercises_count?: number | null
          created_at?: string | null
          difficulty_rating?: string | null
          id?: string
          scheduled_for?: string
          session_id?: string | null
          session_order?: number | null
          total_weight_lifted?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_workout_schedule_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_workout_schedule_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_workout_schedule_client_workout_id_fkey"
            columns: ["client_workout_id"]
            isOneToOne: false
            referencedRelation: "client_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_workout_schedule_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_submissions: {
        Row: {
          age: number
          created_at: string
          full_name: string
          gender: string
          id: string
          is_vs_gold: boolean | null
          pain_knee: boolean | null
          pain_lower_back: boolean | null
          pain_shoulder: boolean | null
          payment_id: string | null
          payment_provider: string | null
          payment_status: string | null
          phone: string
          updated_at: string
          user_id: string | null
          vs_gold_exit_date: string | null
        }
        Insert: {
          age: number
          created_at?: string
          full_name: string
          gender: string
          id?: string
          is_vs_gold?: boolean | null
          pain_knee?: boolean | null
          pain_lower_back?: boolean | null
          pain_shoulder?: boolean | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          phone: string
          updated_at?: string
          user_id?: string | null
          vs_gold_exit_date?: string | null
        }
        Update: {
          age?: number
          created_at?: string
          full_name?: string
          gender?: string
          id?: string
          is_vs_gold?: boolean | null
          pain_knee?: boolean | null
          pain_lower_back?: boolean | null
          pain_shoulder?: boolean | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          phone?: string
          updated_at?: string
          user_id?: string | null
          vs_gold_exit_date?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          added_at: string | null
          biomechanical_class: string | null
          block: Database["public"]["Enums"]["exercise_block_enum"] | null
          coaching_cues: string[] | null
          common_mistakes: string[] | null
          confidence_score: number | null
          contraindication: string | null
          created_at: string | null
          created_by: string | null
          difficulty_code: string | null
          difficulty_progression: string[] | null
          dominant_movement: string | null
          equipment: string[] | null
          equipment_code:
            | Database["public"]["Enums"]["equipment_code_enum"]
            | null
          exercise_group: Database["public"]["Enums"]["exercise_group"]
          exercise_id: string | null
          exercise_type: Database["public"]["Enums"]["exercise_type_enum"]
          external_id: string | null
          id: string
          impact_level: string | null
          is_new: boolean | null
          last_updated_at: string | null
          level: string | null
          long_description: string | null
          movement: string | null
          name: string
          primary_muscle: string | null
          review_status: string | null
          safety_level: Database["public"]["Enums"]["safety_level_enum"] | null
          secondary_muscle: string | null
          short_description: string | null
          slug: string | null
          source_reference: string | null
          suggested_methods: string[] | null
          suggested_volume: Json | null
          tags: string[] | null
          target_audience: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          variation: string | null
          variations: string[] | null
          video_url: string | null
        }
        Insert: {
          added_at?: string | null
          biomechanical_class?: string | null
          block?: Database["public"]["Enums"]["exercise_block_enum"] | null
          coaching_cues?: string[] | null
          common_mistakes?: string[] | null
          confidence_score?: number | null
          contraindication?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_code?: string | null
          difficulty_progression?: string[] | null
          dominant_movement?: string | null
          equipment?: string[] | null
          equipment_code?:
            | Database["public"]["Enums"]["equipment_code_enum"]
            | null
          exercise_group: Database["public"]["Enums"]["exercise_group"]
          exercise_id?: string | null
          exercise_type?: Database["public"]["Enums"]["exercise_type_enum"]
          external_id?: string | null
          id?: string
          impact_level?: string | null
          is_new?: boolean | null
          last_updated_at?: string | null
          level?: string | null
          long_description?: string | null
          movement?: string | null
          name: string
          primary_muscle?: string | null
          review_status?: string | null
          safety_level?: Database["public"]["Enums"]["safety_level_enum"] | null
          secondary_muscle?: string | null
          short_description?: string | null
          slug?: string | null
          source_reference?: string | null
          suggested_methods?: string[] | null
          suggested_volume?: Json | null
          tags?: string[] | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          variation?: string | null
          variations?: string[] | null
          video_url?: string | null
        }
        Update: {
          added_at?: string | null
          biomechanical_class?: string | null
          block?: Database["public"]["Enums"]["exercise_block_enum"] | null
          coaching_cues?: string[] | null
          common_mistakes?: string[] | null
          confidence_score?: number | null
          contraindication?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty_code?: string | null
          difficulty_progression?: string[] | null
          dominant_movement?: string | null
          equipment?: string[] | null
          equipment_code?:
            | Database["public"]["Enums"]["equipment_code_enum"]
            | null
          exercise_group?: Database["public"]["Enums"]["exercise_group"]
          exercise_id?: string | null
          exercise_type?: Database["public"]["Enums"]["exercise_type_enum"]
          external_id?: string | null
          id?: string
          impact_level?: string | null
          is_new?: boolean | null
          last_updated_at?: string | null
          level?: string | null
          long_description?: string | null
          movement?: string | null
          name?: string
          primary_muscle?: string | null
          review_status?: string | null
          safety_level?: Database["public"]["Enums"]["safety_level_enum"] | null
          secondary_muscle?: string | null
          short_description?: string | null
          slug?: string | null
          source_reference?: string | null
          suggested_methods?: string[] | null
          suggested_volume?: Json | null
          tags?: string[] | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          variation?: string | null
          variations?: string[] | null
          video_url?: string | null
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          page: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          page?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      medical_condition_exercise_restrictions: {
        Row: {
          condition_keyword: string
          created_at: string | null
          id: string
          recommendation: string | null
          restricted_exercise_groups: string[]
          severity_level: string
        }
        Insert: {
          condition_keyword: string
          created_at?: string | null
          id?: string
          recommendation?: string | null
          restricted_exercise_groups: string[]
          severity_level: string
        }
        Update: {
          condition_keyword?: string
          created_at?: string | null
          id?: string
          recommendation?: string | null
          restricted_exercise_groups?: string[]
          severity_level?: string
        }
        Relationships: []
      }
      methods: {
        Row: {
          added_at: string | null
          cadence_contraction: number
          cadence_pause: number
          cadence_stretch: number
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          energy_cost: Database["public"]["Enums"]["method_energy_cost"]
          id: string
          is_new: boolean | null
          last_updated_at: string | null
          load_level: string
          name: string | null
          objective: Database["public"]["Enums"]["method_objective"] | null
          recommended_combination: string | null
          reps_description: string | null
          reps_max: number
          reps_min: number
          rest_seconds: number
          review_status: string | null
          risk_level: Database["public"]["Enums"]["method_risk_level"]
          source_reference: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          added_at?: string | null
          cadence_contraction: number
          cadence_pause: number
          cadence_stretch: number
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          energy_cost?: Database["public"]["Enums"]["method_energy_cost"]
          id?: string
          is_new?: boolean | null
          last_updated_at?: string | null
          load_level: string
          name?: string | null
          objective?: Database["public"]["Enums"]["method_objective"] | null
          recommended_combination?: string | null
          reps_description?: string | null
          reps_max: number
          reps_min: number
          rest_seconds: number
          review_status?: string | null
          risk_level?: Database["public"]["Enums"]["method_risk_level"]
          source_reference?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          added_at?: string | null
          cadence_contraction?: number
          cadence_pause?: number
          cadence_stretch?: number
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          energy_cost?: Database["public"]["Enums"]["method_energy_cost"]
          id?: string
          is_new?: boolean | null
          last_updated_at?: string | null
          load_level?: string
          name?: string | null
          objective?: Database["public"]["Enums"]["method_objective"] | null
          recommended_combination?: string | null
          reps_description?: string | null
          reps_max?: number
          reps_min?: number
          rest_seconds?: number
          review_status?: string | null
          risk_level?: Database["public"]["Enums"]["method_risk_level"]
          source_reference?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          admin_commission: number | null
          amount: number
          created_at: string | null
          description: string | null
          id: string
          net_amount: number
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          admin_commission?: number | null
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          net_amount: number
          paid_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          admin_commission?: number | null
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          net_amount?: number
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_updates: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          entity_data: Json
          entity_type: string
          id: string
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_reference: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          entity_data: Json
          entity_type: string
          id?: string
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_reference?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          entity_data?: Json
          entity_type?: string
          id?: string
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_updates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_updates_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          personal_id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          personal_id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          personal_id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_subscriptions_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_subscriptions_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_assessments: {
        Row: {
          arm_circumference: number | null
          assessed_by: string | null
          assessment_date: string | null
          bmi: number | null
          body_fat_percentage: number | null
          chest_circumference: number | null
          client_id: string | null
          created_at: string | null
          height: number | null
          hip_circumference: number | null
          id: string
          muscle_mass_percentage: number | null
          notes: string | null
          thigh_circumference: number | null
          waist_circumference: number | null
          weight: number | null
        }
        Insert: {
          arm_circumference?: number | null
          assessed_by?: string | null
          assessment_date?: string | null
          bmi?: number | null
          body_fat_percentage?: number | null
          chest_circumference?: number | null
          client_id?: string | null
          created_at?: string | null
          height?: number | null
          hip_circumference?: number | null
          id?: string
          muscle_mass_percentage?: number | null
          notes?: string | null
          thigh_circumference?: number | null
          waist_circumference?: number | null
          weight?: number | null
        }
        Update: {
          arm_circumference?: number | null
          assessed_by?: string | null
          assessment_date?: string | null
          bmi?: number | null
          body_fat_percentage?: number | null
          chest_circumference?: number | null
          client_id?: string | null
          created_at?: string | null
          height?: number | null
          hip_circumference?: number | null
          id?: string
          muscle_mass_percentage?: number | null
          notes?: string | null
          thigh_circumference?: number | null
          waist_circumference?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_workout_feedbacks: {
        Row: {
          ai_analysis: Json | null
          client_id: string
          created_at: string
          difficulty_rating: string | null
          feedback_date: string
          id: string
          mood_category: string | null
          mood_summary: string | null
          schedule_id: string | null
          session_id: string | null
          transcription: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          client_id: string
          created_at?: string
          difficulty_rating?: string | null
          feedback_date?: string
          id?: string
          mood_category?: string | null
          mood_summary?: string | null
          schedule_id?: string | null
          session_id?: string | null
          transcription?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          client_id?: string
          created_at?: string
          difficulty_rating?: string | null
          feedback_date?: string
          id?: string
          mood_category?: string | null
          mood_summary?: string | null
          schedule_id?: string | null
          session_id?: string | null
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_workout_feedbacks_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "daily_workout_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_workout_feedbacks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          anamnesis_completed: boolean | null
          anamnesis_last_update: string | null
          anamnesis_profile: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          gender: string | null
          goals: string | null
          id: string
          medical_conditions: string | null
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          anamnesis_completed?: boolean | null
          anamnesis_last_update?: string | null
          anamnesis_profile?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          gender?: string | null
          goals?: string | null
          id: string
          medical_conditions?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          anamnesis_completed?: boolean | null
          anamnesis_last_update?: string | null
          anamnesis_profile?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          gender?: string | null
          goals?: string | null
          id?: string
          medical_conditions?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      protocol_milestones: {
        Row: {
          alert_type: Database["public"]["Enums"]["alert_type_enum"] | null
          client_message_template: string | null
          created_at: string
          description: string | null
          id: string
          jmp_action: string | null
          milestone_type: Database["public"]["Enums"]["milestone_type_enum"]
          required_video_codes: string[] | null
          session_number: number
          title: string
          triggers_alert: boolean | null
          updated_at: string
        }
        Insert: {
          alert_type?: Database["public"]["Enums"]["alert_type_enum"] | null
          client_message_template?: string | null
          created_at?: string
          description?: string | null
          id?: string
          jmp_action?: string | null
          milestone_type: Database["public"]["Enums"]["milestone_type_enum"]
          required_video_codes?: string[] | null
          session_number: number
          title: string
          triggers_alert?: boolean | null
          updated_at?: string
        }
        Update: {
          alert_type?: Database["public"]["Enums"]["alert_type_enum"] | null
          client_message_template?: string | null
          created_at?: string
          description?: string | null
          id?: string
          jmp_action?: string | null
          milestone_type?: Database["public"]["Enums"]["milestone_type_enum"]
          required_video_codes?: string[] | null
          session_number?: number
          title?: string
          triggers_alert?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      session_completions: {
        Row: {
          client_id: string | null
          client_workout_id: string | null
          completed_at: string | null
          created_at: string | null
          exercise_id: string | null
          id: string
          notes: string | null
          reps_completed: string | null
          rest_time_used: number | null
          session_id: string | null
          sets_completed: number | null
          weight_used: number | null
        }
        Insert: {
          client_id?: string | null
          client_workout_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          reps_completed?: string | null
          rest_time_used?: number | null
          session_id?: string | null
          sets_completed?: number | null
          weight_used?: number | null
        }
        Update: {
          client_id?: string | null
          client_workout_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          reps_completed?: string | null
          rest_time_used?: number | null
          session_id?: string | null
          sets_completed?: number | null
          weight_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_completions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_completions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_completions_client_workout_id_fkey"
            columns: ["client_workout_id"]
            isOneToOne: false
            referencedRelation: "client_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_completions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_completions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercises: {
        Row: {
          exercise_id: string | null
          id: string
          method_id: string
          order_index: number
          session_id: string | null
          volume_id: string
        }
        Insert: {
          exercise_id?: string | null
          id?: string
          method_id: string
          order_index: number
          session_id?: string | null
          volume_id: string
        }
        Update: {
          exercise_id?: string | null
          id?: string
          method_id?: string
          order_index?: number
          session_id?: string | null
          volume_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_volume_id_fkey"
            columns: ["volume_id"]
            isOneToOne: false
            referencedRelation: "volumes"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          block: Database["public"]["Enums"]["exercise_block_enum"] | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          name: string
          session_type: Database["public"]["Enums"]["session_type"] | null
          updated_at: string | null
        }
        Insert: {
          block?: Database["public"]["Enums"]["exercise_block_enum"] | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          name: string
          session_type?: Database["public"]["Enums"]["session_type"] | null
          updated_at?: string | null
        }
        Update: {
          block?: Database["public"]["Enums"]["exercise_block_enum"] | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          session_type?: Database["public"]["Enums"]["session_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          interval: string
          name: string
          price: number
          stripe_price_id: string | null
          trial_days: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          interval: string
          name: string
          price: number
          stripe_price_id?: string | null
          trial_days?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          interval?: string
          name?: string
          price?: number
          stripe_price_id?: string | null
          trial_days?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volumes: {
        Row: {
          added_at: string | null
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          exercise_max: number | null
          exercise_min: number | null
          goal: string | null
          id: string
          is_new: boolean | null
          last_updated_at: string | null
          max_weekly_sets: number | null
          min_weekly_sets: number | null
          movement_pattern: string | null
          name: string
          num_exercises: number
          num_series: number
          optimal_weekly_sets: number | null
          review_status: string | null
          series_max: number | null
          series_min: number | null
          source_reference: string | null
          updated_at: string | null
          weekly_volume_description: string | null
        }
        Insert: {
          added_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          exercise_max?: number | null
          exercise_min?: number | null
          goal?: string | null
          id?: string
          is_new?: boolean | null
          last_updated_at?: string | null
          max_weekly_sets?: number | null
          min_weekly_sets?: number | null
          movement_pattern?: string | null
          name: string
          num_exercises: number
          num_series: number
          optimal_weekly_sets?: number | null
          review_status?: string | null
          series_max?: number | null
          series_min?: number | null
          source_reference?: string | null
          updated_at?: string | null
          weekly_volume_description?: string | null
        }
        Update: {
          added_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          exercise_max?: number | null
          exercise_min?: number | null
          goal?: string | null
          id?: string
          is_new?: boolean | null
          last_updated_at?: string | null
          max_weekly_sets?: number | null
          min_weekly_sets?: number | null
          movement_pattern?: string | null
          name?: string
          num_exercises?: number
          num_series?: number
          optimal_weekly_sets?: number | null
          review_status?: string | null
          series_max?: number | null
          series_min?: number | null
          source_reference?: string | null
          updated_at?: string | null
          weekly_volume_description?: string | null
        }
        Relationships: []
      }
      workout_assignment_validations: {
        Row: {
          assigned_by: string | null
          client_workout_id: string | null
          created_at: string | null
          id: string
          override_reason: string | null
          validation_result: Json
        }
        Insert: {
          assigned_by?: string | null
          client_workout_id?: string | null
          created_at?: string | null
          id?: string
          override_reason?: string | null
          validation_result: Json
        }
        Update: {
          assigned_by?: string | null
          client_workout_id?: string | null
          created_at?: string | null
          id?: string
          override_reason?: string | null
          validation_result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workout_assignment_validations_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_assignment_validations_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_assignment_validations_client_workout_id_fkey"
            columns: ["client_workout_id"]
            isOneToOne: false
            referencedRelation: "client_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          id: string
          order_index: number
          session_id: string | null
          workout_id: string | null
        }
        Insert: {
          id?: string
          order_index: number
          session_id?: string | null
          workout_id?: string | null
        }
        Update: {
          id?: string
          order_index?: number
          session_id?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          age_range: string | null
          created_at: string | null
          created_by: string | null
          gender: string | null
          id: string
          level: Database["public"]["Enums"]["training_level"] | null
          name: string
          responsible_id: string | null
          training_type: Database["public"]["Enums"]["training_type"] | null
          updated_at: string | null
          workout_type: Database["public"]["Enums"]["workout_type_enum"]
        }
        Insert: {
          age_range?: string | null
          created_at?: string | null
          created_by?: string | null
          gender?: string | null
          id?: string
          level?: Database["public"]["Enums"]["training_level"] | null
          name: string
          responsible_id?: string | null
          training_type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string | null
          workout_type?: Database["public"]["Enums"]["workout_type_enum"]
        }
        Update: {
          age_range?: string | null
          created_at?: string | null
          created_by?: string | null
          gender?: string | null
          id?: string
          level?: Database["public"]["Enums"]["training_level"] | null
          name?: string
          responsible_id?: string | null
          training_type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string | null
          workout_type?: Database["public"]["Enums"]["workout_type_enum"]
        }
        Relationships: []
      }
    }
    Views: {
      admin_clients_overview: {
        Row: {
          assignment_notes: string | null
          avatar_url: string | null
          birth_date: string | null
          completed_sessions: number | null
          end_date: string | null
          full_name: string | null
          gender: string | null
          goals: string | null
          id: string | null
          medical_conditions: string | null
          personal_id: string | null
          personal_name: string | null
          phone: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["client_status"] | null
          total_assessments: number | null
          total_workouts: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "admin_clients_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      remove_new_badge_after_30_days: { Args: never; Returns: undefined }
    }
    Enums: {
      alert_severity_enum: "baixa" | "media" | "alta" | "critica"
      alert_status_enum: "aberto" | "em_revisao" | "resolvido"
      alert_type_enum:
        | "frequencia_zero"
        | "frequencia_baixa"
        | "dor_persistente"
        | "sessao_sem_feedback"
        | "revisao_nivel_I3"
        | "alerta_medico"
        | "condicao_cardiaca"
        | "inconsistencia_checkin"
        | "divergencia_conduta"
      app_role: "admin" | "personal" | "client"
      autonomia_nivel: "baixa" | "media" | "alta"
      client_status: "Ativo" | "Inativo" | "Suspenso"
      condicao_medica_flag:
        | "CARDIACO"
        | "HIPERTENSAO"
        | "DIABETES"
        | "ASMA"
        | "OSTEOPOROSE"
        | "HERNIA_DISCO"
        | "GESTANTE"
        | "POS_CIRURGICO"
        | "OUTRO"
      disposicao_categoria: "OK" | "Moderada" | "Comprometida"
      dor_categoria: "D0" | "D1" | "D2" | "D3"
      equipment_code_enum:
        | "PC"
        | "ELAS"
        | "MAC"
        | "DIV"
        | "CONV"
        | "CAB"
        | "HAL"
        | "BAR"
      exercise_block_enum: "MOB" | "FORT" | "MS" | "MI" | "CARD" | "ALONG"
      exercise_group:
        | "Abdômen"
        | "Peito"
        | "Costas"
        | "Pernas"
        | "Ombros"
        | "Bíceps"
        | "Tríceps"
        | "Glúteos"
        | "Panturrilha"
        | "Outro"
        | "Quadríceps"
        | "Posterior"
        | "Lombar"
      exercise_type_enum: "Musculação" | "Mobilidade" | "Cardio" | "Alongamento"
      inseguranca_categoria: "I1" | "I2" | "I3"
      intensity_level: "Fácil" | "Intermediário" | "Difícil"
      method_energy_cost: "Alto" | "Médio" | "Baixo"
      method_objective:
        | "Hipertrofia"
        | "Força"
        | "Resistência"
        | "Potência"
        | "Hipertrofia + Força"
        | "Força + Hipertrofia"
        | "Equilíbrio / Hipertrofia"
        | "Hipertrofia pesada"
        | "Força + Potência"
      method_risk_level:
        | "Baixo risco"
        | "Médio risco"
        | "Alto risco"
        | "Alto risco de fadiga"
      milestone_type_enum:
        | "inicio"
        | "revisao_I3"
        | "encerra_bloco"
        | "inicia_bloco"
        | "checkpoint_jmp"
        | "encerra_protocolo"
      perfil_comportamental:
        | "P01_empurrado_pela_dor"
        | "P02_assustado_com_tempo"
        | "P03_frustrado"
        | "P04_estreante"
        | "P05_sobrecarregado"
        | "P06_deslocado"
      periodo_preferido: "manha" | "tarde" | "noite"
      rotina_tipo: "pre_trabalho" | "pos_trabalho" | "livre"
      safety_level_enum: "S1" | "S2" | "S3" | "S4" | "S5"
      session_type: "Mobilidade" | "Alongamento" | "Musculação"
      template_moment_enum:
        | "pre_sessao"
        | "pos_sessao"
        | "marco"
        | "alerta"
        | "encerramento"
      tempo_categoria: "T1" | "T2" | "T3"
      training_level: "Iniciante" | "Avançado"
      training_type:
        | "Hipertrofia"
        | "Emagrecimento"
        | "Musculação"
        | "Funcional"
        | "Outro"
      workout_type_enum: "standard" | "protocolo_destravamento"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity_enum: ["baixa", "media", "alta", "critica"],
      alert_status_enum: ["aberto", "em_revisao", "resolvido"],
      alert_type_enum: [
        "frequencia_zero",
        "frequencia_baixa",
        "dor_persistente",
        "sessao_sem_feedback",
        "revisao_nivel_I3",
        "alerta_medico",
        "condicao_cardiaca",
        "inconsistencia_checkin",
        "divergencia_conduta",
      ],
      app_role: ["admin", "personal", "client"],
      autonomia_nivel: ["baixa", "media", "alta"],
      client_status: ["Ativo", "Inativo", "Suspenso"],
      condicao_medica_flag: [
        "CARDIACO",
        "HIPERTENSAO",
        "DIABETES",
        "ASMA",
        "OSTEOPOROSE",
        "HERNIA_DISCO",
        "GESTANTE",
        "POS_CIRURGICO",
        "OUTRO",
      ],
      disposicao_categoria: ["OK", "Moderada", "Comprometida"],
      dor_categoria: ["D0", "D1", "D2", "D3"],
      equipment_code_enum: [
        "PC",
        "ELAS",
        "MAC",
        "DIV",
        "CONV",
        "CAB",
        "HAL",
        "BAR",
      ],
      exercise_block_enum: ["MOB", "FORT", "MS", "MI", "CARD", "ALONG"],
      exercise_group: [
        "Abdômen",
        "Peito",
        "Costas",
        "Pernas",
        "Ombros",
        "Bíceps",
        "Tríceps",
        "Glúteos",
        "Panturrilha",
        "Outro",
        "Quadríceps",
        "Posterior",
        "Lombar",
      ],
      exercise_type_enum: ["Musculação", "Mobilidade", "Cardio", "Alongamento"],
      inseguranca_categoria: ["I1", "I2", "I3"],
      intensity_level: ["Fácil", "Intermediário", "Difícil"],
      method_energy_cost: ["Alto", "Médio", "Baixo"],
      method_objective: [
        "Hipertrofia",
        "Força",
        "Resistência",
        "Potência",
        "Hipertrofia + Força",
        "Força + Hipertrofia",
        "Equilíbrio / Hipertrofia",
        "Hipertrofia pesada",
        "Força + Potência",
      ],
      method_risk_level: [
        "Baixo risco",
        "Médio risco",
        "Alto risco",
        "Alto risco de fadiga",
      ],
      milestone_type_enum: [
        "inicio",
        "revisao_I3",
        "encerra_bloco",
        "inicia_bloco",
        "checkpoint_jmp",
        "encerra_protocolo",
      ],
      perfil_comportamental: [
        "P01_empurrado_pela_dor",
        "P02_assustado_com_tempo",
        "P03_frustrado",
        "P04_estreante",
        "P05_sobrecarregado",
        "P06_deslocado",
      ],
      periodo_preferido: ["manha", "tarde", "noite"],
      rotina_tipo: ["pre_trabalho", "pos_trabalho", "livre"],
      safety_level_enum: ["S1", "S2", "S3", "S4", "S5"],
      session_type: ["Mobilidade", "Alongamento", "Musculação"],
      template_moment_enum: [
        "pre_sessao",
        "pos_sessao",
        "marco",
        "alerta",
        "encerramento",
      ],
      tempo_categoria: ["T1", "T2", "T3"],
      training_level: ["Iniciante", "Avançado"],
      training_type: [
        "Hipertrofia",
        "Emagrecimento",
        "Musculação",
        "Funcional",
        "Outro",
      ],
      workout_type_enum: ["standard", "protocolo_destravamento"],
    },
  },
} as const
