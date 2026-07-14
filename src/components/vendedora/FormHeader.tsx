"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export function FormHeader({ titulo }: { titulo: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-none items-center gap-2.5 px-1 pb-3 pt-[calc(env(safe-area-inset-top)+0.375rem)]">
      <button
        onClick={() => router.back()}
        aria-label="Voltar"
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-line bg-white active:scale-95"
      >
        <Icon name="back" size={18} />
      </button>
      <span className="truncate text-[18px] font-extrabold tracking-[-.01em]">{titulo}</span>
    </div>
  );
}
