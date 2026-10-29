import {
  Easing,
  Img,
  Interactive,
  Sequence,
  Track,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";

const NAVY = "#10264f";
const DEEP = "#07142e";
const TEAL = "#10b99b";
const BLUE = "#6584f4";
const PALE = "#eaf2f8";
const WHITE = "#ffffff";
const FONT = "Arial, Helvetica, sans-serif";
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const Wordmark = ({ dark = false }: { dark?: boolean }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      color: dark ? NAVY : WHITE,
      fontFamily: FONT,
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: -1.2,
    }}
  >
    <Img
      src={staticFile("assets/checkedin-mark.png")}
      style={{ width: 54, height: 54, objectFit: "contain" }}
    />
    CheckedIn
  </div>
);

const Eyebrow = ({ children, dark = false }: { children: string; dark?: boolean }) => (
  <div
    style={{
      color: dark ? "#64799a" : "#9eb3d4",
      fontFamily: FONT,
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: 5,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const DotField = ({ color = "#91a9d8" }: { color?: string }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity: 0.15,
      backgroundImage: `radial-gradient(${color} 1.4px, transparent 1.4px)`,
      backgroundSize: "32px 32px",
      maskImage: "linear-gradient(90deg, transparent, black 48%, transparent)",
      pointerEvents: "none",
    }}
  />
);

const QrCode = ({ size = 230 }: { size?: number }) => {
  const cells = [
    "1111111000101111111",
    "1000001010101000001",
    "1011101001101011101",
    "1011101010001011101",
    "1011101001101011101",
    "1000001010101000001",
    "1111111010101111111",
    "0000000011100000000",
    "1010111100101101010",
    "0101000111010011100",
    "1110101100110101011",
    "0011010011101011000",
    "1111111001101010111",
    "1000001010110001001",
    "1011101011001111101",
    "1011101000110100100",
    "1011101011101101111",
    "1000001001010010001",
    "1111111010101110111",
  ];

  return (
    <svg viewBox="0 0 210 210" width={size} height={size} aria-label="Decorative QR code">
      <rect width="210" height="210" rx="14" fill="white" />
      {cells.flatMap((row, y) =>
        [...row].flatMap((cell, x) =>
          cell === "1" ? (
            <rect
              key={`${x}-${y}`}
              x={x * 10 + 10}
              y={y * 10 + 10}
              width="8"
              height="8"
              rx="1.5"
              fill={NAVY}
            />
          ) : [],
        ),
      )}
    </svg>
  );
};

const OpeningInner = () => {
  const frame = useCurrentFrame();

  return (
    <>
      <DotField />
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          border: `1px solid rgba(101,132,244,${interpolate(frame, [0, 30, 120], [0.15, 0.55, 0.12], { extrapolateRight: "clamp" })})`,
          borderRadius: "50%",
          left: 1090,
          top: 120,
          scale:
            interpolate(frame, [0, 110], [0.72, 1.12], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            }) +
            Math.sin(frame / 32) * 0.012,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 210,
          top: 276,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,155,.24), rgba(16,185,155,0) 68%)",
          scale: interpolate(frame, [0, 25], [0.45, 1], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <div style={{ position: "absolute", left: 138, top: 92 }}>
        <Wordmark />
      </div>
      <div style={{ position: "absolute", left: 150, top: 290 }}>
        <Eyebrow>Every moment, accounted for</Eyebrow>
      </div>
      <div
        style={{
          position: "absolute",
          left: 138,
          top: 360,
          color: WHITE,
          fontFamily: FONT,
          fontSize: 154,
          lineHeight: 0.95,
          fontWeight: 800,
          letterSpacing: -8,
          opacity: interpolate(frame, [4, 22], [0, 1], {
            extrapolateRight: "clamp",
            easing: easeOut,
          }),
          translate: `0px ${interpolate(frame, [4, 22], [54, 0], {
            extrapolateRight: "clamp",
            easing: easeOut,
          })}px`,
        }}
      >
        SHOW UP.
        <br />
        <span style={{ color: TEAL }}>MAKE IT COUNT.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 760,
          color: "#b4c2da",
          fontFamily: FONT,
          fontSize: 28,
          letterSpacing: 0.4,
          opacity: interpolate(frame, [26, 40], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Campus life, in sync.
      </div>
      <div
        style={{
          position: "absolute",
          right: 330,
          top: 394,
          width: 176,
          height: 176,
          border: "2px solid rgba(255,255,255,.24)",
          borderRadius: "50%",
          scale: interpolate(frame, [0, 18], [0, 1], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 399,
          top: 463,
          width: 38,
          height: 38,
          borderRadius: "50%",
          backgroundColor: TEAL,
          boxShadow: "0 0 44px rgba(16,185,155,.7)",
          scale:
            interpolate(frame, [0, 13], [0, 1], {
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }) *
            (1 + Math.sin(frame / 10) * 0.04),
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 108,
          bottom: 76,
          color: "#8797b3",
          fontFamily: FONT,
          fontSize: 16,
          letterSpacing: 4,
        }}
      >
        01 — A BETTER WAY TO SHOW UP
      </div>
    </>
  );
};

const ScanInner = () => {
  const frame = useCurrentFrame();

  return (
    <>
      <DotField color={NAVY} />
      <div style={{ position: "absolute", left: 150, top: 170 }}>
        <Eyebrow dark>Fast in. Fully present.</Eyebrow>
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 250,
          width: 740,
          color: NAVY,
          fontFamily: FONT,
          fontSize: 112,
          lineHeight: 0.98,
          fontWeight: 800,
          letterSpacing: -6,
        }}
      >
        One scan.
        <br />
        <span style={{ color: TEAL }}>You're there.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 154,
          top: 520,
          width: 590,
          color: "#526987",
          fontFamily: FONT,
          fontSize: 30,
          lineHeight: 1.45,
        }}
      >
        Find the event. Scan the code.
        <br />
        Get back to what matters.
      </div>
      <div
        style={{
          position: "absolute",
          right: 260,
          top: 160,
          width: 530,
          height: 790,
          borderRadius: 72,
          border: `11px solid ${NAVY}`,
          backgroundColor: "#fff",
          boxShadow: "0 35px 100px rgba(16,38,79,.2)",
          rotate: `${-4 + Math.sin(frame / 30) * 0.45}deg`,
          overflow: "hidden",
          translate: `0px ${interpolate(frame, [0, 24], [100, 0], {
            extrapolateRight: "clamp",
            easing: easeOut,
          }) + Math.sin(frame / 32) * 6}px`,
          opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 152,
            height: 24,
            borderRadius: 18,
            backgroundColor: NAVY,
            top: 24,
            left: "50%",
            translate: "-50% 0px",
          }}
        />
        <div style={{ position: "absolute", left: 52, top: 106 }}>
          <Wordmark dark />
        </div>
        <div style={{ position: "absolute", left: 52, top: 226 }}>
          <Eyebrow dark>Your next event</Eyebrow>
        </div>
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 265,
            color: NAVY,
            fontFamily: FONT,
            fontSize: 37,
            fontWeight: 700,
          }}
        >
          Welcome Week
        </div>
        <div
          style={{
            position: "absolute",
            left: 50,
            top: 320,
            color: "#64799a",
            fontFamily: FONT,
            fontSize: 22,
          }}
        >
          Scan to check in
        </div>
        <div
          style={{
            position: "absolute",
            left: 145,
            top: 392,
            border: "4px solid #dce8f0",
            borderRadius: 24,
            padding: 10,
            boxShadow: "0 16px 32px rgba(16,38,79,.1)",
          }}
        >
          <QrCode size={218} />
          <div
            style={{
              position: "absolute",
              left: 10,
              right: 10,
              height: 3,
              top: 114 + Math.sin(frame / 28) * 96,
              backgroundColor: TEAL,
              boxShadow: "0 0 18px rgba(16,185,155,.9)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 48,
            right: 48,
            bottom: 46,
            height: 70,
            borderRadius: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: WHITE,
            backgroundColor: TEAL,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 21,
            letterSpacing: 1.2,
          }}
        >
          CHECK IN
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          bottom: 92,
          color: "#7083a1",
          fontFamily: FONT,
          fontSize: 16,
          letterSpacing: 4,
        }}
      >
        02 — QUICK, CLEAR, DONE
      </div>
    </>
  );
};

const LocationInner = () => {
  const frame = useCurrentFrame();

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 70% 50%, rgba(16,185,155,.16), transparent 42%), linear-gradient(135deg, #08162f 0%, #10264f 100%)",
        }}
      />
      <DotField />
      <div style={{ position: "absolute", left: 146, top: 170 }}>
        <Eyebrow>Verified, not complicated</Eyebrow>
      </div>
      <div
        style={{
          position: "absolute",
          left: 138,
          top: 250,
          color: WHITE,
          fontFamily: FONT,
          fontSize: 98,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: -5,
        }}
      >
        The right place.
        <br />
        <span style={{ color: TEAL }}>The real you.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 500,
          color: "#b4c2da",
          fontFamily: FONT,
          fontSize: 28,
          lineHeight: 1.5,
        }}
      >
        Location-aware check-in.
        <br />
        A live selfie. A trusted arrival.
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 690,
          display: "flex",
          gap: 16,
        }}
      >
        {["GPS VERIFIED", "SELFIE CHECK"].map((label, index) => (
          <div
            key={label}
            style={{
              padding: "16px 22px",
              border: "1px solid rgba(255,255,255,.22)",
              borderRadius: 30,
              color: WHITE,
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 1.7,
              backgroundColor: "rgba(255,255,255,.06)",
              opacity: interpolate(frame, [24 + index * 8, 40 + index * 8], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <span style={{ color: TEAL }}>●</span> {label}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: 208,
          top: 168,
          width: 484,
          height: 744,
          border: "10px solid #e8f2f7",
          borderRadius: 62,
          backgroundColor: "#f7fbfd",
          boxShadow: "0 35px 90px rgba(0,0,0,.35)",
          rotate: `${5 + Math.sin(frame / 36) * 0.35}deg`,
          overflow: "hidden",
          translate: `0px ${interpolate(frame, [0, 24], [70, 0], {
            extrapolateRight: "clamp",
            easing: easeOut,
          }) + Math.sin(frame / 34) * 7}px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 0 37% 0",
            background:
              "linear-gradient(35deg, transparent 48%, rgba(16,185,155,.3) 49%, rgba(16,185,155,.3) 50%, transparent 51%), linear-gradient(130deg, transparent 48%, rgba(101,132,244,.22) 49%, rgba(101,132,244,.22) 50%, transparent 51%), #eaf2f8",
            backgroundSize: "100% 100%, 100% 100%, auto",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 66,
            top: 130,
            width: 350,
            height: 350,
            border: "2px solid rgba(16,185,155,.45)",
            borderRadius: "50%",
            scale:
              interpolate(frame, [0, 95], [0.65, 1.1], {
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }) +
              Math.sin(frame / 35) * 0.012,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 226,
            top: 275,
            width: 34,
            height: 34,
            borderRadius: "50%",
            backgroundColor: TEAL,
            border: "8px solid white",
            boxShadow: "0 6px 22px rgba(16,38,79,.24)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 34,
            right: 34,
            bottom: 38,
            height: 218,
            padding: 26,
            boxSizing: "border-box",
            borderRadius: 28,
            backgroundColor: WHITE,
            boxShadow: "0 12px 34px rgba(16,38,79,.12)",
          }}
        >
          <Eyebrow dark>Arrived at event</Eyebrow>
          <div
            style={{
              marginTop: 18,
              color: NAVY,
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Welcome Week
          </div>
          <div
            style={{
              marginTop: 18,
              color: TEAL,
              fontFamily: FONT,
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: 0.8,
              opacity:
                interpolate(frame, [30, 48], [0, 1], { extrapolateRight: "clamp" }) *
                (0.92 + Math.sin(frame / 18) * 0.08),
            }}
          >
            ✓ CHECKED IN · VERIFIED
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 110,
          bottom: 72,
          color: "#8797b3",
          fontFamily: FONT,
          fontSize: 16,
          letterSpacing: 4,
        }}
      >
        03 — THE ARRIVAL, VERIFIED
      </div>
    </>
  );
};

const LiveInner = () => {
  const frame = useCurrentFrame();
  const count = Math.round(
    interpolate(frame, [0, 145], [0, 246], { extrapolateRight: "clamp", easing: easeOut }),
  );
  const bars = [34, 48, 42, 68, 56, 78, 64, 92, 74, 100, 86, 112];

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(125deg, #edf4f8 0%, #ffffff 56%, #dcebf1 100%)",
        }}
      />
      <DotField color={NAVY} />
      <div style={{ position: "absolute", left: 140, top: 118 }}>
        <Wordmark dark />
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 275,
          color: NAVY,
          fontFamily: FONT,
          fontSize: 78,
          fontWeight: 800,
          letterSpacing: -4,
        }}
      >
        One room.
        <br />
        Everyone in sync.
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 515,
          color: "#64799a",
          fontFamily: FONT,
          fontSize: 25,
          lineHeight: 1.45,
        }}
      >
        Attendance updates live.
        <br />
        The whole team sees the moment.
      </div>
      <div
        style={{
          position: "absolute",
          left: 142,
          top: 690,
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          color: NAVY,
          fontFamily: FONT,
        }}
      >
        <span style={{ fontSize: 78, fontWeight: 800, letterSpacing: -3 }}>{count}</span>
        <span style={{ color: "#64799a", fontSize: 27 }}>verified arrivals</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 900,
          top: 188,
          width: 830,
          height: 690,
          borderRadius: 36,
          backgroundColor: WHITE,
          border: "1px solid #d7e2ec",
          boxShadow: "0 30px 80px rgba(16,38,79,.14)",
          overflow: "hidden",
          translate: `0px ${interpolate(frame, [0, 22], [60, 0], {
            extrapolateRight: "clamp",
            easing: easeOut,
          })}px`,
        }}
      >
        <div
          style={{
            height: 90,
            padding: "0 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e6edf2",
          }}
        >
          <div
            style={{
              color: NAVY,
              fontFamily: FONT,
              fontSize: 23,
              fontWeight: 700,
            }}
          >
            EVENT WORKSPACE
          </div>
          <div
            style={{
              padding: "12px 19px",
              borderRadius: 24,
              backgroundColor: "#e5f7f3",
              color: "#008c78",
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 1.5,
              opacity: 0.82 + Math.sin(frame / 22) * 0.12,
            }}
          >
            ● LIVE
          </div>
        </div>
        <div
          style={{
            margin: "38px 40px 0",
            height: 350,
            borderRadius: 26,
            padding: 36,
            boxSizing: "border-box",
            background: "linear-gradient(135deg, #f0f5fa 0%, #e1f1f1 100%)",
          }}
        >
          <Eyebrow dark>Welcome Week · Today, 5:30 PM</Eyebrow>
          <div
            style={{
              marginTop: 20,
              color: NAVY,
              fontFamily: FONT,
              fontSize: 35,
              fontWeight: 700,
            }}
          >
            Attendance at a glance
          </div>
          <div
            style={{
              position: "absolute",
              left: 52,
              top: 244,
              width: 610,
              height: 220,
              display: "flex",
              alignItems: "end",
              gap: 20,
            }}
          >
            {bars.map((height, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: `${height * interpolate(frame, [4, 45], [0.1, 1], {
                    extrapolateRight: "clamp",
                    easing: easeOut,
                  }) * (1 + Math.sin(frame / 22 + index * 0.7) * 0.035)}%`,
                  borderRadius: "10px 10px 2px 2px",
                  background:
                    index > 8 ? `linear-gradient(180deg, ${TEAL}, #62d9bf)` : "#9eb4f2",
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 42,
            bottom: 36,
            color: "#71829b",
            fontFamily: FONT,
            fontSize: 17,
          }}
        >
          Verified arrivals · live event pulse · clear reporting
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 110,
          bottom: 76,
          color: "#7083a1",
          fontFamily: FONT,
          fontSize: 16,
          letterSpacing: 4,
        }}
      >
        04 — FROM CHECK-IN TO BIG PICTURE
      </div>
    </>
  );
};

const OfflineInner = () => {
  const frame = useCurrentFrame();
  const synced = interpolate(frame, [0, 35], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const rows = [
    ["WELCOME WEEK", "5:32 PM"],
    ["DESIGN SOCIAL", "6:08 PM"],
    ["CLUB MEETUP", "6:41 PM"],
  ];

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 75% 48%, rgba(101,132,244,.2), transparent 40%), #08162f",
        }}
      />
      <DotField />
      <div style={{ position: "absolute", left: 150, top: 174 }}>
        <Eyebrow>Built for real campus days</Eyebrow>
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 252,
          color: WHITE,
          fontFamily: FONT,
          fontSize: 102,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: -5,
        }}
      >
        No signal?
        <br />
        <span style={{ color: BLUE }}>Still checked in.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 152,
          top: 500,
          color: "#b4c2da",
          fontFamily: FONT,
          fontSize: 27,
          lineHeight: 1.45,
        }}
      >
        Check in offline. Your attendance
        <br />
        syncs when you're back online.
      </div>
      <div
        style={{
          position: "absolute",
          right: 208,
          top: 178,
          width: 670,
          height: 710,
          borderRadius: 36,
          border: "1px solid rgba(255,255,255,.18)",
          backgroundColor: "rgba(255,255,255,.07)",
          boxShadow: "0 30px 90px rgba(0,0,0,.3)",
          padding: 38,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: WHITE,
            fontFamily: FONT,
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: 1.8,
          }}
        >
          <span style={{ color: "#ffcc69" }}>●</span>
          OFFLINE ATTENDANCE QUEUE
        </div>
        <div
          style={{
            marginTop: 20,
            color: "#aebcda",
            fontFamily: FONT,
            fontSize: 20,
          }}
        >
          Your check-ins are safe on this device.
        </div>
        {rows.map(([event, time], index) => (
          <div
            key={event}
            style={{
              position: "relative",
              marginTop: 28,
              height: 94,
              borderRadius: 20,
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid rgba(255,255,255,.11)",
              backgroundColor: "rgba(255,255,255,.05)",
              color: WHITE,
              fontFamily: FONT,
              opacity: interpolate(frame, [index * 8, 17 + index * 8], [0, 1], {
                extrapolateRight: "clamp",
                easing: easeOut,
              }),
              translate: `0px ${interpolate(frame, [index * 8, 17 + index * 8], [30, 0], {
                extrapolateRight: "clamp",
                easing: easeOut,
              })}px`,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1.2 }}>{event}</div>
              <div style={{ marginTop: 8, color: "#aebcda", fontSize: 17 }}>{time}</div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: DEEP,
                backgroundColor: TEAL,
                scale: synced * (1 + Math.sin(frame / 20 + index) * 0.025),
              }}
            >
              ✓
            </div>
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            bottom: 38,
            height: 68,
            borderRadius: 38,
            padding: "0 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: synced > 0.9 ? "rgba(16,185,155,.16)" : "rgba(255,255,255,.08)",
            color: synced > 0.9 ? "#7be3cd" : "#ffcc69",
            fontFamily: FONT,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: 1,
            opacity: synced > 0.9 ? 0.86 + Math.sin(frame / 18) * 0.12 : 1,
          }}
        >
          <span>{synced > 0.9 ? "SYNC COMPLETE" : "WAITING FOR CONNECTION"}</span>
          <span>{synced > 0.9 ? "✓" : "···"}</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 108,
          bottom: 76,
          color: "#8797b3",
          fontFamily: FONT,
          fontSize: 16,
          letterSpacing: 4,
        }}
      >
        05 — READY WHEN THE NETWORK ISN'T
      </div>
    </>
  );
};

const CommunityInner = () => {
  const frame = useCurrentFrame();
  const cards = [
    { title: "Welcome Week", label: "CAMPUS · TODAY", color: "#c6f1e9", accent: TEAL },
    { title: "Creative Meetup", label: "DESIGN CLUB · 5:30", color: "#e0e7ff", accent: BLUE },
    { title: "Find your people.", label: "HAPPENING TOGETHER", color: "#ffebca", accent: "#ea9c32" },
  ];

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #f4f7ff, #e8f2f7 58%, #d6f1ec)",
        }}
      />
      <DotField color={NAVY} />
      <div style={{ position: "absolute", left: 150, top: 180 }}>
        <Eyebrow dark>Campus is more than a calendar</Eyebrow>
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 265,
          color: NAVY,
          fontFamily: FONT,
          fontSize: 102,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: -5,
        }}
      >
        Find your
        <br />
        <span style={{ color: TEAL }}>next thing.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 515,
          color: "#64799a",
          fontFamily: FONT,
          fontSize: 28,
          lineHeight: 1.45,
        }}
      >
        Discover events. Meet your people.
        <br />
        Make campus feel like yours.
      </div>
      <div style={{ position: "absolute", left: 150, top: 690 }}>
        <Wordmark dark />
      </div>
      {cards.map((card, index) => (
        <div
          key={card.title}
          style={{
            position: "absolute",
            right: 192 + index * 62,
            top: 180 + index * 34,
            width: 490,
            height: 610,
            borderRadius: 36,
            padding: 38,
            boxSizing: "border-box",
            backgroundColor: card.color,
            boxShadow: "0 30px 70px rgba(16,38,79,.17)",
            rotate: `${(index === 0 ? -7 : index === 1 ? 2 : 8) + Math.sin(frame / 40 + index) * 0.45}deg`,
            translate: `0px ${interpolate(frame, [index * 8, 28 + index * 8], [150, 0], {
              extrapolateRight: "clamp",
              easing: easeOut,
            }) + Math.sin(frame / 32 + index * 2) * 8}px`,
            scale: interpolate(frame, [index * 8, 28 + index * 8], [0.86, 1], {
              extrapolateRight: "clamp",
              easing: easeOut,
            }),
          }}
        >
          <div
            style={{
              color: "#58708e",
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 2.4,
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              marginTop: 24,
              color: NAVY,
              fontFamily: FONT,
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: -1.5,
            }}
          >
            {card.title}
          </div>
          <div
            style={{
              position: "absolute",
              left: 38,
              right: 38,
              top: 180,
              height: 300,
              borderRadius: 28,
              background: `radial-gradient(circle at 70% 28%, ${card.accent} 0 12%, transparent 13%), linear-gradient(145deg, rgba(255,255,255,.68), rgba(255,255,255,.14))`,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 176,
                height: 176,
                left: 116,
                top: 64,
                borderRadius: "50%",
                border: `2px solid ${card.accent}70`,
                opacity: 0.9,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 26,
                bottom: 24,
                padding: "14px 18px",
                borderRadius: 24,
                color: WHITE,
                backgroundColor: card.accent,
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1.5,
              }}
            >
              JOIN THE MOMENT
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 34,
              left: 38,
              right: 38,
              display: "flex",
              justifyContent: "space-between",
              color: NAVY,
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <span>EVENT DETAILS</span>
            <span style={{ color: card.accent }}>↗</span>
          </div>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          right: 110,
          bottom: 74,
          color: "#7083a1",
          fontFamily: FONT,
          fontSize: 16,
          letterSpacing: 4,
        }}
      >
        06 — BELONGING, BUILT IN
      </div>
    </>
  );
};

const FinaleInner = () => {
  const frame = useCurrentFrame();

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(101,132,244,.22), transparent 48%), #07142e",
        }}
      />
      <DotField />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 220,
          translate: "-50% 0px",
          textAlign: "center",
          scale: interpolate(frame, [0, 26], [0.84, 1], {
            extrapolateRight: "clamp",
            easing: easeOut,
          }),
          opacity: interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Wordmark />
        </div>
        <div
          style={{
            marginTop: 64,
            color: WHITE,
            fontFamily: FONT,
            fontSize: 95,
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: -4.5,
          }}
        >
          Show up.
          <br />
          <span style={{ color: TEAL }}>Make it count.</span>
        </div>
        <div
          style={{
            marginTop: 35,
            color: "#b4c2da",
            fontFamily: FONT,
            fontSize: 24,
            letterSpacing: 1,
          }}
        >
          CAMPUS LIFE, IN SYNC.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 112,
          display: "flex",
          justifyContent: "center",
          gap: 30,
          color: "#99abc7",
          fontFamily: FONT,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 3,
          opacity: interpolate(frame, [28, 48], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span>STUDENTS</span>
        <span style={{ color: TEAL }}>•</span>
        <span>FACULTY</span>
        <span style={{ color: TEAL }}>•</span>
        <span>ORGANIZATIONS</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 175,
          width: 650,
          height: 650,
          border: "1px solid rgba(101,132,244,.28)",
          borderRadius: "50%",
          translate: "-50% 0px",
          scale:
            interpolate(frame, [0, 140], [0.72, 1.08], {
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }) +
            Math.sin(frame / 32) * 0.012,
        }}
      />
    </>
  );
};

export const OpeningScene = Interactive.create({
  Component: OpeningInner,
  layout: "absolute-fill",
});
export const ScanScene = Interactive.create({
  Component: ScanInner,
  layout: "absolute-fill",
});
export const LocationScene = Interactive.create({
  Component: LocationInner,
  layout: "absolute-fill",
});
export const LiveScene = Interactive.create({
  Component: LiveInner,
  layout: "absolute-fill",
});
export const OfflineScene = Interactive.create({
  Component: OfflineInner,
  layout: "absolute-fill",
});
export const CommunityScene = Interactive.create({
  Component: CommunityInner,
  layout: "absolute-fill",
});
export const FinaleScene = Interactive.create({
  Component: FinaleInner,
  layout: "absolute-fill",
});

export const Showreel = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const cameraScale = 1.045 + Math.sin(frame / (fps * 8)) * 0.006;
  const cameraX = Math.sin(frame / (fps * 4)) * 16;
  const cameraY = Math.cos(frame / (fps * 5)) * 10;

  return (
    <>
      <Track name="Scenes">
        <OpeningScene
          name="01 · Show up"
          durationInFrames={5 * fps}
          style={{
            backgroundColor: DEEP,
            scale: cameraScale,
            translate: `${cameraX}px ${cameraY}px`,
          }}
        />
        <ScanScene
          name="02 · One scan"
          from={5 * fps}
          durationInFrames={6 * fps}
          style={{
            backgroundColor: PALE,
            scale: cameraScale,
            translate: `${cameraX}px ${cameraY}px`,
          }}
        />
        <LocationScene
          name="03 · Verified arrival"
          from={11 * fps}
          durationInFrames={7 * fps}
          style={{
            backgroundColor: DEEP,
            scale: cameraScale,
            translate: `${cameraX}px ${cameraY}px`,
          }}
        />
        <LiveScene
          name="04 · Live attendance"
          from={18 * fps}
          durationInFrames={7 * fps}
          style={{
            backgroundColor: PALE,
            scale: cameraScale,
            translate: `${cameraX}px ${cameraY}px`,
          }}
        />
        <OfflineScene
          name="05 · Offline ready"
          from={25 * fps}
          durationInFrames={6 * fps}
          style={{
            backgroundColor: DEEP,
            scale: cameraScale,
            translate: `${cameraX}px ${cameraY}px`,
          }}
        />
        <CommunityScene
          name="06 · Find your next thing"
          from={31 * fps}
          durationInFrames={7 * fps}
          style={{
            backgroundColor: PALE,
            scale: cameraScale,
            translate: `${cameraX}px ${cameraY}px`,
          }}
        />
        <FinaleScene
          name="07 · CheckedIn"
          from={38 * fps}
          durationInFrames={7 * fps}
          style={{
            backgroundColor: DEEP,
            scale: cameraScale,
            translate: `${cameraX}px ${cameraY}px`,
          }}
        />
      </Track>
      <Track name="Voice-over">
        <Sequence name="VO 01 · Opening" from={6} durationInFrames={5 * fps - 6}>
          <Audio name="Campus events should feel easy." src={staticFile("assets/narration/narration-01.mp3")} />
        </Sequence>
        <Sequence name="VO 02 · QR check-in" from={5 * fps + 6} durationInFrames={6 * fps - 6}>
          <Audio name="Found an event? Scan once." src={staticFile("assets/narration/narration-02.mp3")} />
        </Sequence>
        <Sequence name="VO 03 · Verified arrival" from={11 * fps + 6} durationInFrames={7 * fps - 6}>
          <Audio name="A quick location check and selfie help verify every arrival." src={staticFile("assets/narration/narration-03.mp3")} />
        </Sequence>
        <Sequence name="VO 04 · Live attendance" from={18 * fps + 6} durationInFrames={7 * fps - 6}>
          <Audio name="For staff, that means live attendance." src={staticFile("assets/narration/narration-04.mp3")} />
        </Sequence>
        <Sequence name="VO 05 · Offline sync" from={25 * fps + 6} durationInFrames={6 * fps - 6}>
          <Audio name="If your signal drops, no worries." src={staticFile("assets/narration/narration-05.mp3")} />
        </Sequence>
        <Sequence name="VO 06 · Community" from={31 * fps + 6} durationInFrames={7 * fps - 6}>
          <Audio name="Looking for something to do?" src={staticFile("assets/narration/narration-06.mp3")} />
        </Sequence>
        <Sequence name="VO 07 · Finale" from={38 * fps + 6} durationInFrames={7 * fps - 6}>
          <Audio name="Students, faculty, campus groups." src={staticFile("assets/narration/narration-07.mp3")} />
        </Sequence>
      </Track>
    </>
  );
};
