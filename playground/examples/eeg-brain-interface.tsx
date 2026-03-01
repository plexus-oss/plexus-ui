"use client";

import type { DataPoint } from "@plexusui/components/charts/heatmap-chart";
import { HeatmapChart } from "@plexusui/components/charts/heatmap-chart";
import { LineChart } from "@plexusui/components/charts/line-chart";
import { useEffect, useMemo, useState } from "react";
import { ComponentPreview } from "@/components/component-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// EEG Data Generation
// ============================================================================

/**
 * EEG frequency bands (medical standard)
 */
const EEG_BANDS = {
  delta: { range: [0.5, 4], label: "Delta (0.5-4 Hz)", color: "#6366f1" }, // Deep sleep
  theta: { range: [4, 8], label: "Theta (4-8 Hz)", color: "#8b5cf6" }, // Drowsiness, meditation
  alpha: { range: [8, 13], label: "Alpha (8-13 Hz)", color: "#ec4899" }, // Relaxed, eyes closed
  beta: { range: [13, 30], label: "Beta (13-30 Hz)", color: "#f59e0b" }, // Active thinking
  gamma: { range: [30, 50], label: "Gamma (30-50 Hz)", color: "#ef4444" }, // High cognitive activity
} as const;

/**
 * 10-20 EEG electrode positions (standard clinical placement)
 */
const ELECTRODE_POSITIONS = [
  { id: "Fp1", x: -20, y: 80, region: "frontal" },
  { id: "Fp2", x: 20, y: 80, region: "frontal" },
  { id: "F7", x: -60, y: 50, region: "frontal" },
  { id: "F3", x: -30, y: 50, region: "frontal" },
  { id: "Fz", x: 0, y: 50, region: "frontal" },
  { id: "F4", x: 30, y: 50, region: "frontal" },
  { id: "F8", x: 60, y: 50, region: "frontal" },
  { id: "T3", x: -80, y: 0, region: "temporal" },
  { id: "C3", x: -40, y: 0, region: "central" },
  { id: "Cz", x: 0, y: 0, region: "central" },
  { id: "C4", x: 40, y: 0, region: "central" },
  { id: "T4", x: 80, y: 0, region: "temporal" },
  { id: "T5", x: -60, y: -50, region: "temporal" },
  { id: "P3", x: -30, y: -50, region: "parietal" },
  { id: "Pz", x: 0, y: -50, region: "parietal" },
  { id: "P4", x: 30, y: -50, region: "parietal" },
  { id: "T6", x: 60, y: -50, region: "temporal" },
  { id: "O1", x: -20, y: -80, region: "occipital" },
  { id: "O2", x: 20, y: -80, region: "occipital" },
];

/**
 * Mental states with characteristic EEG patterns
 */
type MentalState = "resting" | "focused" | "drowsy" | "meditation" | "alert";

interface MentalStateProfile {
  delta: number; // Relative power
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

const MENTAL_STATE_PROFILES: Record<MentalState, MentalStateProfile> = {
  resting: { delta: 0.1, theta: 0.2, alpha: 0.5, beta: 0.15, gamma: 0.05 },
  focused: { delta: 0.05, theta: 0.1, alpha: 0.2, beta: 0.5, gamma: 0.15 },
  drowsy: { delta: 0.4, theta: 0.35, alpha: 0.15, beta: 0.08, gamma: 0.02 },
  meditation: { delta: 0.15, theta: 0.45, alpha: 0.25, beta: 0.1, gamma: 0.05 },
  alert: { delta: 0.05, theta: 0.1, alpha: 0.15, beta: 0.45, gamma: 0.25 },
};

/**
 * Generate realistic EEG signal with brain wave components
 * @param samples Number of samples to generate
 * @param sampleRate Sampling rate in Hz (typically 256 Hz for clinical EEG)
 * @param mentalState Current mental state affecting frequency band amplitudes
 */
function generateEEGSignal(
  samples: number,
  sampleRate: number,
  mentalState: MentalState = "resting"
): number[] {
  const signal = new Array(samples).fill(0);
  const profile = MENTAL_STATE_PROFILES[mentalState];

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;

    // Delta (0.5-4 Hz) - Deep sleep, unconscious
    const deltaFreq = 0.5 + Math.random() * 3.5;
    signal[i] += profile.delta * 50 * Math.sin(2 * Math.PI * deltaFreq * t);

    // Theta (4-8 Hz) - Drowsiness, meditation
    const thetaFreq = 4 + Math.random() * 4;
    signal[i] += profile.theta * 40 * Math.sin(2 * Math.PI * thetaFreq * t);

    // Alpha (8-13 Hz) - Relaxed, eyes closed (dominant in resting state)
    const alphaFreq = 8 + Math.random() * 5;
    signal[i] +=
      profile.alpha * 60 * Math.sin(2 * Math.PI * alphaFreq * t + Math.random() * Math.PI);

    // Beta (13-30 Hz) - Active thinking, focus
    const betaFreq = 13 + Math.random() * 17;
    signal[i] += profile.beta * 30 * Math.sin(2 * Math.PI * betaFreq * t);

    // Gamma (30-50 Hz) - High-level cognitive processing
    const gammaFreq = 30 + Math.random() * 20;
    signal[i] += profile.gamma * 20 * Math.sin(2 * Math.PI * gammaFreq * t);

    // Physiological artifacts
    // Eye blinks (0.5-2 Hz, occasional large spikes)
    if (Math.random() < 0.001) {
      signal[i] += (Math.random() - 0.5) * 200;
    }

    // Muscle artifacts (20-300 Hz, random bursts)
    if (Math.random() < 0.01) {
      signal[i] += (Math.random() - 0.5) * 30;
    }

    // Electrical noise (50/60 Hz line noise)
    signal[i] += (Math.random() - 0.5) * 5;
  }

  return signal;
}

/**
 * Calculate power spectral density for a frequency band
 */
function calculateBandPower(
  signal: number[],
  sampleRate: number,
  bandRange: [number, number]
): number {
  // Simplified FFT-based band power calculation
  // In production, use a proper FFT implementation
  const [minFreq, maxFreq] = bandRange;
  let power = 0;
  let count = 0;

  // Simple frequency domain estimation
  for (let freq = minFreq; freq <= maxFreq; freq += 0.5) {
    let sum = 0;
    for (let i = 0; i < Math.min(signal.length, 1000); i++) {
      const t = i / sampleRate;
      sum += signal[i] * Math.sin(2 * Math.PI * freq * t);
    }
    power += sum * sum;
    count++;
  }

  return Math.sqrt(power / count);
}

// ============================================================================
// EEG Brain-Computer Interface Dashboard
// ============================================================================

function EEGMonitoringDashboard() {
  const SAMPLE_RATE = 256; // Standard EEG sampling rate (256 Hz)
  const WINDOW_DURATION = 10; // seconds
  const SAMPLES_PER_WINDOW = SAMPLE_RATE * WINDOW_DURATION;
  const NUM_CHANNELS = 8; // Using 8 channels for demo

  const [isRecording, setIsRecording] = useState(true);
  const [mentalState, setMentalState] = useState<MentalState>("resting");
  const [selectedChannel, setSelectedChannel] = useState(0);

  // Multi-channel EEG data
  const [channelData, setChannelData] = useState<number[][]>(() =>
    Array.from({ length: NUM_CHANNELS }, () =>
      generateEEGSignal(SAMPLES_PER_WINDOW, SAMPLE_RATE, mentalState)
    )
  );

  // Electrode spatial activity (for heatmap)
  const [electrodeActivity, setElectrodeActivity] = useState<DataPoint[]>([]);

  // Real-time recording simulation
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      // Generate new EEG data for all channels
      const newChannelData = Array.from({ length: NUM_CHANNELS }, () =>
        generateEEGSignal(SAMPLES_PER_WINDOW, SAMPLE_RATE, mentalState)
      );

      setChannelData(newChannelData);

      // Update electrode activity heatmap
      const activity: DataPoint[] = ELECTRODE_POSITIONS.map((electrode, idx) => {
        // Use cyclic channel assignment
        const channelIdx = idx % NUM_CHANNELS;
        const channelSignal = newChannelData[channelIdx];

        // Calculate alpha band power as proxy for activity level
        const alphaPower = calculateBandPower(
          channelSignal.slice(-512),
          SAMPLE_RATE,
          EEG_BANDS.alpha.range as [number, number]
        );

        return {
          x: electrode.x,
          y: electrode.y,
          value: alphaPower,
        };
      });

      setElectrodeActivity(activity);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isRecording, mentalState, SAMPLES_PER_WINDOW]);

  // Prepare multi-channel line chart data
  const multiChannelData = useMemo(
    () =>
      channelData.map((data, idx) => ({
        label: `Channel ${idx + 1}`,
        data: data.slice(-512).map((y, i) => ({
          x: i / SAMPLE_RATE,
          y: y + idx * 150, // Offset for visibility
        })),
        color: [
          "#3b82f6",
          "#8b5cf6",
          "#ec4899",
          "#f59e0b",
          "#10b981",
          "#06b6d4",
          "#6366f1",
          "#a855f7",
        ][idx % 8],
      })),
    [channelData]
  );

  return (
    <ComponentPreview
      title="EEG Brain-Computer Interface - Medical Device Monitoring"
      description="Real-time neurological monitoring with 256 Hz multi-channel EEG, frequency band analysis (Delta/Theta/Alpha/Beta/Gamma), and spatial activity mapping using the 10-20 electrode system."
      code={`import { WaterfallChart } from "@/components/plexusui/charts/waterfall-chart";
import { LineChart } from "@/components/plexusui/charts/line-chart";
import { HeatmapChart } from "@/components/plexusui/charts/heatmap-chart";

// Generate 8-channel EEG data at 256 Hz
const channelData = Array.from({ length: 8 }, () =>
  generateEEGSignal(2560, 256, mentalState)
);

// Medical-grade monitoring dashboard
<div className="grid grid-cols-2 gap-4">

  {/* Multi-channel raw EEG */}
  <LineChart
    series={channelData.map((data, idx) => ({
      label: \`Channel \${idx + 1}\`,
      data: data.map((y, x) => ({ x, y: y + idx * 150 }))
    }))}
  />

  {/* Spatial electrode activity */}
  <HeatmapChart
    data={electrodeActivity}
    xAxis={{ label: "Left ← → Right" }}
    yAxis={{ label: "Back ← → Front" }}
  />
</div>`}
      preview={
        <div className="w-full space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">EEG Session - Subject 001</CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    Sample Rate: {SAMPLE_RATE} Hz | Channels: {NUM_CHANNELS} | 10-20 Electrode
                    System
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={mentalState}
                    onChange={(e) => setMentalState(e.target.value as MentalState)}
                    className="px-3 py-2 rounded-md border bg-background"
                  >
                    <option value="resting">Resting (Eyes Closed)</option>
                    <option value="focused">Focused (Task Active)</option>
                    <option value="drowsy">Drowsy (Pre-Sleep)</option>
                    <option value="meditation">Meditation</option>
                    <option value="alert">Alert (Eyes Open)</option>
                  </select>
                  <Badge variant={isRecording ? "default" : "outline"} className="text-sm">
                    {isRecording ? "🔴 Recording" : "⏸ Paused"}
                  </Badge>
                  <Button
                    variant={isRecording ? "outline" : "default"}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? "⏸ Pause" : "▶ Resume"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {Object.entries(EEG_BANDS).map(([key, band]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: band.color }} />
                    <span className="text-xs">{band.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main EEG Panels */}
          <div className="grid grid-cols-2 gap-4">
            {/* Frequency Band Analysis */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-normal text-muted-foreground">
                    Frequency Band Analysis - Channel {selectedChannel + 1}
                  </CardTitle>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(Number(e.target.value))}
                    className="px-2 py-1 text-xs rounded-md border bg-background"
                  >
                    {Array.from({ length: NUM_CHANNELS }, (_, i) => (
                      <option key={i} value={i}>
                        Channel {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
            </Card>

            {/* Spatial Activity Map */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Electrode Spatial Activity - 10-20 System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs text-center text-muted-foreground">
                    <div>← Left Hemisphere | Right Hemisphere →</div>
                    <div>← Posterior (Back) | Anterior (Front) →</div>
                  </div>
                  <div className="w-full h-[370px]">
                    <HeatmapChart
                      data={electrodeActivity}
                      xAxis={{ label: "" }}
                      yAxis={{ label: "" }}
                      width="100%"
                      height={370}
                      minValue={0}
                      maxValue={100}
                      showTooltip
                      preferWebGPU
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Multi-Channel Time Series */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Multi-Channel Raw EEG - Last 2 Seconds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px]">
                <LineChart
                  series={multiChannelData.map((data) => ({
                    name: data.label,
                    data: data.data,
                    color: data.color,
                  }))}
                  xAxis={{
                    label: "Time (s)",
                    formatter: (v: number | string) => {
                      const num = typeof v === "number" ? v : parseFloat(String(v));
                      return `${num.toFixed(2)}s`;
                    },
                  }}
                  yAxis={{ label: "Amplitude (µV)" }}
                  width="100%"
                  height={400}
                  showAxes
                  showTooltip
                  preferWebGPU
                />
              </div>
              <div className="text-xs text-muted-foreground text-center mt-2">
                Channels are vertically offset for visualization. Each channel represents a
                different electrode location.
              </div>
            </CardContent>
          </Card>

          {/* Mental State Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Current Mental State Profile - Frequency Band Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(MENTAL_STATE_PROFILES[mentalState]).map(([band, power]) => (
                  <div key={band} className="text-center">
                    <div className="text-xs text-muted-foreground capitalize">{band}</div>
                    <div className="mt-2 mb-1">
                      <div className="h-24 bg-muted rounded flex items-end">
                        <div
                          className="w-full rounded transition-all"
                          style={{
                            height: `${power * 100}%`,
                            backgroundColor: EEG_BANDS[band as keyof typeof EEG_BANDS].color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-lg font-mono font-bold">{(power * 100).toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">
                      {EEG_BANDS[band as keyof typeof EEG_BANDS].range[0]}-
                      {EEG_BANDS[band as keyof typeof EEG_BANDS].range[1]} Hz
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}

// ============================================================================
// Main Export
// ============================================================================

export function EegBrainInterfaceExamples() {
  return (
    <div className="space-y-8">
      <EEGMonitoringDashboard />
    </div>
  );
}
