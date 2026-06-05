import React from "react";

const shimmer = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

const baseStyle = {
  background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

export function SkeletonCard({ height = 200, width = "100%" as string | number, style = {} }: any) {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ ...baseStyle, height, width, borderRadius: 16, ...style }} />
    </>
  );
}

export function SkeletonText({ lines = 1, style = {} }: any) {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              ...baseStyle,
              height: 16,
              width: i === lines - 1 && lines > 1 ? "60%" : "100%",
              borderRadius: 4,
            }}
          />
        ))}
      </div>
    </>
  );
}

export function SkeletonCircle({ size = 48, style = {} }: any) {
  return (
    <>
      <style>{shimmer}</style>
      <div
        style={{
          ...baseStyle,
          height: size,
          width: size,
          borderRadius: "50%",
          ...style,
        }}
      />
    </>
  );
}

export function SkeletonMetricCard() {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <SkeletonCircle size={40} />
        <SkeletonText lines={1} style={{ flex: 1 }} />
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonChart({ height = 300 }: any) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 24, height, display: "flex", flexDirection: "column" }}>
      <SkeletonText lines={1} style={{ width: "30%", marginBottom: 24 }} />
      <div style={{ flex: 1, ...baseStyle, borderRadius: 12, opacity: 0.5 }} />
    </div>
  );
}

export function SkeletonReceita() {
  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden" }}>
      <SkeletonCard height={140} width="100%" style={{ borderRadius: 0 }} />
      <div style={{ padding: 16 }}>
        <SkeletonText lines={2} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <SkeletonCard height={24} width={60} style={{ borderRadius: 12 }} />
          <SkeletonCard height={24} width={60} style={{ borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPedido() {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <SkeletonText lines={1} style={{ width: "40%" }} />
        <SkeletonCard height={24} width={80} style={{ borderRadius: 12 }} />
      </div>
      <SkeletonText lines={2} style={{ marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <SkeletonCircle size={32} />
        <div style={{ flex: 1 }}>
          <SkeletonText lines={1} />
        </div>
      </div>
    </div>
  );
}
