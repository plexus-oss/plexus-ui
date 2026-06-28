"use client";

import {
  type ColorSchemeName,
  colorSchemes,
  useColorScheme,
} from "@/components/color-scheme-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <Select value={colorScheme} onValueChange={(value) => setColorScheme(value as ColorSchemeName)}>
      <SelectTrigger className="border-none shadow-none hover:bg-foreground/5 cursor-pointer bg-transparent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="w-[50px]">
        {Object.entries(colorSchemes).map(([scheme, color]) => (
          <SelectItem
            key={scheme}
            value={scheme}
            className="cursor-pointer bg-transparent w-[50px]"
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
