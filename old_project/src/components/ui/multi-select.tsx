"use client";

import * as React from "react";
import { XIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Button } from "./button";

interface MultiSelectOption {
  id: number;
  username: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: number[];
  onSelectionChange: (selected: number[]) => void;
  maxSelections?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function MultiSelect({
  options,
  selected,
  onSelectionChange,
  maxSelections = 5,
  placeholder = "Select users...",
  searchPlaceholder = "Search users...",
  emptyMessage = "No users found",
}: MultiSelectProps) {
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter((option) =>
      option.username.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => selected.includes(option.id));
  }, [options, selected]);

  const handleToggle = (optionId: number) => {
    if (selected.includes(optionId)) {
      onSelectionChange(selected.filter((id) => id !== optionId));
    } else {
      if (selected.length < maxSelections) {
        onSelectionChange([...selected, optionId]);
      }
    }
  };

  const handleRemove = (optionId: number) => {
    onSelectionChange(selected.filter((id) => id !== optionId));
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="space-y-2">
        <div
          className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-1 flex-wrap gap-1.5">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {option.username}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(option.id);
                    }}
                    className="rounded-sm hover:bg-primary/20"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {selected.length}/{maxSelections}
          </span>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full rounded-md border bg-popover shadow-md">
            <div className="p-2">
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selected.includes(option.id);
                  const isDisabled =
                    !isSelected && selected.length >= maxSelections;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleToggle(option.id)}
                      disabled={isDisabled}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {isSelected && (
                            <CheckIcon className="h-3 w-3" />
                          )}
                        </div>
                        <span>{option.username}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

