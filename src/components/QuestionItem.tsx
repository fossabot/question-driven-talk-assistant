import React, { FC, useCallback, useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useHotkeys } from "react-hotkeys-hook";
import { Checkbox } from "@material-tailwind/react";

export interface Question {
  id: string;
  text: string;
  answered: boolean;
  highlighted: boolean;
}

export type UpdateFuncType = (draft: Question[]) => void;

interface QuestionItemProps {
  question: Question;
  questions: Question[];
  questionRefs: React.MutableRefObject<
    Record<string, React.RefObject<HTMLTextAreaElement>>
  >;
  updateQuestions: (updateFunc: UpdateFuncType) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const QuestionItem: FC<QuestionItemProps> = ({
  question,
  questions,
  questionRefs,
  updateQuestions,
  textareaRef,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const baseClasses =
    "border-b outline-none focus:border-blue-500 transition-colors w-full resize-none";
  const textColor = question.highlighted
    ? "text-black"
    : "text-black dark:text-white";
  const bgColor = question.highlighted
    ? "bg-gray-200 dark:bg-gray-700 rounded-lg"
    : "bg-transparent";

  const adjustHeight = useCallback(() => {
    if (textareaRef?.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textareaRef]);

  useEffect(() => {
    adjustHeight();
  }, [question.text, adjustHeight]);

  const [isFocused, setIsFocused] = useState(false);

  useHotkeys(
    "ctrl+shift+up",
    () => {
      const currentIndex = questions.findIndex((q) => q.id === question.id);
      if (currentIndex > 0) {
        updateQuestions((draft) => {
          const temp = draft[currentIndex];
          draft[currentIndex] = draft[currentIndex - 1];
          draft[currentIndex - 1] = temp;
        });
      }
    },
    { enableOnFormTags: true, enabled: isFocused },
    [questions, question.id, updateQuestions, isFocused],
  );

  useHotkeys(
    "ctrl+shift+down",
    () => {
      const currentIndex = questions.findIndex((q) => q.id === question.id);
      if (currentIndex < questions.length - 1) {
        updateQuestions((draft) => {
          const temp = draft[currentIndex];
          draft[currentIndex] = draft[currentIndex + 1];
          draft[currentIndex + 1] = temp;
        });
      }
    },
    { enableOnFormTags: true, enabled: isFocused },
    [questions, question.id, updateQuestions, isFocused],
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    const currentIndex = questions.findIndex((q) => q.id === question.id);
    if (!textareaRef?.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;

    // Split textarea content into lines
    const lines = textarea.value.split("\n");
    const isMultiLineAndEmpty =
      lines.length > 1 && lines.every((line) => line.trim() === "");

    if (e.key === "Backspace") {
      // Prevent action when cursor is on the first line of an empty multi-line textarea
      if (isMultiLineAndEmpty && cursorPosition === 0) {
        e.preventDefault();
        return;
      }

      // Remove a line if on the second line and pressing Backspace
      if (isMultiLineAndEmpty && cursorPosition > 0) {
        e.preventDefault();
        const newText =
          textarea.value.slice(0, cursorPosition - 1) +
          textarea.value.slice(cursorPosition);
        updateQuestions((draft) => {
          draft[currentIndex].text = newText;
        });
        adjustHeight();
        return;
      }

      // Delete question if it is completely empty
      if (question.text.trim() === "") {
        e.preventDefault();
        if (questions.length > 1) {
          if (currentIndex === 0) {
            // Delete first question and focus the new first question
            updateQuestions((draft) => {
              draft.splice(currentIndex, 1);
            });
            const newFirstRef = questionRefs.current[questions[1].id];
            if (newFirstRef?.current) {
              newFirstRef.current.focus();
              newFirstRef.current.setSelectionRange(0, 0);
            }
          } else {
            // Delete current question and focus previous question
            updateQuestions((draft) => {
              draft.splice(currentIndex, 1);
            });
            setTimeout(() => {
              const prevQuestion = questions[currentIndex - 1];
              const prevRef = questionRefs.current[prevQuestion.id];
              if (prevRef?.current) {
                prevRef.current.focus();
                const position = prevRef.current.value.length;
                prevRef.current.setSelectionRange(position, position);
              }
            }, 0);
          }
        }
        return;
      }
    }

    // Get text before cursor
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    // Split text before cursor into lines
    const linesBeforeCursor = textBeforeCursor.split("\n");
    // Current line number (0-based)
    const currentLineNumber = linesBeforeCursor.length - 1;

    // Total lines in the current textarea
    const totalLines = textarea.value.split("\n").length;

    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      // Handle Enter key
      e.preventDefault();
      if (
        question.text.trim() !== "" &&
        (!questions[currentIndex + 1] ||
          questions[currentIndex + 1].text.trim() !== "")
      ) {
        const newQuestion = {
          id: Date.now().toString(),
          text: "",
          answered: false,
          highlighted: false,
        };
        updateQuestions((draft) => {
          draft.splice(currentIndex + 1, 0, newQuestion);
        });
        setTimeout(() => {
          const newRef = questionRefs.current[newQuestion.id];
          if (newRef?.current) {
            newRef.current.focus();
            newRef.current.setSelectionRange(0, 0);
          }
        }, 0);
      }
    } else if (
      e.key === "ArrowDown" &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.altKey
    ) {
      const isAtLastLine = currentLineNumber === totalLines - 1;

      if (isAtLastLine) {
        // Cursor is at last line, move focus to next textarea
        e.preventDefault();
        if (currentIndex < questions.length - 1) {
          const nextQuestion = questions[currentIndex + 1];
          const nextRef = questionRefs.current[nextQuestion.id];
          if (nextRef?.current) {
            nextRef.current.focus();

            // Place cursor at the end of the first line in the next textarea
            const nextTextarea = nextRef.current;
            const nextTextLines = nextTextarea.value.split("\n");

            // First line index (0)
            const lineIndex = 0;
            let position = 0;
            for (let i = 0; i <= lineIndex; i++) {
              position += nextTextLines[i]?.length ?? 0;
              if (i < lineIndex) position += 1; // +1 for newline
            }
            nextTextarea.setSelectionRange(position, position);
          }
        }
      } else {
        // Allow default behavior (move cursor down within textarea)
      }
    } else if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      const isAtFirstLine = currentLineNumber === 0;

      if (isAtFirstLine) {
        // Cursor is at first line, move focus to previous textarea
        e.preventDefault();
        if (currentIndex > 0) {
          const prevQuestion = questions[currentIndex - 1];
          const prevRef = questionRefs.current[prevQuestion.id];
          if (prevRef?.current) {
            prevRef.current.focus();

            // Place cursor at the end of the last line in the previous textarea
            const prevTextarea = prevRef.current;
            const prevTextLines = prevTextarea.value.split("\n");

            // Last line index
            const lineIndex = prevTextLines.length - 1;
            let position = 0;
            for (let i = 0; i <= lineIndex; i++) {
              position += prevTextLines[i]?.length ?? 0;
              if (i < lineIndex) position += 1; // +1 for newline
            }
            prevTextarea.setSelectionRange(position, position);
          }
        }
      } else {
        // Allow default behavior (move cursor up within textarea)
      }
    } else if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      // Handle Tab key
      e.preventDefault();
      if (currentIndex < questions.length - 1) {
        // Not the last question
        const nextQuestion = questions[currentIndex + 1];
        const nextRef = questionRefs.current[nextQuestion.id];
        if (nextRef?.current) {
          nextRef.current.focus();

          // Set cursor at the end of the text in the next textarea
          const nextTextarea = nextRef.current;
          const position = nextTextarea.value.length;
          nextTextarea.setSelectionRange(position, position);
        }
      } else {
        // Last textarea
        if (question.text.trim() !== "") {
          // Text is not empty, add new question
          const newQuestion = {
            id: Date.now().toString(),
            text: "",
            answered: false,
            highlighted: false,
          };
          updateQuestions((draft) => {
            draft.push(newQuestion);
          });
          setTimeout(() => {
            const newRef = questionRefs.current[newQuestion.id];
            if (newRef?.current) {
              newRef.current.focus();
              // Cursor at position 0 in new empty textarea
              newRef.current.setSelectionRange(0, 0);
            }
          }, 0);
        } else {
          // Text is empty, do nothing
          // No action needed
        }
      }
    } else if (e.key === "Tab" && e.shiftKey && !e.ctrlKey && !e.altKey) {
      // Handle Shift+Tab key
      e.preventDefault();
      if (currentIndex > 0) {
        const prevQuestion = questions[currentIndex - 1];
        const prevRef = questionRefs.current[prevQuestion.id];
        if (prevRef?.current) {
          prevRef.current.focus();

          // Set cursor at the end of the text in the previous textarea
          const prevTextarea = prevRef.current;
          const position = prevTextarea.value.length;
          prevTextarea.setSelectionRange(position, position);
        }
      }
    }
    // Shift+Enter is not handled here to allow default behavior (line break)
  };

  return (
    <div
      style={style}
      className={`flex items-center space-y-1.5 pt-0 ${bgColor}`}
      data-testid={`question-item-${question.id}`}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="cursor-grab text-2xl opacity-0 transition-opacity hover:text-gray-500 hover:opacity-100"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        data-testid="reorder-button"
      >
        &#9776;
      </div>
      <Checkbox
        checked={question.answered}
        color={"blue-gray"}
        onChange={() => {
          if (question.answered) {
            // If already answered, just uncheck it
            updateQuestions((draft) => {
              const idx = draft.findIndex((q) => q.id === question.id);
              if (idx !== -1) {
                draft[idx].answered = false;
              }
            });
          } else if (!question.highlighted) {
            // First click: highlight the question only if it's not already highlighted
            updateQuestions((draft) => {
              draft.forEach((q) => (q.highlighted = false)); // Remove highlight from other questions
              const idx = draft.findIndex((q) => q.id === question.id);
              if (idx !== -1) {
                draft[idx].highlighted = true;
              }
            });
          } else {
            // Second click when highlighted: mark as answered and remove highlight
            updateQuestions((draft) => {
              const idx = draft.findIndex((q) => q.id === question.id);
              if (idx !== -1) {
                draft[idx].answered = true;
                draft[idx].highlighted = false;
              }
            });
          }
        }}
        ripple={false}
        className="p-0 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
      <textarea
        ref={textareaRef}
        spellCheck={false}
        className={`${baseClasses} ${textColor} overflow-hidden bg-transparent pr-2 ${
          question.answered ? "line-through" : ""
        }`}
        data-highlighted={question.highlighted}
        value={question.text}
        onChange={(e) => {
          const newText = e.target.value;
          updateQuestions((draft) => {
            const idx = draft.findIndex((q) => q.id === question.id);
            if (idx !== -1) {
              draft[idx].text = newText;
            }
          });
          adjustHeight();
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyPress}
        rows={1}
      />
    </div>
  );
};

export default QuestionItem;
