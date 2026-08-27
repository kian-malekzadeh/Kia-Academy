"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { MaterialController } from "./MaterialController";
import "./material-studio.css";

export function MaterialStudio() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = new MaterialController(root);
    return () => controller.destroy();
  }, []);

  return (
    <div ref={rootRef} className="material-studio-root">
      <div className="bg-orb orb-a" aria-hidden="true" />
      <div className="bg-orb orb-b" aria-hidden="true" />

      <section
        id="material-mode"
        className="view material-mode active"
        aria-label="استودیوی متریال"
      >
        <div className="material-topbar">
          <Link className="material-brand" href="/">
            <BrandMark className="material-brand-mark" size={18} title="" />
            کیا آکادمی
          </Link>
          <Link className="home-btn" href="/">
            بازگشت
          </Link>
        </div>

        <div className="material-head">
          <h2>استودیوی متریال</h2>
          <p>
            ابزارهای حرفه‌ای برای پالت رنگ، آیکون، انیمیشن و بررسی استایل — بخشی از کیا آکادمی.
          </p>
        </div>

        <div className="tabs" id="material-tabs">
          <button className="tab-btn active" data-tab="palette" type="button">
            پالت
          </button>
          <button className="tab-btn" data-tab="icons" type="button">
            آیکون (۵۵)
          </button>
          <button className="tab-btn" data-tab="animations" type="button">
            انیمیشن
          </button>
          <button className="tab-btn" data-tab="style" type="button">
            ابزار استایل
          </button>
        </div>

        <section id="panel-palette" className="tab-panel active" />
        <section id="panel-icons" className="tab-panel" />
        <section id="panel-animations" className="tab-panel" />
        <section id="panel-style" className="tab-panel" />
      </section>

      <div className="toast" role="status" aria-live="polite" />
    </div>
  );
}
