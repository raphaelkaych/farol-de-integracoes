"use client";

import { useEffect, useRef } from "react";

const nodes = [
  [46, 144], [121, 77], [240, 115], [332, 53], [498, 92], [581, 39],
  [661, 123], [738, 254], [678, 379], [756, 502], [876, 627],
  [1030, 57], [1158, 93], [1310, 62], [1384, 170], [1315, 261], [1396, 366],
  [1255, 577], [1358, 639], [1125, 664], [556, 603], [365, 654], [197, 590],
  [82, 639], [50, 439], [155, 481],
] as const;

const routes = [
  [0, 1, 2, 3], [4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16],
  [17, 18, 19, 10], [20, 21, 22, 23], [24, 25, 22],
];
const wires = routes.map((route) => route.map((node) => nodes[node].join(",")).join(" "));

export function HomeMotion() {
  const layer = useRef<HTMLDivElement>(null);
  const mesh = useRef<SVGSVGElement>(null);
  const tether = useRef<SVGLineElement>(null);
  const linkedNode = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const field = layer.current;
    const svg = mesh.current;
    const line = tether.current;
    const dot = linkedNode.current;
    const hero = field?.parentElement;
    if (!field || !svg || !line || !dot || !hero) return;

    const input = window.matchMedia("(min-width: 786px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let mouseX = 0;
    let mouseY = 0;

    const clear = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      field.removeAttribute("data-following");
      field.removeAttribute("data-linked");
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const bounds = field.getBoundingClientRect();
        const matrix = svg.getScreenCTM();
        if (!matrix) return;
        field.style.setProperty("--signal-x", mouseX - bounds.left + "px");
        field.style.setProperty("--signal-y", mouseY - bounds.top + "px");
        field.setAttribute("data-following", "");

        const point = new DOMPoint(mouseX, mouseY).matrixTransform(matrix.inverse());
        let closest: (typeof nodes)[number] | undefined;
        let best = 176 ** 2;
        for (const node of nodes) {
          const distance = (node[0] - point.x) ** 2 + (node[1] - point.y) ** 2;
          if (distance < best) { closest = node; best = distance; }
        }
        field.toggleAttribute("data-linked", Boolean(closest));
        if (!closest) return;
        line.x1.baseVal.value = point.x;
        line.y1.baseVal.value = point.y;
        line.x2.baseVal.value = dot.cx.baseVal.value = closest[0];
        line.y2.baseVal.value = dot.cy.baseVal.value = closest[1];
      });
    };

    const sync = () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", clear);
      clear();
      field.toggleAttribute("data-tracking", input.matches);
      if (input.matches) {
        hero.addEventListener("pointermove", move, { passive: true });
        hero.addEventListener("pointerleave", clear);
      }
    };
    sync();
    input.addEventListener("change", sync);
    return () => {
      input.removeEventListener("change", sync);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", clear);
      clear();
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const targets = layer.current?.closest("main")?.querySelectorAll("[data-enter]");
    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.setAttribute("data-entered", "");
        observer.unobserve(target);
      }
    }, { rootMargin: "0px 0px -48px" });
    targets?.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const main = layer.current?.closest("main");
    if (!main || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let active: HTMLElement | null = null;
    const clear = () => {
      active?.removeAttribute("data-spotlight");
      active = null;
    };
    const highlight = (event: PointerEvent) => {
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".project-card") : null;
      if (card !== active) clear();
      if (!card || event.pointerType === "touch") return;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", event.clientX - bounds.left + "px");
      card.style.setProperty("--spot-y", event.clientY - bounds.top + "px");
      card.setAttribute("data-spotlight", "");
      active = card;
    };
    main.addEventListener("pointermove", highlight, { passive: true });
    main.addEventListener("pointerleave", clear);
    return () => {
      main.removeEventListener("pointermove", highlight);
      main.removeEventListener("pointerleave", clear);
      clear();
    };
  }, []);

  return (
    <div ref={layer} className="hero-signals" aria-hidden="true">
      <div className="hero-signal-light" />
      <svg ref={mesh} viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" focusable="false">
        <g className="signal-wires">{wires.map((points) => <polyline key={points} points={points} />)}</g>
        <g className="signal-pulses">{wires.map((points) => <polyline key={points} points={points} pathLength={1} />)}</g>
        <g className="signal-nodes">{nodes.map(([x, y], i) => <circle key={x} cx={x} cy={y} r={i % 4 === 0 ? 3 : 1.8} />)}</g>
        <g className="signal-link">
          <line ref={tether} x1="0" y1="0" x2="0" y2="0" />
          <circle ref={linkedNode} cx="0" cy="0" r="4.5" />
        </g>
      </svg>
    </div>
  );
}
