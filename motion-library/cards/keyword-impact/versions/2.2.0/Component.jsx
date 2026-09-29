const Component = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const props = item.props;
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
  const seconds = frame / fps;
  const enter = interpolate(seconds, [0, 0.2], [0, 1], clamp);
  const slide = -1800 * Math.pow(1 - enter, 3);
  const exitStart = Math.max(0.25, durationInFrames / fps - 0.35);
  const exit = interpolate(seconds, [exitStart, exitStart + 0.28], [0, 1], clamp);
  const characters = Array.from(props.text);
  const split = props.splitAt > 0 ? Math.min(characters.length, Math.round(props.splitAt)) : Math.ceil(characters.length / 2);
  const leftText = characters.slice(0, split).join("");
  const rightText = characters.slice(split).join("");
  const gap = Math.min(1000, Math.max(0, props.centerGap));
  const sideWidth = (1680 - gap) / 2;
  const measure = (text) => Array.from(text).reduce((sum, c) => sum + (c.charCodeAt(0) < 128 ? 0.58 : 1), 0);
  const fontSize = Math.min(props.fontSize, sideWidth / Math.max(1, measure(leftText), measure(rightText)));
  const sideStyle = { width: sideWidth, flexShrink: 0, textAlign: "center" };
  const content = <><span style={sideStyle}>{leftText}</span><span style={sideStyle}>{rightText}</span></>;
  const rootStyle = { position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "transparent", fontFamily: props.fontFamily };
  const sceneStyle = { position: "absolute", width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${width / 1920}, ${height / 1080})` };
  const textStyle = { position: "absolute", left: 120, top: props.textY, width: 1680, height: 440, display: "flex", alignItems: "center", justifyContent: "space-between", color: props.color, fontSize, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", letterSpacing: -8, textShadow: "5px 8px 4px rgba(0,0,0,.8)" };
  const wholeStyle = { ...textStyle, opacity: exit === 0 ? 1 : 0, transform: `translateX(${slide}px)` };
  // Deterministic clipped text fragments retain the real letter shapes; no random re-layout per frame.
  const fragments = [];
  if (exit > 0 && exit < 1) {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 32; col++) {
        const seed = (col * 73 + row * 137) % 97;
        const dx = (col - 15.5) * 9 * exit;
        const dy = ((seed % 19) - 9) * 14 * exit + 65 * exit * exit;
        const rotation = (seed - 48) * exit * 2;
        const fragmentStyle = { ...textStyle, clipPath: `inset(${row / 6 * 100}% ${100 - (col + 1) / 32 * 100}% ${100 - (row + 1) / 6 * 100}% ${col / 32 * 100}%)`, opacity: 1 - exit, transformOrigin: `${col / 32 * 1680}px ${row / 6 * 440}px`, transform: `translate(${dx}px,${dy}px) rotate(${rotation}deg)` };
        fragments.push(<div key={`${row}-${col}`} style={fragmentStyle}>{content}</div>);
      }
    }
  }
  return <div style={rootStyle}><div style={sceneStyle}><div style={wholeStyle}>{content}</div>{fragments}</div></div>;
};
