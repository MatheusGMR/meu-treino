-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para tipos de roles
CREATE TYPE app_role AS ENUM ('admin', 'personal', 'client');

-- Tabela de perfis de usuários
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('Masculino', 'Feminino', 'Outro')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de roles (CRÍTICO: separada do profile)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Função de segurança para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger para criar profile ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário'));
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS Policies para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies para user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Apenas admins podem gerenciar roles"
  ON user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enum para grupos de exercícios
CREATE TYPE exercise_group AS ENUM (
  'Abdômen', 'Peito', 'Costas', 'Pernas', 'Ombros', 
  'Bíceps', 'Tríceps', 'Glúteos', 'Panturrilha', 'Outro'
);

-- Enum para intensidade
CREATE TYPE intensity_level AS ENUM ('Fácil', 'Intermediário', 'Difícil');

-- Tabela de exercícios
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  exercise_group exercise_group NOT NULL,
  intensity intensity_level NOT NULL,
  equipment TEXT,
  print_name TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  media_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals e clientes podem ver todos exercícios"
  ON exercises FOR SELECT
  USING (
    public.has_role(auth.uid(), 'personal') OR 
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'client')
  );

CREATE POLICY "Personals podem criar exercícios"
  ON exercises FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem editar exercícios que criaram"
  ON exercises FOR UPDATE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem deletar exercícios que criaram"
  ON exercises FOR DELETE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Enum para tipos de sessão
CREATE TYPE session_type AS ENUM ('Mobilidade', 'Alongamento', 'Musculação');

-- Tabela de sessões
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  session_type session_type NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de exercícios em sessões (muitos-para-muitos)
CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps TEXT,
  rest_time INTEGER,
  notes TEXT,
  UNIQUE(session_id, exercise_id, order_index)
);

-- RLS Policies para sessões
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals e clientes podem ver sessões"
  ON sessions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'personal') OR 
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'client')
  );

CREATE POLICY "Personals podem criar sessões"
  ON sessions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem editar suas sessões"
  ON sessions FOR UPDATE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem deletar suas sessões"
  ON sessions FOR DELETE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS para session_exercises
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver exercícios de sessões"
  ON session_exercises FOR SELECT
  USING (
    public.has_role(auth.uid(), 'personal') OR 
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'client')
  );

CREATE POLICY "Personals podem gerenciar exercícios de sessões"
  ON session_exercises FOR ALL
  USING (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'));

-- Enum para níveis de treino
CREATE TYPE training_level AS ENUM ('Iniciante', 'Avançado');

-- Enum para tipos de treino
CREATE TYPE training_type AS ENUM ('Hipertrofia', 'Emagrecimento', 'Musculação', 'Funcional', 'Outro');

-- Tabela de treinos
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  responsible_id UUID REFERENCES auth.users(id),
  training_type training_type,
  level training_level,
  gender TEXT CHECK (gender IN ('Masculino', 'Feminino', 'Unissex')),
  age_range TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões em treinos (muitos-para-muitos)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  UNIQUE(workout_id, session_id, order_index)
);

-- RLS Policies para treinos
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals e clientes podem ver treinos"
  ON workouts FOR SELECT
  USING (
    public.has_role(auth.uid(), 'personal') OR 
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'client')
  );

CREATE POLICY "Personals podem criar treinos"
  ON workouts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem editar seus treinos"
  ON workouts FOR UPDATE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem deletar seus treinos"
  ON workouts FOR DELETE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS para workout_sessions
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver sessões de treinos"
  ON workout_sessions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'personal') OR 
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'client')
  );

CREATE POLICY "Personals podem gerenciar sessões de treinos"
  ON workout_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'));

-- Enum para status do cliente
CREATE TYPE client_status AS ENUM ('Ativo', 'Inativo', 'Suspenso');

-- Tabela de relacionamento Personal-Cliente
CREATE TABLE client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status client_status DEFAULT 'Ativo',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, personal_id)
);

-- Tabela de treinos atribuídos a clientes
CREATE TABLE client_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('Ativo', 'Finalizado', 'Arquivado')) DEFAULT 'Ativo',
  start_date DATE,
  end_date DATE,
  completed_sessions INTEGER DEFAULT 0,
  total_sessions INTEGER,
  notes TEXT
);

-- Tabela de avaliações físicas
CREATE TABLE physical_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessed_by UUID REFERENCES auth.users(id),
  assessment_date DATE DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  body_fat_percentage DECIMAL(5,2),
  muscle_mass_percentage DECIMAL(5,2),
  bmi DECIMAL(5,2),
  chest_circumference DECIMAL(5,2),
  waist_circumference DECIMAL(5,2),
  hip_circumference DECIMAL(5,2),
  arm_circumference DECIMAL(5,2),
  thigh_circumference DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies para client_assignments
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals veem seus clientes"
  ON client_assignments FOR SELECT
  USING (personal_id = auth.uid() OR client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem criar relacionamentos"
  ON client_assignments FOR INSERT
  WITH CHECK (personal_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem atualizar relacionamentos"
  ON client_assignments FOR UPDATE
  USING (personal_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies para client_workouts
ALTER TABLE client_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes veem seus treinos"
  ON client_workouts FOR SELECT
  USING (client_id = auth.uid() OR public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem atribuir treinos"
  ON client_workouts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem atualizar treinos de clientes"
  ON client_workouts FOR UPDATE
  USING (assigned_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies para physical_assessments
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals veem avaliações de seus clientes"
  ON physical_assessments FOR SELECT
  USING (
    assessed_by = auth.uid() OR 
    client_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Personals podem criar avaliações"
  ON physical_assessments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Personals podem atualizar avaliações"
  ON physical_assessments FOR UPDATE
  USING (assessed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-media', 'exercise-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para exercise-media
CREATE POLICY "Todos podem ver mídias de exercícios"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-media');

CREATE POLICY "Personals podem fazer upload de mídias"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-media' AND
    (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Personals podem deletar mídias que criaram"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exercise-media' AND
    (public.has_role(auth.uid(), 'personal') OR public.has_role(auth.uid(), 'admin'))
  );

-- RLS para avatars
CREATE POLICY "Todos podem ver avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem fazer upload de seus avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem deletar seus avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );