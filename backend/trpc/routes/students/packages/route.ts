import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type StudentPackageRow = Database["public"]["Tables"]["student_packages"]["Row"];
type StudentProductRow = Database["public"]["Tables"]["student_products"]["Row"];
type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type PackageWithRelation = StudentPackageRow & { package?: PackageRow | null };
type ProductWithRelation = StudentProductRow & { product?: ProductRow | null };

export const studentPackagesProcedure = publicProcedure.query(async ({ ctx }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  console.log("Fetching packages for student:", ctx.user.id);

  const { data: packagesData, error: packagesError } = await supabase
    .from("student_packages")
    .select(`
      *,
      package:packages(*)
    `)
    .eq("student_id", ctx.user.id)
    .order("created_at", { ascending: false });

  const normalizedPackages = (packagesData ?? []) as PackageWithRelation[];

  if (packagesError) {
    console.error("Error fetching student packages:", packagesError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: packagesError.message || "Failed to fetch packages",
    });
  }

  const { data: productsData, error: productsError } = await supabase
    .from("student_products")
    .select(`
      *,
      product:products(*)
    `)
    .eq("student_id", ctx.user.id)
    .order("created_at", { ascending: false });

  const normalizedProducts = (productsData ?? []) as ProductWithRelation[];

  if (productsError) {
    console.error("Error fetching student products:", productsError);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: productsError.message || "Failed to fetch products",
    });
  }

  const totalHoursRemaining = normalizedPackages.reduce((sum, pkg) => sum + (pkg.hours_remaining ?? 0), 0);
  const totalHoursUsed = normalizedPackages.reduce((sum, pkg) => sum + (pkg.hours_used ?? 0), 0);
  const totalPriceRemaining = normalizedPackages.reduce((sum, pkg) => sum + (pkg.price_remaining ?? 0), 0);

  console.log("Student packages fetched successfully:", {
    packagesCount: packagesData?.length || 0,
    productsCount: productsData?.length || 0,
    totalHoursRemaining,
  });

  return {
    packages: normalizedPackages,
    products: normalizedProducts,
    summary: {
      totalHoursRemaining,
      totalHoursUsed,
      totalPriceRemaining,
    },
  };
});
