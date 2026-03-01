"use client";

import { AttitudeIndicator } from "@plexusui/components/charts/attitude-indicator";
import { useState } from "react";
import { type ApiProp, ApiReferenceTable } from "@/components/api-reference-table";
import { ComponentPreview } from "@/components/component-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// ============================================================================
// Basic Interactive Example
// ============================================================================

function BasicExample() {
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);

  return (
    <ComponentPreview
      title="Basic Attitude Indicator"
      description="Interactive artificial horizon for pitch and roll visualization"
      code={`import { AttitudeIndicator } from "@/components/plexusui/charts/attitude-indicator";
import { useState } from "react";

function AttitudeDemo() {
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);

  return (
    <AttitudeIndicator
      pitch={pitch}
      roll={roll}
      width={400}
      height={400}
    />
  );
}`}
      preview={
        <div className="w-full space-y-6">
          <div className="flex justify-center">
            <AttitudeIndicator pitch={pitch} roll={roll} width={400} height={400} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pitch-slider" className="text-sm font-medium">
                    Pitch
                  </Label>
                  <Badge variant="outline" className="font-mono tabular-nums">
                    {pitch > 0 && "+"}
                    {pitch.toFixed(1)}°
                    <span className="ml-1 text-xs text-muted-foreground">
                      {pitch > 0 ? "↑ up" : pitch < 0 ? "↓ down" : "level"}
                    </span>
                  </Badge>
                </div>
                <Slider
                  id="pitch-slider"
                  min={-90}
                  max={90}
                  step={0.5}
                  value={[pitch]}
                  onValueChange={(value) => setPitch(value[0])}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="roll-slider" className="text-sm font-medium">
                    Roll
                  </Label>
                  <Badge variant="outline" className="font-mono tabular-nums">
                    {roll > 0 && "+"}
                    {roll.toFixed(1)}°
                    <span className="ml-1 text-xs text-muted-foreground">
                      {roll > 0 ? "→ right" : roll < 0 ? "← left" : "level"}
                    </span>
                  </Badge>
                </div>
                <Slider
                  id="roll-slider"
                  min={-180}
                  max={180}
                  step={1}
                  value={[roll]}
                  onValueChange={(value) => setRoll(value[0])}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPitch(0);
                    setRoll(0);
                  }}
                >
                  Level
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPitch(15);
                    setRoll(0);
                  }}
                >
                  Climb
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPitch(0);
                    setRoll(30);
                  }}
                >
                  Bank Right
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPitch(-10);
                    setRoll(-25);
                  }}
                >
                  Turn Left
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}

// ============================================================================
// Primitive Composition Example
// ============================================================================

function PrimitiveExample() {
  const [pitch, setPitch] = useState(15);
  const [roll, setRoll] = useState(-20);

  return (
    <ComponentPreview
      title="Primitive Components"
      description="Build custom attitude indicators with primitive components for maximum flexibility"
      code={`import { AttitudeIndicator } from "@/components/plexusui/charts/attitude-indicator";

function CustomIndicator() {
  return (
    <AttitudeIndicator.Root
      pitch={pitch}
      roll={roll}
      width={400}
      height={400}
    >
      <AttitudeIndicator.Canvas />
    </AttitudeIndicator.Root>
  );
}`}
      preview={
        <div className="w-full space-y-6">
          <div className="flex justify-center">
            <AttitudeIndicator.Root pitch={pitch} roll={roll} width={400} height={400}>
              <AttitudeIndicator.Canvas />
            </AttitudeIndicator.Root>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Adjust Orientation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prim-pitch" className="text-sm">
                    Pitch
                  </Label>
                  <Badge variant="outline" className="font-mono">
                    {pitch}°
                  </Badge>
                </div>
                <Slider
                  id="prim-pitch"
                  min={-45}
                  max={45}
                  value={[pitch]}
                  onValueChange={(value) => setPitch(value[0])}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prim-roll" className="text-sm">
                    Roll
                  </Label>
                  <Badge variant="outline" className="font-mono">
                    {roll}°
                  </Badge>
                </div>
                <Slider
                  id="prim-roll"
                  min={-90}
                  max={90}
                  value={[roll]}
                  onValueChange={(value) => setRoll(value[0])}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}

// ============================================================================
// API Reference
// ============================================================================

const attitudeIndicatorProps: ApiProp[] = [
  {
    name: "pitch",
    type: "number",
    default: "0",
    description: "Pitch angle in degrees (-90 to 90). Positive is nose up",
  },
  {
    name: "roll",
    type: "number",
    default: "0",
    description: "Roll angle in degrees (-180 to 180). Positive is right wing down",
  },
  {
    name: "yaw",
    type: "number",
    default: "undefined",
    description: "Yaw/heading angle in degrees (0-360). Shows heading indicator if provided",
  },
  {
    name: "size",
    type: "number",
    default: "400",
    description: "Size of the indicator in pixels (width and height)",
  },
  {
    name: "showDegreeMarkers",
    type: "boolean",
    default: "true",
    description: "Show pitch degree markers on the horizon",
  },
  {
    name: "showRollScale",
    type: "boolean",
    default: "true",
    description: "Show roll angle scale around the edge",
  },
  {
    name: "showHeading",
    type: "boolean",
    default: "false",
    description: "Show heading indicator (requires yaw prop)",
  },
  {
    name: "animated",
    type: "boolean",
    default: "true",
    description: "Enable smooth animations for angle changes",
  },
  {
    name: "skyColor",
    type: "string",
    default: '"transparent"',
    description: "Color of the sky (upper half)",
  },
  {
    name: "groundColor",
    type: "string",
    default: '"#6b7280"',
    description: "Color of the ground (lower half)",
  },
  {
    name: "preferWebGPU",
    type: "boolean",
    default: "true",
    description: "Prefer WebGPU rendering over WebGL. Falls back automatically if unavailable",
  },
  {
    name: "className",
    type: "string",
    default: '""',
    description: "Additional CSS classes",
  },
];

const attitudeIndicatorRootProps: ApiProp[] = [
  {
    name: "pitch",
    type: "number",
    default: "0",
    description: "Pitch angle in degrees",
  },
  {
    name: "roll",
    type: "number",
    default: "0",
    description: "Roll angle in degrees",
  },
  {
    name: "yaw",
    type: "number",
    default: "undefined",
    description: "Yaw/heading angle in degrees",
  },
  {
    name: "size",
    type: "number",
    default: "400",
    description: "Indicator size in pixels",
  },
  {
    name: "animated",
    type: "boolean",
    default: "true",
    description: "Enable animations",
  },
  {
    name: "skyColor",
    type: "string",
    default: '"transparent"',
    description: "Sky color",
  },
  {
    name: "groundColor",
    type: "string",
    default: '"#6b7280"',
    description: "Ground color",
  },
  {
    name: "preferWebGPU",
    type: "boolean",
    default: "true",
    description: "Prefer WebGPU rendering",
  },
  {
    name: "children",
    type: "ReactNode",
    default: "undefined",
    description: "Primitive components (Horizon, Aircraft, RollScale, HeadingIndicator)",
  },
];

const attitudeIndicatorPrimitiveProps: ApiProp[] = [
  {
    name: "AttitudeIndicator.Horizon",
    type: "component",
    default: "-",
    description: "Renders the horizon line with pitch markers. Props: showDegreeMarkers?: boolean",
  },
  {
    name: "AttitudeIndicator.Aircraft",
    type: "component",
    default: "-",
    description: "Renders the fixed aircraft symbol in the center",
  },
  {
    name: "AttitudeIndicator.RollScale",
    type: "component",
    default: "-",
    description: "Renders the roll angle scale around the edge",
  },
  {
    name: "AttitudeIndicator.HeadingIndicator",
    type: "component",
    default: "-",
    description: "Renders the heading compass (requires yaw prop)",
  },
];

// ============================================================================
// Main Export
// ============================================================================

export function AttitudeIndicatorExamples() {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <BasicExample />

        <PrimitiveExample />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">API Reference</h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            AttitudeIndicator component for displaying aircraft/vehicle orientation (pitch, roll,
            yaw)
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AttitudeIndicator (All-in-One)</h3>
          <ApiReferenceTable props={attitudeIndicatorProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AttitudeIndicator.Root (Composable)</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Root component for building custom layouts with primitives
          </p>
          <ApiReferenceTable props={attitudeIndicatorRootProps} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Primitive Components</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use with AttitudeIndicator.Root for complete control over composition
          </p>
          <ApiReferenceTable props={attitudeIndicatorPrimitiveProps} />
        </div>
      </div>
    </div>
  );
}
