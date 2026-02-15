"use client";

import { useLayoutEffect, useRef } from "react";
import { UserButton } from "@clerk/nextjs";

/**
 * Wraps UserButton with showName for the mobile menu. Clerk renders the name
 * outside the trigger button; we move it inside so the whole row is one
 * clickable button and fix avatar-first order.
 */
export function MobileUserButton() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const moveNameIntoTrigger = () => {
      // Clerk may use .cl-userButtonTrigger or hashed classes; trigger might be button or div
      let trigger =
        (wrapper.querySelector(".cl-userButtonTrigger") as HTMLElement) ??
        (wrapper.querySelector("[class*='userButtonTrigger']") as HTMLElement);
      if (!trigger) {
        const avatar = wrapper.querySelector(".cl-avatarBox, [class*='avatarBox']");
        trigger = (avatar?.closest("button") ?? avatar?.parentElement) as HTMLElement;
      }
      if (!trigger) trigger = wrapper.querySelector("button") as HTMLElement;
      if (!trigger) return;

      // Name can be .cl-userButtonOuterIdentifier, [class*="identifier"], or a sibling text node
      let nameEl =
        wrapper.querySelector(".cl-userButtonOuterIdentifier") ??
        wrapper.querySelector("[class*='userButtonOuterIdentifier']") ??
        wrapper.querySelector("[class*='Identifier']");
      // If not found by class, look for a sibling of the trigger that has text (Clerk often puts name next to trigger)
      if (!nameEl && trigger.parentElement) {
        const siblings = Array.from(trigger.parentElement.children).filter((el) => el !== trigger);
        nameEl = siblings.find((el) => el.textContent?.trim().length && !el.querySelector("button")) ?? null;
      }
      if (!nameEl) return;

      // If the name is already inside the trigger, just fix order
      if (trigger.contains(nameEl)) {
        trigger.style.display = "flex";
        trigger.style.flexDirection = "row";
        trigger.style.alignItems = "center";
        trigger.style.gap = "0.75rem";
        const avatar = trigger.querySelector(".cl-avatarBox, [class*='avatarBox']");
        if (avatar) (avatar as HTMLElement).style.order = "1";
        (nameEl as HTMLElement).style.order = "2";
        (nameEl as HTMLElement).style.whiteSpace = "nowrap";
        return;
      }

      // Name is outside the trigger: move it inside so the whole row is one button
      const nameText = (nameEl.textContent ?? "").trim();
      if (!nameText) return;
      const span = document.createElement("span");
      span.textContent = nameText;
      span.setAttribute("data-moved-name", "true");
      span.style.whiteSpace = "nowrap";
      span.style.order = "2";
      span.style.flexShrink = "0";
      trigger.style.display = "flex";
      trigger.style.flexDirection = "row";
      trigger.style.alignItems = "center";
      trigger.style.gap = "0.75rem";
      trigger.style.justifyContent = "flex-start";
      const avatar = trigger.querySelector(".cl-avatarBox, [class*='avatarBox']");
      if (avatar) (avatar as HTMLElement).style.order = "1";
      trigger.appendChild(span);
      nameEl.remove();
    };

    moveNameIntoTrigger();

    // Clerk often injects DOM after paint; retry and observe for late-rendered content
    const t1 = setTimeout(moveNameIntoTrigger, 50);
    const t2 = setTimeout(moveNameIntoTrigger, 200);
    const observer = new MutationObserver(() => moveNameIntoTrigger());
    observer.observe(wrapper, { childList: true, subtree: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="mobile-user-button py-3 px-3 flex flex-row items-center flex-nowrap w-full">
      <UserButton
        showName
        afterSignOutUrl="/"
        userProfileUrl="/user-profile"
        userProfileMode="navigation"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8 shrink-0 order-1",
            userButtonTrigger: "w-full flex flex-row items-center justify-start gap-3 hover:bg-foreground/5 rounded-lg px-0 shrink-0",
            userButtonBox: "w-full flex flex-row shrink-0",
            userButtonOuterIdentifier: "whitespace-nowrap order-2",
          },
        }}
      />
    </div>
  );
}
