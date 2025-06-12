// frontend/src/components/code/code-editor.tsx
'use client'

import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'

interface CodeEditorProps {
  language: string
  value: string
  onChange: (value: string) => void
  theme?: 'vs-dark' | 'vs-light'
  height?: string
  readOnly?: boolean
  minimap?: boolean
  lineNumbers?: boolean
}

export function CodeEditor({
  language,
  value,
  onChange,
  theme = 'vs-dark',
  height = '400px',
  readOnly = false,
  minimap = true,
  lineNumbers = true
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (editorRef.current) {
      // Initialize Monaco Editor
      monacoRef.current = monaco.editor.create(editorRef.current, {
        value,
        language: getMonacoLanguage(language),
        theme,
        readOnly,
        minimap: { enabled: minimap },
        lineNumbers: lineNumbers ? 'on' : 'off',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Fira Code, Monaco, "Courier New", monospace',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: language === 'python' ? 4 : 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        parameterHints: { enabled: true },
        folding: true,
        showFoldingControls: 'always',
        bracketPairColorization: { enabled: true },
        guides: {
          indentation: true,
          bracketPairs: true
        }
      })

      // Handle content changes
      const onChangeHandler = monacoRef.current.onDidChangeModelContent(() => {
        const currentValue = monacoRef.current?.getValue() || ''
        onChange(currentValue)
      })

      return () => {
        onChangeHandler.dispose()
        monacoRef.current?.dispose()
      }
    }
  }, [])

  // Update value when prop changes
  useEffect(() => {
    if (monacoRef.current && monacoRef.current.getValue() !== value) {
      monacoRef.current.setValue(value)
    }
  }, [value])

  // Update language when prop changes
  useEffect(() => {
    if (monacoRef.current) {
      const model = monacoRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, getMonacoLanguage(language))
      }
    }
  }, [language])

  // Update theme when prop changes
  useEffect(() => {
    monaco.editor.setTheme(theme)
  }, [theme])

  return (
    <div 
      ref={editorRef} 
      style={{ height }}
      className="border rounded-md overflow-hidden"
    />
  )
}

// Map our language names to Monaco language identifiers
function getMonacoLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    'python': 'python',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'csharp',
    'go': 'go',
    'rust': 'rust',
    'php': 'php',
    'ruby': 'ruby',
    'scala': 'scala',
    'kotlin': 'kotlin',
    'swift': 'swift'
  }
  
  return languageMap[language] || 'plaintext'
}

// Code templates for different languages
export const CODE_TEMPLATES = {
  python: `def solution():
    # Write your code here
    pass

# Example usage
if __name__ == "__main__":
    result = solution()
    print(result)`,

  javascript: `function solution() {
    // Write your code here
}

// Example usage
console.log(solution());`,

  java: `public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        // Test your solution here
    }
    
    public int solution() {
        // Write your code here
        return 0;
    }
}`,

  cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    int solution() {
        // Write your code here
        return 0;
    }
};

int main() {
    Solution sol;
    // Test your solution here
    return 0;
}`,

  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int solution() {
    // Write your code here
    return 0;
}

int main() {
    // Test your solution here
    printf("%d\\n", solution());
    return 0;
}`,

  csharp: `using System;

public class Solution 
{
    public static void Main(string[] args) 
    {
        Solution sol = new Solution();
        // Test your solution here
    }
    
    public int Solution() 
    {
        // Write your code here
        return 0;
    }
}`,

  go: `package main

import "fmt"

func solution() int {
    // Write your code here
    return 0
}

func main() {
    result := solution()
    fmt.Println(result)
}`,

  rust: `fn solution() -> i32 {
    // Write your code here
    0
}

fn main() {
    let result = solution();
    println!("{}", result);
}`,

  typescript: `function solution(): number {
    // Write your code here
    return 0;
}

// Example usage
console.log(solution());`
}

// Language-specific settings
export const LANGUAGE_SETTINGS = {
  python: {
    tabSize: 4,
    insertSpaces: true,
    comments: { lineComment: '#' }
  },
  javascript: {
    tabSize: 2,
    insertSpaces: true,
    comments: { lineComment: '//', blockComment: ['/*', '*/'] }
  },
  typescript: {
    tabSize: 2,
    insertSpaces: true,
    comments: { lineComment: '//', blockComment: ['/*', '*/'] }
  },
  java: {
    tabSize: 4,
    insertSpaces: true,
    comments: { lineComment: '//', blockComment: ['/*', '*/'] }
  },
  cpp: {
    tabSize: 4,
    insertSpaces: true,
    comments: { lineComment: '//', blockComment: ['/*', '*/'] }
  },
  c: {
    tabSize: 4,
    insertSpaces: true,
    comments: { lineComment: '//', blockComment: ['/*', '*/'] }
  },
  csharp: {
    tabSize: 4,
    insertSpaces: true,
    comments: { lineComment: '//', blockComment: ['/*', '*/'] }
  },
  go: {
    tabSize: 4,
    insertSpaces: false, // Go uses tabs
    comments: { lineComment: '//', blockComment: ['/*', '*/'] }
  },
  rust: {
    tabSize: 4,
    insertSpaces: true,
    comments: { lineComment: '//', blockComment: ['/*', '*/'] }
  }
}