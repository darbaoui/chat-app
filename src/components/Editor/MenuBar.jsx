"use client";

import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Code,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react";
import React from "react";
import { Separator } from "@/components/ui/separator";
import MenuItem from "./MenuItem";

class MenuBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [
        {
          iconComp: (className) => (
            <Bold className={cn("w-4 h-4", className)} />
          ),
          title: "Bold",
          action: () => this.props.editor.chain().focus().toggleBold().run(),
          isActive: () => this.props.editor.isActive("bold"),
        },
        {
          iconComp: (className) => (
            <Italic className={cn("w-4 h-4", className)} />
          ),
          title: "Italic",
          action: () => this.props.editor.chain().focus().toggleItalic().run(),
          isActive: () => this.props.editor.isActive("italic"),
        },
        {
          iconComp: (className) => (
            <Strikethrough className={cn("w-4 h-4", className)} />
          ),
          title: "Strike",
          action: () => this.props.editor.chain().focus().toggleStrike().run(),
          isActive: () => this.props.editor.isActive("strike"),
        },
        {
          iconComp: (className) => (
            <Link2 className={cn("w-4 h-4", className)} />
          ),
          title: "Link",
          action: () => this.props.setLink(),
          isActive: () => this.props.editor.isActive("link"),
        },

        {
          iconComp: (className) => (
            <Code className={cn("w-4 h-4", className)} />
          ),
          title: "Code",
          action: () => this.props.editor.chain().focus().toggleCode().run(),
          isActive: () => this.props.editor.isActive("code"),
        },
        {
          type: "divider",
        },
        {
          iconComp: (className) => (
            <List className={cn("w-5 h-5", className)} />
          ),
          title: "Bullet List",
          action: () =>
            this.props.editor.chain().focus().toggleBulletList().run(),
          isActive: () => this.props.editor.isActive("bulletList"),
        },
        {
          iconComp: (className) => (
            <ListOrdered className={cn("w-5 h-5", className)} />
          ),
          title: "Ordered List",
          action: () =>
            this.props.editor.chain().focus().toggleOrderedList().run(),
          isActive: () => this.props.editor.isActive("orderedList"),
        },
        {
          iconComp: (className) => (
            <ListChecks className={cn("w-5 h-5", className)} />
          ),
          title: "Task List",
          action: () =>
            this.props.editor.chain().focus().toggleTaskList().run(),
          isActive: () => this.props.editor.isActive("taskList"),
        },
        {
          iconComp: (className) => (
            <Braces className={cn("w-4 h-4", className)} />
          ),
          title: "Code Block",
          action: () =>
            this.props.editor.chain().focus().toggleCodeBlock().run(),
          isActive: () => this.props.editor.isActive("codeBlock"),
        },
        {
          type: "divider",
        },
        {
          iconComp: (className) => (
            <Quote className={cn("w-4 h-4", className)} />
          ),
          title: "Blockquote",
          class: "w-4 h-4",
          action: () =>
            this.props.editor.chain().focus().toggleBlockquote().run(),
          isActive: () => this.props.editor.isActive("blockquote"),
        },
        ...(this.props.hasTextAlignment
          ? [
              {
                type: "divider",
              },
              {
                iconComp:  (className) => (
                <AlignLeft className={cn("w-4 h-4", className)} />
                ),
                title: "align-left",
                class: "w-4 h-4",
                action: () =>
                  this.props.editor.chain().focus().setTextAlign("left").run(),
                isActive: () =>
                  this.props.editor.isActive({ textAlign: "left" }),
              },
              {
                iconComp:  (className) => (
                <AlignCenter className={cn("w-4 h-4", className)} />
                ),
                title: "align-center",
                class: "w-4 h-4",
                action: () =>
                  this.props.editor
                    .chain()
                    .focus()
                    .setTextAlign("center")
                    .run(),
                isActive: () =>
                  this.props.editor.isActive({ textAlign: "center" }),
              },
              {
                iconComp:  (className) => (
                <AlignRight className={cn("w-4 h-4", className)} />
                ),
                title: "align-right",
                class: "w-4 h-4",
                action: () =>
                  this.props.editor.chain().focus().setTextAlign("right").run(),
                isActive: () =>
                  this.props.editor.isActive({ textAlign: "right" }),
              },
              {
                iconComp:  (className) => (
                <AlignJustify className={cn("w-4 h-4", className)} />
                ),
                title: "align-justify",
                class: "w-4 h-4",
                action: () =>
                  this.props.editor
                    .chain()
                    .focus()
                    .setTextAlign("justify")
                    .run(),
                isActive: () =>
                  this.props.editor.isActive({ textAlign: "justify" }),
              },
            ]
          : []),
      ],
    };
  }

  render() {
    return (
      <div className="w-full shadow flex items-center gap-1 py-1.5 px-2 bg-background border rounded-lg">
        {this.state.items.map((item, index) => (
          <React.Fragment key={index}>
            {item.type === "divider" ? (
              <Separator orientation="vertical" className="h-4" />
            ) : (
              <MenuItem key={index} {...item} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
}

export default MenuBar;
