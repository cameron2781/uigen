"use client";

import { Loader2, FileText, FilePlus, FileEdit, Trash2, FolderInput } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: {
    toolName: string;
    args: any;
    state: string;
    result?: any;
  };
}

interface FormattedMessage {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}

function formatToolMessage(toolName: string, args: any): FormattedMessage {
  // Default fallback
  const defaultMessage: FormattedMessage = {
    text: toolName,
    icon: FileText,
  };

  if (!args) {
    return defaultMessage;
  }

  try {
    // Handle str_replace_editor tool
    if (toolName === "str_replace_editor") {
      const { command, path } = args;

      if (!command || !path) {
        return defaultMessage;
      }

      switch (command) {
        case "view":
          return {
            text: `Viewing ${path}`,
            icon: FileText,
          };
        case "create":
          return {
            text: `Creating ${path}`,
            icon: FilePlus,
          };
        case "str_replace":
        case "insert":
          return {
            text: `Editing ${path}`,
            icon: FileEdit,
          };
        case "undo_edit":
          return {
            text: `Reverting changes to ${path}`,
            icon: FileEdit,
          };
        default:
          return {
            text: `${command} ${path}`,
            icon: FileText,
          };
      }
    }

    // Handle file_manager tool
    if (toolName === "file_manager") {
      const { command, path, new_path } = args;

      if (!command || !path) {
        return defaultMessage;
      }

      switch (command) {
        case "rename":
          if (new_path) {
            return {
              text: `Renaming ${path} to ${new_path}`,
              icon: FolderInput,
            };
          }
          return {
            text: `Renaming ${path}`,
            icon: FolderInput,
          };
        case "delete":
          return {
            text: `Deleting ${path}`,
            icon: Trash2,
          };
        default:
          return {
            text: `${command} ${path}`,
            icon: FileText,
          };
      }
    }

    // Unknown tool - return tool name as fallback
    return defaultMessage;
  } catch (error) {
    // If anything goes wrong parsing, return default
    return defaultMessage;
  }
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const { text, icon: Icon } = formatToolMessage(toolName, args);
  const isCompleted = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      <Icon className="w-3 h-3 text-neutral-600 flex-shrink-0" />
      {isCompleted ? (
        <>
          <span className="text-neutral-700 font-mono">{text}</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
        </>
      ) : (
        <>
          <span className="text-neutral-700 font-mono">{text}</span>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
        </>
      )}
    </div>
  );
}
