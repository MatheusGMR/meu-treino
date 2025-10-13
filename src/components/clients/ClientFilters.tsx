import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { ClientStatus } from "@/hooks/useClients";

interface ClientFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ClientStatus | "Todos";
  onStatusChange: (value: ClientStatus | "Todos") => void;
}

export const ClientFilters = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: ClientFiltersProps) => {
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todos</SelectItem>
          <SelectItem value="Ativo">Ativo</SelectItem>
          <SelectItem value="Inativo">Inativo</SelectItem>
          <SelectItem value="Suspenso">Suspenso</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
