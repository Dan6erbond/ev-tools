import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";
import { DetourCalculator } from "@/components/tools/detour-calculator";
import { FeeBreakEvenCalculator } from "@/components/tools/fee-break-even-calculator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  const tools = getAllTools().filter((tool) => tool.implemented !== false);
  return tools.map((tool) => ({
    slug: tool.id,
  }));
}

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

import type { Metadata } from "next";

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.implemented === false) {
    return {
      title: "Tool Not Found",
    };
  }
  return {
    title: tool.name,
    description: tool.description,
    keywords: tool.keywords,
    openGraph: {
      title: `${tool.name} | EV Tools`,
      description: tool.description,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${tool.name} - EV Tools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} | EV Tools`,
      description: tool.description,
      images: ["/og-image.png"],
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool || tool.implemented === false) {
    notFound();
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 flex flex-col gap-8">
      {/* Tool Header */}
      <div className="flex flex-col gap-3 border-b pb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/" />} className="gap-1 px-2 text-xs text-muted-foreground">
            <ArrowLeft className="size-3.5" />
            All Tools
          </Button>
          <span className="text-muted-foreground">•</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {tool.category}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DynamicIcon name={tool.iconName as IconName} className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{tool.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <div className="w-full">
        {slug === "detour-calculator" ? (
          <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading calculator...</div>}>
            <DetourCalculator />
          </Suspense>
        ) : slug === "fee-break-even-calculator" ? (
          <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading calculator...</div>}>
            <FeeBreakEvenCalculator />
          </Suspense>
        ) : (
          notFound()
        )}
      </div>
    </div>
  );
}
