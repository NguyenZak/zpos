"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { posService } from "@/services/pos.service";

export function BranchSwitcher() {
  const [branches, setBranches] = React.useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<any>(null);

  const loadBranches = React.useCallback(async () => {
    try {
      const data = await posService.getBranches();
      setBranches(data);
      
      const stored = localStorage.getItem("zpos_selected_branch_id");
      if (stored) {
        const found = data.find((b: any) => b.id === stored);
        if (found) {
          setSelectedBranch(found);
          return;
        }
      }
      setSelectedBranch(data[0] || null);
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    loadBranches();
    
    const handleStorageChange = () => {
      loadBranches();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("zpos_branches_updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("zpos_branches_updated", handleStorageChange);
    };
  }, [loadBranches]);

  const handleSelectBranch = (branch: any) => {
    setSelectedBranch(branch);
    localStorage.setItem("zpos_selected_branch_id", branch.id);
    window.dispatchEvent(new Event("zpos_branch_switched"));
  };

  if (!selectedBranch) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 hover:bg-muted font-bold text-xs uppercase tracking-wider">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="hidden md:inline-block">{selectedBranch.name}</span>
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase">Chọn chi nhánh làm việc</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => handleSelectBranch(branch)}
            className="flex items-center justify-between py-2 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-bold text-sm">{branch.name}</span>
              <span className="text-[10px] text-muted-foreground">{branch.address}</span>
            </div>
            {selectedBranch.id === branch.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
