
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2, Heading3, Heading4, Pilcrow, Undo2, Redo2, RemoveFormatting, Palette, FontSize // Replaced CaseSensitive with FontSize
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlOutput, setHtmlOutput] = useState(value);
  const [isMounted, setIsMounted] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('3'); // Default paragraph size (approx 16px)
  const [currentColor, setCurrentColor] = useState('#000000'); // Default black


  // Effect to sync internal state with prop value (e.g., for form reset)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      setHtmlOutput(value);
    }
  }, [value]);

  // Effect to handle hydration and initial content setting
  useEffect(() => {
    setIsMounted(true);
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
     // Initialize color picker state
     const initialColor = typeof window !== 'undefined' ? getComputedStyle(document.body).getPropertyValue('--foreground') : '#000000';
     setCurrentColor(initialColor || '#000000');

  }, [value]); // Added value dependency


  const executeCommand = (command: string, valueArg: string | null = null) => {
    if (disabled || !editorRef.current) return;
    editorRef.current.focus(); // Ensure editor has focus
    document.execCommand(command, false, valueArg);
    updateHtmlOutput(); // Update output after command
  };

  const handleFormatBlock = (tag: string) => {
      executeCommand('formatBlock', `<${tag}>`);
  };


   const handleFontSizeChange = (sizeValue: string) => {
       // `fontSize` command expects a value from 1 (smallest) to 7 (largest)
       executeCommand('fontSize', sizeValue);
       setCurrentFontSize(sizeValue);
   };

   const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       const newColor = event.target.value;
       executeCommand('foreColor', newColor);
       setCurrentColor(newColor);
   };


  const updateHtmlOutput = useCallback(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      setHtmlOutput(currentHtml);
      onChange(currentHtml); // Propagate change to parent (react-hook-form Controller)
    }
  }, [onChange]);

  // Handle paste as plain text (optional but recommended)
  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
  };

  if (!isMounted) {
      // Prevent rendering editor content on the server to avoid hydration issues
      // You might show a simple placeholder or skeleton here
       return <div className="border rounded-md p-4 min-h-[200px] bg-muted animate-pulse"></div>;
   }

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("border rounded-md overflow-hidden", disabled && "bg-muted opacity-70 cursor-not-allowed")}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-card">
           {/* Text Formatting */}
          <EditorButton tooltip="Bold (Ctrl+B)" onClick={() => executeCommand('bold')} disabled={disabled}><Bold /></EditorButton>
          <EditorButton tooltip="Italic (Ctrl+I)" onClick={() => executeCommand('italic')} disabled={disabled}><Italic /></EditorButton>
          <EditorButton tooltip="Underline (Ctrl+U)" onClick={() => executeCommand('underline')} disabled={disabled}><Underline /></EditorButton>
           {/* <EditorButton tooltip="Strikethrough" onClick={() => executeCommand('strikeThrough')} disabled={disabled}><Strikethrough /></EditorButton> */}

           {/* Headings & Paragraph */}
           <Select onValueChange={handleFormatBlock} defaultValue="p" disabled={disabled}>
               <SelectTrigger className="w-auto h-8 px-2 text-xs">
                   <SelectValue placeholder="Style" />
               </SelectTrigger>
               <SelectContent>
                   <SelectItem value="p"><div className="flex items-center gap-2"><Pilcrow size={14}/> Paragraph</div></SelectItem>
                   <SelectItem value="h1"><div className="flex items-center gap-2"><Heading1 size={14}/> Heading 1</div></SelectItem>
                   <SelectItem value="h2"><div className="flex items-center gap-2"><Heading2 size={14}/> Heading 2</div></SelectItem>
                   <SelectItem value="h3"><div className="flex items-center gap-2"><Heading3 size={14}/> Heading 3</div></SelectItem>
                   <SelectItem value="h4"><div className="flex items-center gap-2"><Heading4 size={14}/> Heading 4</div></SelectItem>
               </SelectContent>
           </Select>

          <ToolbarSeparator />

          {/* Alignment */}
          <EditorButton tooltip="Align Left" onClick={() => executeCommand('justifyLeft')} disabled={disabled}><AlignLeft /></EditorButton>
          <EditorButton tooltip="Align Center" onClick={() => executeCommand('justifyCenter')} disabled={disabled}><AlignCenter /></EditorButton>
          <EditorButton tooltip="Align Right" onClick={() => executeCommand('justifyRight')} disabled={disabled}><AlignRight /></EditorButton>

          <ToolbarSeparator />

           {/* Lists */}
          <EditorButton tooltip="Bullet List" onClick={() => executeCommand('insertUnorderedList')} disabled={disabled}><List /></EditorButton>
          <EditorButton tooltip="Numbered List" onClick={() => executeCommand('insertOrderedList')} disabled={disabled}><ListOrdered /></EditorButton>

           <ToolbarSeparator />

            {/* Font Size */}
           <Select value={currentFontSize} onValueChange={handleFontSizeChange} disabled={disabled}>
               <Tooltip>
                   <TooltipTrigger asChild>
                       <SelectTrigger className="w-[80px] h-8 px-2 text-xs">
                           <SelectValue placeholder="Size" />
                        </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Font Size</TooltipContent>
                </Tooltip>
               <SelectContent>
                   <SelectItem value="1">Smallest</SelectItem>
                   <SelectItem value="2">Smaller</SelectItem>
                   <SelectItem value="3">Normal</SelectItem>
                   <SelectItem value="4">Larger</SelectItem>
                   <SelectItem value="5">Largest</SelectItem>
                   <SelectItem value="6">Huge</SelectItem>
                   <SelectItem value="7">Max</SelectItem>
               </SelectContent>
           </Select>

           {/* Font Color */}
           <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative h-8 w-8 flex items-center justify-center">
                       <Palette className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                       <Input
                           type="color"
                           value={currentColor}
                           onChange={handleColorChange}
                           disabled={disabled}
                           className="absolute inset-0 opacity-0 cursor-pointer h-full w-full p-0 border-none"
                           aria-label="Change font color"
                       />
                       {/* Visual color indicator */}
                       <div className="h-5 w-5 rounded border" style={{ backgroundColor: currentColor }}></div>
                    </div>
                 </TooltipTrigger>
                 <TooltipContent>Font Color</TooltipContent>
            </Tooltip>


           <ToolbarSeparator />

          {/* Undo/Redo */}
          <EditorButton tooltip="Undo (Ctrl+Z)" onClick={() => executeCommand('undo')} disabled={disabled}><Undo2 /></EditorButton>
          <EditorButton tooltip="Redo (Ctrl+Y)" onClick={() => executeCommand('redo')} disabled={disabled}><Redo2 /></EditorButton>

           <ToolbarSeparator />

            {/* Clear Formatting */}
           <EditorButton tooltip="Clear Formatting" onClick={() => executeCommand('removeFormat')} disabled={disabled}><RemoveFormatting /></EditorButton>

        </div>

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={updateHtmlOutput}
          onBlur={updateHtmlOutput} // Update on blur too, e.g., for pasting
          onPaste={handlePaste}
          className={cn(
            "prose dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none overflow-y-auto",
            disabled ? "bg-muted/50 text-muted-foreground" : "bg-background"
          )}
          aria-label="Blog content editor"
          // Using placeholder text requires a bit more logic if the div is truly empty
          // This is a simplified approach using CSS pseudo-element
          data-placeholder={placeholder}
          style={{
            // Basic placeholder styling (won't work if there's any HTML like <p><br></p>)
             '--placeholder-color': 'hsl(var(--muted-foreground))',
          } as React.CSSProperties}
          // Add CSS in a style tag or globals.css for the placeholder
          // [contenteditable][data-placeholder]:empty::before {
          //   content: attr(data-placeholder);
          //   color: var(--placeholder-color);
          //   pointer-events: none;
          //   display: block; /* or inline-block */
          // }
        />

        {/* Live HTML Output (Optional Section) */}
        {/* <div className="p-4 border-t bg-muted">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Live HTML Output:</h4>
          <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
            <code>{htmlOutput}</code>
          </pre>
        </div> */}
      </div>
    </TooltipProvider>
  );
};

// Toolbar Button Component
interface EditorButtonProps extends React.ComponentProps<typeof Button> {
    tooltip: string;
}

const EditorButton: React.FC<EditorButtonProps> = ({ tooltip, children, ...props }) => (
     <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" {...props}>
                {children}
            </Button>
        </TooltipTrigger>
         <TooltipContent>{tooltip}</TooltipContent>
     </Tooltip>
 );

// Toolbar Separator Component
const ToolbarSeparator = () => <div className="h-6 w-px bg-border mx-1" />;


export default RichTextEditor;

// Add this CSS to your globals.css or a style tag for the placeholder effect:
/*
[contenteditable][data-placeholder]:empty::before {
  content: attr(data-placeholder);
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  display: block;
}
*/

