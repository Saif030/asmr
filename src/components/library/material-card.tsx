"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bookmark,
  FileText,
  Link2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Youtube,
  ImageIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { materialFileUrl } from "@/lib/appwrite/files";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants/limits";
import { cn, formatDate, initialsFor } from "@/lib/utils";
import type { MaterialWithRelations, Profile } from "@/types/appwrite";

const TYPE_STYLES: Record<string, string> = {
  book: "bg-[#eef2ff] text-[#3f6bf0]",
  pyq: "bg-[#f0fdf4] text-[#15803d]",
  question_bank: "bg-[#fff7ed] text-[#c2410c]",
  image: "bg-[#fdf2f8] text-[#be185d]",
  youtube: "bg-[#fef2f2] text-[#dc2626]",
};

export function MaterialCard({
  material,
  currentUser,
  saved,
  onToggleSave,
  onEdit,
  onDelete,
}: {
  material: MaterialWithRelations;
  currentUser: Profile;
  saved: boolean;
  onToggleSave: (material: MaterialWithRelations) => void;
  onEdit?: (material: MaterialWithRelations) => void;
  onDelete?: (material: MaterialWithRelations) => void;
}) {
  const canManage = material.uploaderId === currentUser.userId || currentUser.isAdmin;

  const kindIcon =
    material.kind === "youtube" ? (
      <Youtube className="h-4 w-4" />
    ) : material.kind === "link" ? (
      <Link2 className="h-4 w-4" />
    ) : material.type === "image" ? (
      <ImageIcon className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-subtle transition-shadow hover:shadow-soft">
      <Link
        href={`/library/${material.$id}`}
        className="relative flex h-28 items-center justify-center overflow-hidden bg-surface sm:h-36"
      >
        {material.kind === "youtube" && material.youtubeId ? (
          <img
            src={`https://img.youtube.com/vi/${material.youtubeId}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : material.kind === "file" && material.type === "image" && material.fileId ? (
          <img
            src={materialFileUrl(material.fileId) ?? ""}
            alt={material.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-foreground-muted shadow-subtle">
            {kindIcon}
          </span>
        )}

        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium",
            TYPE_STYLES[material.type] ?? "bg-background text-foreground-muted",
          )}
        >
          {MATERIAL_TYPE_LABELS[material.type] ?? material.type}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/library/${material.$id}`} className="group/title">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover/title:text-accent">
            {material.title}
          </h3>
        </Link>

        <p className="line-clamp-2 text-xs text-foreground-muted">
          {material.description ||
            (material.subject?.name ?? "No subject") +
              (material.exam ? ` · ${material.exam}` : "") +
              (material.year ? ` · ${material.year}` : "")}
        </p>

        {material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {material.tags.length > 3 && (
              <Badge variant="outline">+{material.tags.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback
                style={{
                  backgroundColor: `${material.uploader?.avatarColor ?? "#4F7CFF"}1A`,
                  color: material.uploader?.avatarColor ?? "#4F7CFF",
                  fontSize: "10px",
                }}
              >
                {initialsFor(material.uploader?.name ?? "?")}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-foreground-subtle">
              {material.uploader?.name ?? "Unknown"} · {formatDate(material.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={saved ? "Remove from saved" : "Save for later"}
              onClick={() => onToggleSave(material)}
              className={cn(saved && "text-accent")}
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-accent")} />
            </Button>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onSelect={() => onEdit(material)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem destructive onSelect={() => onDelete(material)}>
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
