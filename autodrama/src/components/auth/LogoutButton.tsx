"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "text";
  children?: React.ReactNode;
}

export function LogoutButton({
  className,
  variant = "secondary",
  children,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error.message);
        setIsLoading(false);
        return;
      }

      // Logout successful, redirect to login page
      router.push("/login");
      router.refresh();
    } catch {
      console.error("Logout failed");
      setIsLoading(false);
    }
  };

  const baseStyles =
    "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50";

  const variantStyles = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-500",
    secondary:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    text: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {isLoading ? "登出中..." : children || "登出"}
    </button>
  );
}