import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// str_replace_editor tests
test("ToolInvocationBadge displays 'Viewing' for view command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "view",
      path: "/App.jsx",
    },
    state: "result",
    result: "File contents",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Viewing /App.jsx")).toBeDefined();
});

test("ToolInvocationBadge displays 'Creating' for create command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/components/Button.tsx",
      file_text: "export const Button = () => {}",
    },
    state: "result",
    result: "File created",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Creating /components/Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge displays 'Editing' for str_replace command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "str_replace",
      path: "/App.jsx",
      old_str: "old text",
      new_str: "new text",
    },
    state: "result",
    result: "Replaced 1 occurrence",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing /App.jsx")).toBeDefined();
});

test("ToolInvocationBadge displays 'Editing' for insert command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "insert",
      path: "/utils/helper.ts",
      insert_line: 10,
      new_str: "new line",
    },
    state: "result",
    result: "Text inserted",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Editing /utils/helper.ts")).toBeDefined();
});

test("ToolInvocationBadge displays 'Reverting changes' for undo_edit command", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "undo_edit",
      path: "/App.jsx",
    },
    state: "result",
    result: "Changes reverted",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Reverting changes to /App.jsx")).toBeDefined();
});

// file_manager tests
test("ToolInvocationBadge displays 'Renaming' for rename command with new_path", () => {
  const toolInvocation = {
    toolName: "file_manager",
    args: {
      command: "rename",
      path: "/old-file.jsx",
      new_path: "/new-file.jsx",
    },
    state: "result",
    result: { success: true },
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Renaming /old-file.jsx to /new-file.jsx")).toBeDefined();
});

test("ToolInvocationBadge displays 'Renaming' for rename command without new_path", () => {
  const toolInvocation = {
    toolName: "file_manager",
    args: {
      command: "rename",
      path: "/old-file.jsx",
    },
    state: "result",
    result: { success: true },
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Renaming /old-file.jsx")).toBeDefined();
});

test("ToolInvocationBadge displays 'Deleting' for delete command", () => {
  const toolInvocation = {
    toolName: "file_manager",
    args: {
      command: "delete",
      path: "/unused-component.jsx",
    },
    state: "result",
    result: { success: true },
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("Deleting /unused-component.jsx")).toBeDefined();
});

// State tests
test("ToolInvocationBadge shows success indicator when completed", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "result",
    result: "Success",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  // Check for green success dot
  const successDot = container.querySelector(".bg-emerald-500");
  expect(successDot).toBeDefined();

  // Shouldn't have loading spinner
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeNull();
});

test("ToolInvocationBadge shows loading spinner when in progress", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "pending",
    result: null,
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  // Check for loading spinner
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();

  // Shouldn't have success dot
  const successDot = container.querySelector(".bg-emerald-500");
  expect(successDot).toBeNull();
});

// Edge case tests
test("ToolInvocationBadge handles missing args gracefully", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: null,
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("ToolInvocationBadge handles missing command in args", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      path: "/App.jsx",
    },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("ToolInvocationBadge handles missing path in args", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "create",
    },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("ToolInvocationBadge handles unknown tool name", () => {
  const toolInvocation = {
    toolName: "unknown_tool",
    args: {
      command: "do_something",
      path: "/file.jsx",
    },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("ToolInvocationBadge handles unknown command for str_replace_editor", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "unknown_command",
      path: "/App.jsx",
    },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("unknown_command /App.jsx")).toBeDefined();
});

test("ToolInvocationBadge handles unknown command for file_manager", () => {
  const toolInvocation = {
    toolName: "file_manager",
    args: {
      command: "unknown_command",
      path: "/App.jsx",
    },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText("unknown_command /App.jsx")).toBeDefined();
});

test("ToolInvocationBadge handles long file paths", () => {
  const longPath = "/very/long/path/to/some/deeply/nested/component/Button.tsx";
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: longPath,
    },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);
  expect(screen.getByText(`Creating ${longPath}`)).toBeDefined();
});

test("ToolInvocationBadge renders with correct styling", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "result",
    result: "Success",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  const badge = container.querySelector(".bg-neutral-50");
  expect(badge).toBeDefined();
  expect(badge?.className).toContain("rounded-lg");
  expect(badge?.className).toContain("border-neutral-200");
});

test("ToolInvocationBadge uses monospace font for file paths", () => {
  const toolInvocation = {
    toolName: "str_replace_editor",
    args: {
      command: "create",
      path: "/App.jsx",
    },
    state: "result",
    result: "Success",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  const text = container.querySelector(".font-mono");
  expect(text).toBeDefined();
  expect(text?.textContent).toBe("Creating /App.jsx");
});
